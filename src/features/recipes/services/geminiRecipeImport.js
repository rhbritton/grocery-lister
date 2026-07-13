import {
  RECIPE_AI_IMPORT_PROMPT,
  parseRecipeImportJson,
} from '../utils/recipeAiImport.js';

export const DEFAULT_GEMINI_MODEL =
  process.env.REACT_APP_GEMINI_MODEL || 'gemini-2.5-flash';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export function getGeminiModelCandidates() {
  return [
    ...new Set(
      [
        process.env.REACT_APP_GEMINI_MODEL,
        DEFAULT_GEMINI_MODEL,
        'gemini-2.5-flash',
        'gemini-1.5-flash',
        'gemini-2.0-flash',
      ].filter(Boolean)
    ),
  ];
}

const URL_CONTEXT_MODELS = ['gemini-2.5-flash'];

export function getGeminiUrlModelCandidates() {
  const envModel = process.env.REACT_APP_GEMINI_MODEL;
  const preferredEnvModel =
    envModel && URL_CONTEXT_MODELS.includes(envModel) ? [envModel] : [];

  return [...new Set([...preferredEnvModel, ...URL_CONTEXT_MODELS])];
}

const MAX_SOURCE_TEXT_LENGTH = 20_000;
const MIN_URL_FETCH_TEXT_LENGTH = 40;

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

export function looksLikeUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

export function resolveRecipeSourceInput(input) {
  const trimmed = String(input || '').trim();
  if (!trimmed) {
    return { type: 'empty' };
  }

  if (looksLikeUrl(trimmed)) {
    return { type: 'url', url: trimmed };
  }

  return { type: 'text', text: trimmed.slice(0, MAX_SOURCE_TEXT_LENGTH) };
}

export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No image selected.'));
      return;
    }

    if (!file.type?.startsWith('image/')) {
      reject(new Error('Please choose an image file.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string' || !dataUrl.includes(',')) {
        reject(new Error('Could not read the image.'));
        return;
      }

      resolve({
        base64: dataUrl.split(',')[1],
        mimeType: file.type,
        name: file.name,
      });
    };
    reader.onerror = () => reject(new Error('Could not read the image.'));
    reader.readAsDataURL(file);
  });
}

function buildTextUserMessage(sourceText) {
  if (!sourceText?.trim()) {
    return 'Extract the recipe from the attached image.';
  }

  return `Extract the recipe from the following source:\n\n${sourceText.trim()}`;
}

function buildUrlDirectUserMessage(url) {
  return `Extract the recipe from this URL:\n\n${url}`;
}

function buildUrlStructuredUserMessage(url, recipeText) {
  return (
    `Extract the recipe from the following content fetched from ${url}. ` +
    `Use only recipe information present in the source — do not invent ingredients.\n\n` +
    recipeText.trim()
  );
}

export const URL_API_BLOCKED_MESSAGE =
  'Gemini API could not fetch that URL (Gemini web often still can). Use Manual import below — copy the prompt into Gemini with your link, then fill form from JSON.';

export function looksLikeUrlContextAccessFailure(rawText) {
  return /webpage content could not be accessed|could not (?:access|retrieve|fetch) (?:the )?(?:webpage|page|content|url)|unable to access (?:the )?(?:webpage|page|url)|might be due to paywalls|url context.*(?:failed|blocked|unable)/i.test(
    String(rawText || '')
  );
}

export function looksLikeUrlFetchFailure(rawText) {
  const trimmed = String(rawText || '').trim();
  if (!trimmed || trimmed.length < MIN_URL_FETCH_TEXT_LENGTH) {
    return true;
  }

  if (/^NO_RECIPE_FOUND$/i.test(trimmed)) {
    return true;
  }

  if (looksLikeUrlContextAccessFailure(trimmed)) {
    return true;
  }

  // Only treat short, clearly error-only responses as failures.
  if (
    trimmed.length < 280 &&
    /^(?:I )?(?:cannot|can't) (?:access|read|open)\b|paywall|login required|page not found/i.test(
      trimmed
    )
  ) {
    return true;
  }

  return false;
}

function buildGenerateContentBody({ userParts, mode = 'structured' }) {
  const body = {
    contents: [
      {
        role: 'user',
        parts: userParts,
      },
    ],
  };

  if (mode === 'url-import') {
    // Same flow as manual Gemini: full recipe prompt + URL context, JSON in the reply.
    body.systemInstruction = {
      parts: [{ text: RECIPE_AI_IMPORT_PROMPT }],
    };
    body.tools = [{ urlContext: {} }];
    return body;
  }

  if (mode === 'structured') {
    body.systemInstruction = {
      parts: [{ text: RECIPE_AI_IMPORT_PROMPT }],
    };
    body.generationConfig = {
      responseMimeType: 'application/json',
      responseSchema: RECIPE_JSON_SCHEMA,
    };
  }

  return body;
}

