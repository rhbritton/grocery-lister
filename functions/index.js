const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { logger } = require('firebase-functions');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const {
  profilePath,
  buildUsage,
  FREE_AI_IMPORT_LIMIT,
} = require('./aiImportQuota');

initializeApp();

const geminiApiKey = defineSecret('GEMINI_API_KEY');
const GEMINI_MODEL = 'gemini-2.5-flash';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MAX_SOURCE_TEXT_LENGTH = 20_000;
const MAX_IMAGE_BASE64_LENGTH = 5_500_000; // ~4MB binary

const ALLOWED_INGREDIENT_TYPES = new Set(['', 'dairy', 'freezer', 'meat', 'produce', 'pantry']);

const RECIPE_AI_IMPORT_PROMPT = `You are a professional chef and meal planner specializing in breaking down potentially messy recipes for casual cooking parents into highly accessible, streamlined formats.

Return ONLY a valid JSON object matching the schema below. Do not include markdown code blocks, explanations, or trailing commentary.

### JSON Schema
{
  "name": string,
  "ingredients": [
    { 
      "amount": string, 
      "name": string, 
      "type": "produce" | "meat" | "dairy" | "freezer" | "pantry" | "" 
    }
  ],
  "instructions": string
}

### Parsing & Optimization Rules
1. **Streamlining & Liberties**: You are permitted to take minor liberties to maximize simplicity for a casual cook or busy family, provided you remain fundamentally faithful to the original dish. If the handwritten text includes overly complex, archaic, or redundant prep steps, streamline them into the most straightforward modern equivalent.

2. **Unit Abbreviation Standard**: Convert all volume and weight units to standard lowercase abbreviations. Do not use full names or plural variations.
   * "teaspoon", "teaspoons", "tsp.", "t" -> "tsp"
   * "tablespoon", "tablespoons", "tbsp.", "T", "Tbs" -> "tbsp"
   * "ounce", "ounces", "oz." -> "oz"
   * "pound", "pounds", "lb", "lbs." -> "lb"
   * "cup", "cups", "c." -> "cup"

3. **Amount Normalization & Omission Repair**: Retain fractional strings (e.g., "1/2", "3/4"). If a handwritten amount is illegible, omitted, or listed as a dash, intelligently infer a logical culinary default based on the recipe context (e.g., "1 pinch" or "to taste" for salt/spices; "1" for a singular logical item). Never leave the amount field empty.

4. **Ingredient Standardization (Noun, Modifier)**: Clean and standardize ingredient names into a database-friendly "Noun, Modifier" format. Strip out bullet points or structural inline instructions.
   * *Examples:* "red onion" -> "onions, red"; "shredded cheddar cheese" -> "cheese, shredded cheddar"; "finely chopped celery" -> "celery, finely chopped".

5. **Categorization**: Predict the grocery aisle ("type"). Default to "pantry" for dry baking goods, spices, oils, and shelf-stable items, or "" if completely ambiguous.

6. **Instruction Recovery & Formatting**: Reconstruct smeared, faint, or shorthand handwritten steps into clean, simple, grammatically correct plain English sentences. Flatten the instructions into a single string, separating distinct chronological steps using exactly two newline characters ("\\n\\n"). If it is more clear to the user, actively break long paragraphs into individual, logical cooking steps within the single "instructions" string. Strip out extraneous personal notes written on the card (e.g., "Grandma's favorite!").

After this message, I will send the recipe URL or image.`;

const RECIPE_AI_IMPORT_SIMPLIFY_ADDENDUM = `

### Extra mode: Simplify (when enabled)
Apply these on top of the rules above — prioritize brevity:
1. Write each instruction step as 1 short sentence (about 8–14 words when possible). Prefer "Heat oil in a pan." over long compound sentences.
2. Break multi-action sentences into separate steps. If one original paragraph does chop → cook → season, output three steps separated by "\\n\\n".
3. One clear action per step. Move prep details into their own earlier steps when helpful (e.g. "Dice the onion." then "Add onion to the pan.").
4. Keep every essential ingredient and cooking fact — do not drop ingredients, quantities, times, temperatures, or techniques needed to make the dish correctly.
5. Cut filler, tips, stories, garnish notes, and "meanwhile" asides unless required for the result.
6. Prefer everyday wording over fancy chef language when the meaning stays the same.`;

const RECIPE_JSON_SCHEMA = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' },
    ingredients: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          amount: { type: 'STRING' },
          name: { type: 'STRING' },
          type: { type: 'STRING' },
        },
        required: ['amount', 'name', 'type'],
      },
    },
    instructions: { type: 'STRING' },
  },
  required: ['name', 'ingredients', 'instructions'],
};

