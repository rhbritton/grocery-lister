import { httpsCallable, getFunctions } from 'firebase/functions';
import { app } from '../../../auth/firebaseConfig';
import { readImageFile } from './geminiRecipeImport.js';
import { getCallableErrorMessage } from './recipeAiImportErrors.js';
import { normalizeAiImportUsage } from '../utils/aiImportQuota.js';

export { getCallableErrorMessage } from './recipeAiImportErrors.js';

const functions = getFunctions(app);

function toUsage(raw) {
  if (!raw || typeof raw !== 'object') {
    return normalizeAiImportUsage({});
  }
  return normalizeAiImportUsage({
    aiImportUsed: raw.used,
    aiImportLimit: raw.limit,
    aiImportPlan: raw.plan,
  });
}

export async function fetchAiImportUsage() {
  try {
    const callable = httpsCallable(functions, 'getAiImportUsage');
    const result = await callable({});
    return toUsage(result?.data?.usage);
  } catch (error) {
    console.error('[AI import] Failed to load usage', {
      code: error?.code || null,
      message: error?.message || null,
      error,
    });
    throw new Error(getCallableErrorMessage(error));
  }
}

/**
 * Server-side Gemini import (app-owned API key).
 * Client still uses Jina for links, then sends extracted text here.
 * @returns {{ recipe: object, usage: object }}
 */
export async function importRecipeWithAiViaServer({
  sourceText = '',
  imageFile = null,
  simplify = false,
}) {
  let imageBase64 = '';
  let mimeType = '';

  if (imageFile) {
    const image = await readImageFile(imageFile);
    imageBase64 = image.base64;
    mimeType = image.mimeType;
  }

  if (!String(sourceText || '').trim() && !imageBase64) {
    throw new Error('Provide recipe text or a photo.');
  }

  try {
    const callable = httpsCallable(functions, 'importRecipeWithAi');
    const result = await callable({
      sourceText: String(sourceText || ''),
      imageBase64,
      mimeType,
      simplify: Boolean(simplify),
    });

    const recipe = result?.data?.recipe;
    if (!recipe?.name || !Array.isArray(recipe.ingredients)) {
      console.error('[AI import] Incomplete recipe from server', result?.data);
      throw new Error('Server returned an incomplete recipe. Try again.');
    }

    return {
      recipe,
      usage: toUsage(result?.data?.usage),
    };
  } catch (error) {
    const userMessage = getCallableErrorMessage(error);
    console.error('[AI import] Shared import failed', {
      code: error?.code || null,
      message: error?.message || null,
      details: error?.details || null,
      userMessage,
      error,
    });
    throw new Error(userMessage);
  }
}

export async function startAiImportCheckout() {
  try {
    const callable = httpsCallable(functions, 'createAiImportCheckoutSession');
    const result = await callable({});
    const url = result?.data?.url;
    if (!url) {
      throw new Error('Could not start checkout. Try again.');
    }
    return url;
  } catch (error) {
    console.error('[Billing] Checkout failed', error);
    throw new Error(
      getCallableErrorMessage(error, {
        fallback: 'Could not start checkout. Try again in a moment.',
      })
    );
  }
}

export async function openBillingPortal() {
  try {
    const callable = httpsCallable(functions, 'createBillingPortalSession');
    const result = await callable({});
    const url = result?.data?.url;
    if (!url) {
      throw new Error('Could not open billing portal. Try again.');
    }
    return url;
  } catch (error) {
    console.error('[Billing] Portal failed', error);
    throw new Error(
      getCallableErrorMessage(error, {
        fallback: 'Could not open billing portal. Try again in a moment.',
      })
    );
  }
}