function isLikelyKeyRestrictionError(message, status) {
  return (
    /invalid api key|API_KEY_INVALID|API key not valid/i.test(message) ||
    status === 401 ||
    (status === 400 && /api key/i.test(message))
  );
}

function isLocalDevHost() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

export function getGeminiImportErrorMessage(error) {
  const message = getGeminiErrorDetails(error);
  const status = error?.status;

  if (/quota|resource_exhausted|429/i.test(message) || status === 429) {
    if (/limit:\s*0|free_tier.*limit|free_tier/i.test(message)) {
      return 'Gemini free tier is not active for this key yet. In Google AI Studio, open your project → Set up billing (you can stay on free limits). Then retry Test connection.';
    }
    return 'Gemini rate limit hit (429). Wait a few minutes, then retry. If this keeps happening, enable billing in AI Studio (free limits still apply) or use Manual import below.';
  }

  if (/limit:\s*0|free.?tier.*limit|free_tier/i.test(message)) {
    return 'Gemini free tier is not active for this key yet. In Google AI Studio, open your project → Set up billing (you can stay on free limits). Then retry Test connection.';
  }

  if (/referer|referrer|application restriction|API_KEY_HTTP_REFERRER|IP address restriction/i.test(message)) {
    return keyRestrictionHelpMessage();
  }

  if (
    /SERVICE_DISABLED|has not been used|accessNotConfigured|PERMISSION_DENIED|API has not been enabled/i.test(
      message
    ) ||
    (status === 403 && !/invalid api key|API_KEY_INVALID/i.test(message))
  ) {
    if (/billing/i.test(message)) {
      return 'Gemini requires billing setup on your Google project (free tier still applies). In AI Studio, open your API key project → Set up billing.';
    }
    return 'Gemini access denied for this key/project. Enable billing in AI Studio, ensure the Generative Language API is enabled, and use an unrestricted key for local testing.';
  }

  if (isLikelyKeyRestrictionError(message, status)) {
    return keyRestrictionHelpMessage();
  }

  if (
    /Could not (load|read|fetch|retrieve|find).*URL|could not find a recipe at that URL|NO_RECIPE_FOUND|Gemini API could not fetch that URL/i.test(
      message
    )
  ) {
    return message.includes('Gemini API could not fetch')
      ? message
      : 'Gemini could not extract a recipe from that URL. Try Manual import below.';
  }

  if (/tool use with a response mime type.*application\/json.*unsupported/i.test(message)) {
    return 'Gemini could not import from that URL. Paste the recipe text or use a photo instead.';
  }

  if (/network|failed to fetch/i.test(message)) {
    return 'Network error talking to Gemini. Check your connection.';
  }

  if (/not found|404/i.test(message) || status === 404) {
    return 'Gemini model unavailable. Set REACT_APP_GEMINI_MODEL=gemini-2.5-flash in .env and restart the app.';
  }

  if (/blocked|safety/i.test(message)) {
    return 'Gemini blocked this content. Try a different photo or recipe text.';
  }

  if (message) {
    return message.length > 280 ? `${message.slice(0, 280)}…` : message;
  }

  return 'Could not import recipe with Gemini.';
}

function keyRestrictionHelpMessage() {
  const localHint = isLocalDevHost()
    ? ' For local dev, allow http://localhost:3000/* or set Application restrictions to None.'
    : ' Allow https://web.grocerylisterapp.com/* or set Application restrictions to None.';

  return (
    'Gemini rejected the API key for this app (often a restriction issue, not a bad key). ' +
    'In Google Cloud → APIs & Services → Credentials → your key: set Application restrictions to None, ' +
    'or create a new key in AI Studio (API keys → Create). Also confirm billing is set up on the project.' +
    localHint
  );
}

async function generateWithModelFallback(apiKey, buildRequest, modelCandidates = getGeminiModelCandidates()) {
  let lastError;

  for (const modelName of modelCandidates) {
    try {
      return await buildRequest(modelName);
    } catch (error) {
      lastError = error;
      if (shouldAbortModelFallback(error) || !isModelUnavailableError(error)) {
        throw error;
      }
    }
  }

  throw lastError || new Error('No Gemini models available for this key.');
}

function shouldAbortModelFallback(error) {
  const message = getGeminiErrorDetails(error);
  const status = error?.status;

  if ([401, 403, 429].includes(status)) {
    return true;
  }

  if (/quota|resource_exhausted|rate.?limit/i.test(message)) {
    return true;
  }

  if (isLikelyKeyRestrictionError(message, status)) {
    return true;
  }

  return false;
}

function isModelUnavailableError(error) {
  const message = getGeminiErrorDetails(error);
  const status = error?.status;

  if (status === 404) {
    return true;
  }

  return /models\/[^\s]+ is not found|model is not found|not found for API version|not supported for generatecontent/i.test(
    message
  );
}