function getPrompt(simplify) {
  return simplify
    ? `${RECIPE_AI_IMPORT_PROMPT}${RECIPE_AI_IMPORT_SIMPLIFY_ADDENDUM}`
    : RECIPE_AI_IMPORT_PROMPT;
}

function assertAiImportAllowed(auth) {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in to import recipes.');
  }
}

async function readUsageForUid(uid) {
  const db = getFirestore();
  const snap = await db.doc(profilePath(uid)).get();
  return buildUsage(snap.exists ? snap.data() : {});
}

function assertHasSharedCredits(usage) {
  if ((usage.remaining ?? 0) <= 0) {
    throw new HttpsError(
      'resource-exhausted',
      `You've used all ${usage.limit || FREE_AI_IMPORT_LIMIT} free shared AI imports. Add your own Gemini key in Account for unlimited imports.`
    );
  }
}

async function incrementSharedImportUsage(uid) {
  const db = getFirestore();
  const ref = db.doc(profilePath(uid));

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : {};
    const usage = buildUsage(data);
    assertHasSharedCredits(usage);

    const nextUsed = usage.used + 1;
    const patch = {
      uid,
      aiImportUsed: nextUsed,
      aiImportPlan: 'free',
      aiImportLimit: usage.limit,
      aiImportUpdatedAt: FieldValue.serverTimestamp(),
    };

    tx.set(ref, patch, { merge: true });

    return buildUsage({
      ...data,
      ...patch,
      aiImportUsed: nextUsed,
    });
  });
}

