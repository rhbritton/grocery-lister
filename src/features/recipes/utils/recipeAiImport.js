import { ALLOWED_INGREDIENT_TYPES } from '../constants/ingredientTypes.js';

export const RECIPE_AI_IMPORT_PROMPT = `You are a professional chef and meal planner specializing in breaking down potentially messy recipes for casual cooking parents into highly accessible, streamlined formats.

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

6. **Instruction Recovery & Formatting**: Reconstruct smeared, faint, or shorthand handwritten steps into clean, simple, grammatically correct plain English sentences. Flatten the instructions into a single string, separating distinct chronological steps using exactly two newline characters ("\n\n"). If it is more clear to the user, actively break long paragraphs into individual, logical cooking steps within the single "instructions" string. Strip out extraneous personal notes written on the card (e.g., "Grandma's favorite!").

After this message, I will send the recipe URL or image.`;

export function stripJsonFences(text) {
  const trimmed = String(text || '').trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

export function normalizeIngredientType(type) {
  if (type == null) return '';
  const normalized = String(type).trim().toLowerCase();
  return ALLOWED_INGREDIENT_TYPES.has(normalized) ? normalized : '';
}

function normalizeIngredient(ingredient, index) {
  if (!ingredient || typeof ingredient !== 'object') {
    throw new Error(`Ingredient ${index + 1} must be an object.`);
  }

  const amount = String(ingredient.amount ?? '1').trim() || '1';
  const name = String(ingredient.name ?? '').trim();

  if (!name) {
    throw new Error(`Ingredient ${index + 1} is missing a name.`);
  }

  return {
    amount,
    name,
    type: normalizeIngredientType(ingredient.type),
  };
}

export function parseRecipeImportJson(rawText) {
  const jsonText = stripJsonFences(rawText);

  if (!jsonText) {
    return { ok: false, error: 'Paste JSON from your AI assistant first.' };
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { ok: false, error: 'Invalid JSON. Copy only the JSON object from your AI.' };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'JSON must be an object with name, ingredients, and instructions.' };
  }

  const name = String(parsed.name ?? '').trim();
  if (!name) {
    return { ok: false, error: 'Recipe name is required.' };
  }

  if (!Array.isArray(parsed.ingredients) || parsed.ingredients.length === 0) {
    return { ok: false, error: 'At least one ingredient is required.' };
  }

  try {
    const ingredients = parsed.ingredients.map(normalizeIngredient);
    const instructions =
      parsed.instructions == null ? '' : String(parsed.instructions).trim();

    return {
      ok: true,
      recipe: { name, ingredients, instructions },
    };
  } catch (error) {
    return { ok: false, error: error.message || 'Could not read ingredients.' };
  }
}