export function getGeminiErrorDetails(error) {
  const parts = [
    error?.message,
    error?.statusText,
    error?.status != null ? String(error.status) : '',
  ];

  if (Array.isArray(error?.errorDetails)) {
    for (const detail of error.errorDetails) {
      if (detail?.message) parts.push(detail.message);
      if (detail?.reason) parts.push(detail.reason);
    }
  }

  return parts.filter(Boolean).join(' ');
}

function createGeminiApiError(responseBody, status) {
  const message =
    responseBody?.error?.message ||
    responseBody?.error?.status ||
    `Gemini request failed (HTTP ${status}).`;
  const error = new Error(message);
  error.status = status;
  error.errorDetails = responseBody?.error?.details;
  return error;
}

async function callGeminiGenerateContent({
  apiKey,
  modelName,
  userParts,
  mode = 'structured',
}) {
  const response = await fetch(
    `${GEMINI_API_BASE}/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildGenerateContentBody({ userParts, mode })),
    }
  );

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createGeminiApiError(responseBody, response.status);
  }

  return responseBody;
}

function getResponseText(responseBody) {
  if (responseBody.promptFeedback?.blockReason) {
    throw new Error('Gemini blocked this recipe content.');
  }

  const candidate = responseBody.candidates?.[0];
  if (candidate?.finishReason === 'SAFETY') {
    throw new Error('Gemini blocked this recipe content.');
  }

  const parts = candidate?.content?.parts || [];
  const text = parts
    .filter((part) => !part.thought)
    .map((part) => part.text)
    .filter(Boolean)
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini did not return a recipe. Try again with different input.');
  }

  return text;
}

async function parseRecipeFromResponseBody(responseBody) {
  const rawText = getResponseText(responseBody);
  const parsed = parseRecipeImportJson(rawText);

  if (!parsed.ok) {
    throw new Error(parsed.error);
  }

  return parsed.recipe;
}

export async function testGeminiApiKey(apiKey) {
  await generateWithModelFallback(apiKey, async (modelName) => {
    const responseBody = await callGeminiGenerateContent({
      apiKey,
      modelName,
      userParts: [{ text: 'Reply with the single word OK.' }],
      mode: 'plain',
    });

    if (!getResponseText(responseBody)) {
      throw new Error('Gemini did not respond.');
    }
  });
}

function createGeminiImportError(message, debug = {}) {
  const error = new Error(message);
  if (Object.keys(debug).length > 0) {
    error.geminiDebug = debug;
  }
  return error;
}

async function extractRecipeFromUrl(apiKey, url, modelName) {
  const responseBody = await callGeminiGenerateContent({
    apiKey,
    modelName,
    userParts: [{ text: buildUrlDirectUserMessage(url) }],
    mode: 'url-import',
  });

  const rawText = getResponseText(responseBody);
  const directParse = parseRecipeImportJson(rawText);
  if (directParse.ok) {
    return directParse.recipe;
  }

  if (looksLikeUrlFetchFailure(rawText)) {
    throw createGeminiImportError(
      looksLikeUrlContextAccessFailure(rawText)
        ? URL_API_BLOCKED_MESSAGE
        : 'Gemini could not find a recipe at that URL. Try Manual import below or paste the recipe text.',
      { model: modelName, step: 'url-import', url, preview: rawText.slice(0, 400) }
    );
  }

  try {
    return await extractRecipeFromContent(
      apiKey,
      [{ text: buildUrlStructuredUserMessage(url, rawText) }],
      modelName
    );
  } catch (error) {
    throw createGeminiImportError(error.message, {
      model: modelName,
      step: 'url-structured-fallback',
      url,
      preview: rawText.slice(0, 400),
    });
  }
}

async function extractRecipeFromContent(apiKey, userParts, modelName) {
  const responseBody = await callGeminiGenerateContent({
    apiKey,
    modelName,
    userParts,
    mode: 'structured',
  });

  return parseRecipeFromResponseBody(responseBody);
}

export async function extractRecipeWithGemini({
  apiKey,
  sourceInput = '',
  imageFile = null,
}) {
  if (!apiKey?.trim()) {
    throw new Error('Add your Gemini API key in Account settings first.');
  }

  const source = resolveRecipeSourceInput(sourceInput);
  const image = imageFile ? await readImageFile(imageFile) : null;

  if (source.type === 'empty' && !image) {
    throw new Error('Add a recipe URL, text, or photo to import.');
  }

  if (source.type === 'url') {
    return generateWithModelFallback(
      apiKey,
      (modelName) => extractRecipeFromUrl(apiKey, source.url, modelName),
      getGeminiUrlModelCandidates()
    );
  }

  const userParts = [{ text: buildTextUserMessage(source.type === 'text' ? source.text : '') }];

  if (image) {
    userParts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.base64,
      },
    });
  }

  return generateWithModelFallback(apiKey, (modelName) =>
    extractRecipeFromContent(apiKey, userParts, modelName)
  );
}