function stripJsonFences(text) {
  const trimmed = String(text || '').trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function normalizeIngredientType(type) {
  if (type == null) return '';
  const normalized = String(type).trim().toLowerCase();
  return ALLOWED_INGREDIENT_TYPES.has(normalized) ? normalized : '';
}

function parseRecipeImportJson(rawText) {
  const jsonText = stripJsonFences(rawText);
  if (!jsonText) {
    throw new HttpsError('internal', 'Gemini returned an empty recipe.');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new HttpsError('internal', 'Gemini returned invalid JSON.');
  }

  const name = String(parsed?.name ?? '').trim();
  if (!name) {
    throw new HttpsError('internal', 'Gemini recipe was missing a name.');
  }

  if (!Array.isArray(parsed.ingredients) || parsed.ingredients.length === 0) {
    throw new HttpsError('internal', 'Gemini recipe had no ingredients.');
  }

  const ingredients = parsed.ingredients.map((ingredient, index) => {
    if (!ingredient || typeof ingredient !== 'object') {
      throw new HttpsError('internal', `Ingredient ${index + 1} was invalid.`);
    }
    const amount = String(ingredient.amount ?? '1').trim() || '1';
    const ingredientName = String(ingredient.name ?? '').trim();
    if (!ingredientName) {
      throw new HttpsError('internal', `Ingredient ${index + 1} was missing a name.`);
    }
    return {
      amount,
      name: ingredientName,
      type: normalizeIngredientType(ingredient.type),
    };
  });

  return {
    name,
    ingredients,
    instructions: parsed.instructions == null ? '' : String(parsed.instructions).trim(),
  };
}

function buildTextUserMessage(sourceText) {
  if (!sourceText?.trim()) {
    return 'Extract the recipe from the attached image.';
  }
  return `Extract the recipe from the following source:\n\n${sourceText.trim()}`;
}

function getResponseText(responseBody) {
  if (responseBody.promptFeedback?.blockReason) {
    throw new HttpsError(
      'invalid-argument',
      'That recipe content was blocked. Try a different link, photo, or text.'
    );
  }

  const candidate = responseBody.candidates?.[0];
  if (candidate?.finishReason === 'SAFETY') {
    throw new HttpsError(
      'invalid-argument',
      'That recipe content was blocked. Try a different link, photo, or text.'
    );
  }

  const parts = candidate?.content?.parts || [];
  const text = parts
    .filter((part) => !part.thought)
    .map((part) => part.text)
    .filter(Boolean)
    .join('')
    .trim();

  if (!text) {
    throw new HttpsError(
      'internal',
      'AI did not return a recipe. Try again, or use a different source.'
    );
  }

  return text;
}

function mapGeminiHttpFailure(status, responseBody) {
  const raw = String(responseBody?.error?.message || '');
  const apiStatus = String(responseBody?.error?.status || '');
  const combined = `${raw} ${apiStatus}`;

  logger.error('Gemini API request failed', {
    httpStatus: status,
    apiStatus: apiStatus || null,
    message: raw.slice(0, 500) || null,
  });

  if (
    status === 429 ||
    /RESOURCE_EXHAUSTED|quota|rate limit|credits? (are )?depleted|prepayment|billing/i.test(combined)
  ) {
    return new HttpsError(
      'resource-exhausted',
      'AI import is temporarily out of capacity. Try again in a few minutes.'
    );
  }

  if (
    status === 401 ||
    status === 403 ||
    /UNAUTHENTICATED|PERMISSION_DENIED|API[_ ]?KEY|invalid.*credential|OAuth|login cookie/i.test(
      combined
    )
  ) {
    return new HttpsError(
      'failed-precondition',
      'Shared AI import is temporarily unavailable. Try again later, or add a personal Gemini key in Account.'
    );
  }

  if (status === 400 || /INVALID_ARGUMENT/i.test(apiStatus)) {
    return new HttpsError(
      'invalid-argument',
      'Could not read that recipe. Try a clearer photo or paste the recipe text instead.'
    );
  }

  return new HttpsError(
    'internal',
    'Could not extract the recipe. Try again, or use a different link, photo, or text.'
  );
}

async function callGemini({ apiKey, modelName, userParts, systemInstruction }) {
  let response;
  try {
    response = await fetch(
      `${GEMINI_API_BASE}/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: userParts }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: RECIPE_JSON_SCHEMA,
          },
        }),
      }
    );
  } catch (networkError) {
    logger.error('Gemini network error', {
      message: networkError?.message || String(networkError),
    });
    throw new HttpsError(
      'unavailable',
      'Could not reach AI import. Check your connection and try again.'
    );
  }

  const responseBody = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw mapGeminiHttpFailure(response.status, responseBody);
  }

  return parseRecipeImportJson(getResponseText(responseBody));
}

exports.getAiImportUsage = onCall(async (request) => {
  assertAiImportAllowed(request.auth);
  const usage = await readUsageForUid(request.auth.uid);
  return { usage };
});

exports.importRecipeWithAi = onCall(
  {
    secrets: [geminiApiKey],
    timeoutSeconds: 120,
    memory: '512MiB',
    maxInstances: 20,
  },
  async (request) => {
    assertAiImportAllowed(request.auth);

    const sourceText = String(request.data?.sourceText || '').slice(0, MAX_SOURCE_TEXT_LENGTH);
    const imageBase64 = String(request.data?.imageBase64 || '');
    const mimeType = String(request.data?.mimeType || 'image/jpeg');
    const simplify = Boolean(request.data?.simplify);
    const hasImage = Boolean(imageBase64);
    const hasText = Boolean(sourceText.trim());

    logger.info('importRecipeWithAi start', {
      uid: request.auth?.uid || null,
      hasText,
      hasImage,
      simplify,
      sourceTextLength: sourceText.length,
      imageBase64Length: imageBase64.length,
    });

    try {
      if (!hasText && !hasImage) {
        throw new HttpsError('invalid-argument', 'Provide recipe text or a photo.');
      }

      if (imageBase64 && imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
        throw new HttpsError('invalid-argument', 'Photo is too large. Try a smaller image.');
      }

      const usageBefore = await readUsageForUid(request.auth.uid);
      assertHasSharedCredits(usageBefore);

      const userParts = [{ text: buildTextUserMessage(sourceText) }];
      if (hasImage) {
        userParts.push({
          inlineData: {
            mimeType: mimeType.startsWith('image/') ? mimeType : 'image/jpeg',
            data: imageBase64,
          },
        });
      }

      const apiKey = String(geminiApiKey.value() || '').trim();
      if (!apiKey) {
        logger.error('GEMINI_API_KEY secret is empty');
        throw new HttpsError(
          'failed-precondition',
          'Shared AI import is not configured yet. Add a personal Gemini key in Account, or try again later.'
        );
      }

      const recipe = await callGemini({
        apiKey,
        modelName: GEMINI_MODEL,
        userParts,
        systemInstruction: getPrompt(simplify),
      });

      const usage = await incrementSharedImportUsage(request.auth.uid);

      logger.info('importRecipeWithAi success', {
        uid: request.auth?.uid || null,
        ingredientCount: recipe?.ingredients?.length || 0,
        usage,
      });

      return { recipe, usage };
    } catch (error) {
      if (error instanceof HttpsError) {
        logger.error('importRecipeWithAi failed', {
          code: error.code,
          message: error.message,
          uid: request.auth?.uid || null,
        });
        throw error;
      }

      logger.error('importRecipeWithAi unexpected error', {
        message: error?.message || String(error),
        uid: request.auth?.uid || null,
      });
      throw new HttpsError(
        'internal',
        'Could not extract the recipe. Try again, or use a different link, photo, or text.'
      );
    }
  }
);

