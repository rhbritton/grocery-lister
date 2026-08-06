import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faUpload } from '@fortawesome/free-solid-svg-icons';
import ModalShell from '../../../components/ModalShell.js';
import { getGeminiApiKey } from '../../../services/geminiApiKeyStorage.js';
import {
  extractRecipeWithGemini,
  getGeminiImportErrorMessage,
} from '../services/geminiRecipeImport.js';
import {
  fetchAiImportUsage,
  importRecipeWithAiViaServer,
  startAiImportCheckout,
} from '../services/recipeAiImportApi.js';
import { fetchPageTextWithJina, normalizeHttpUrl } from '../services/jinaReader.js';
import {
  formatAiImportRemaining,
  hasSharedAiImportCredits,
} from '../utils/aiImportQuota.js';
import { canUsePersonalGeminiKey } from '../../../utils/aiImportAccess.js';

const IMPORT_MODES = [
  { id: 'link', label: 'Link' },
  { id: 'photo', label: 'Photo' },
  { id: 'text', label: 'Text' },
];

function isClientValidationError(message) {
  return /valid website link|photo to import|paste recipe text/i.test(String(message || ''));
}

function RecipeAiImportModal({ onClose, onImport, userId, user = null }) {
  const fileInputRef = useRef(null);
  const [importMode, setImportMode] = useState('link');
  const [linkUrl, setLinkUrl] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [simplify, setSimplify] = useState(false);
  const [usage, setUsage] = useState(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);

  const allowPersonalKey = canUsePersonalGeminiKey(user);
  const hasApiKey = allowPersonalKey && Boolean(getGeminiApiKey(userId));
  const sharedCreditsLeft = hasSharedAiImportCredits(usage);
  const canUseSharedImport = sharedCreditsLeft;
  const canPrimaryImport = hasApiKey || canUseSharedImport;
  const remainingLabel = formatAiImportRemaining(usage);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setUsageLoading(true);
      try {
        const nextUsage = await fetchAiImportUsage();
        if (!cancelled) setUsage(nextUsage);
      } catch (loadError) {
        if (!cancelled) {
          console.error('[AI import] Usage load failed', loadError);
        }
      } finally {
        if (!cancelled) setUsageLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl('');
      return undefined;
    }

    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const applyRecipe = (recipe) => {
    onImport(recipe);
    onClose();
  };

  const prepareSource = async () => {
    if (importMode === 'link') {
      const normalized = normalizeHttpUrl(linkUrl);
      if (!normalized) {
        throw new Error('Enter a valid website link (https://…).');
      }

      setImportStatus('Reading page…');
      const pageText = await fetchPageTextWithJina(normalized);
      return { sourceInput: pageText, imageForImport: null };
    }

    if (importMode === 'photo') {
      if (!imageFile) {
        throw new Error('Choose a recipe photo to import.');
      }
      return { sourceInput: '', imageForImport: imageFile };
    }

    const trimmed = sourceText.trim();
    if (!trimmed) {
      throw new Error('Paste recipe text to import.');
    }
    return { sourceInput: trimmed, imageForImport: null };
  };

  const importWithPersonalKey = async (sourceInput, imageForImport) => {
    const apiKey = getGeminiApiKey(userId);
    if (!apiKey) {
      throw new Error('Add your Gemini API key in Account settings first.');
    }

    setImportStatus('Extracting with your key…');
    return extractRecipeWithGemini({
      apiKey,
      sourceInput,
      imageFile: imageForImport,
      simplify,
    });
  };

  const handleUpgrade = async () => {
    setError('');
    setIsStartingCheckout(true);
    try {
      const url = await startAiImportCheckout();
      window.location.assign(url);
    } catch (checkoutError) {
      setError(String(checkoutError?.message || 'Could not start upgrade.'));
      setIsStartingCheckout(false);
    }
  };

  const handleImport = async ({ preferPersonalKey = false } = {}) => {
    setError('');
    setImportStatus('');
    setIsImporting(true);

    try {
      const { sourceInput, imageForImport } = await prepareSource();
      const personalKey = allowPersonalKey ? getGeminiApiKey(userId) : null;
      const usePersonalFirst = allowPersonalKey && (preferPersonalKey || Boolean(personalKey));

      if (usePersonalFirst) {
        try {
          const recipe = await importWithPersonalKey(sourceInput, imageForImport);
          applyRecipe(recipe);
          return;
        } catch (personalError) {
          console.error('[AI import] Personal Gemini key failed', {
            mode: importMode,
            preferPersonalKey,
            message: personalError?.message || null,
            error: personalError,
          });
          if (preferPersonalKey) {
            throw personalError;
          }
          if (!canUseSharedImport) {
            throw new Error(
              "You've used all free shared AI imports. Upgrade for unlimited shared imports, or fix your personal Gemini key."
            );
          }
          setImportStatus('Your key failed — trying shared import…');
        }
      }

      if (!canUseSharedImport) {
        throw new Error(
          allowPersonalKey
            ? "You've used all free shared AI imports. Upgrade for unlimited, or add a personal Gemini key in Account."
            : "You've used all free shared AI imports. Upgrade to Plus for unlimited shared imports."
        );
      }

      setImportStatus('Extracting recipe…');
      const { recipe, usage: nextUsage } = await importRecipeWithAiViaServer({
        sourceText: sourceInput,
        imageFile: imageForImport,
        simplify,
      });
      if (nextUsage) setUsage(nextUsage);
      applyRecipe(recipe);
    } catch (importError) {
      console.error('[AI import] Import failed', {
        mode: importMode,
        preferPersonalKey,
        message: importError?.message || null,
        error: importError,
      });

      const rawMessage = String(importError?.message || '');
      if (
        isClientValidationError(rawMessage) ||
        /jina|could not read that page|rate limit|did not return enough content|page reader/i.test(
          rawMessage
        )
      ) {
        setError(rawMessage);
      } else if (preferPersonalKey) {
        setError(getGeminiImportErrorMessage(importError));
      } else {
        setError(rawMessage || 'Could not import recipe. Try again.');
      }
    } finally {
      setIsImporting(false);
      setImportStatus('');
    }
  };

  return (
    <ModalShell
      onClose={onClose}
      titleId="recipe-ai-import-title"
      placement="center"
      maxWidth="28rem"
      panelClassName="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-0 max-h-[min(88dvh,920px)]"
      overlayClassName="!z-[10002]"
    >
      <div className="bg-brand px-4 pt-4 pb-3 sm:px-6 sm:py-4 shrink-0">
        <h2 id="recipe-ai-import-title" className="text-white font-black text-lg tracking-tight">
          Import with AI
        </h2>
        <p className="text-blue-100 text-sm mt-0.5">
          Link, photo, or text
          <span className="text-blue-50/90">
            {' · '}
            {usageLoading
              ? 'Checking free imports…'
              : remainingLabel || 'Shared import quota unavailable'}
          </span>
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5 space-y-4">
        {!usageLoading && !sharedCreditsLeft ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-bold">You’ve used all 10 free shared AI imports.</p>
            <p className="mt-1 text-amber-900/90">
              {allowPersonalKey
                ? 'Upgrade for unlimited shared imports, or use your own Gemini key (unlimited, billed to you).'
                : 'Upgrade to Plus for unlimited shared AI imports.'}
            </p>
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isStartingCheckout || isImporting}
              className="mt-3 w-full py-2.5 rounded-xl font-bold text-sm text-white bg-brand hover:bg-brand-dark disabled:opacity-50"
            >
              {isStartingCheckout ? 'Opening checkout…' : 'Upgrade for unlimited'}
            </button>
          </div>
        ) : null}

        <div
          className="flex rounded-2xl bg-slate-100 p-1 gap-1"
          role="tablist"
          aria-label="Import source"
        >
          {IMPORT_MODES.map((mode) => {
            const selected = importMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={selected}
                disabled={isImporting}
                onClick={() => {
                  setImportMode(mode.id);
                  setError('');
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60
                  ${selected ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>

        {importMode === 'link' ? (
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
              Recipe link
            </p>
            <input
              type="url"
              value={linkUrl}
              onChange={(event) => {
                setLinkUrl(event.target.value);
                if (error) setError('');
              }}
              disabled={isImporting}
              className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-base border border-slate-200 outline-none transition-all text-slate-700 focus:border-brand focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
              placeholder="https://…"
              autoComplete="off"
              enterKeyHint="go"
            />
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              We’ll read the page, then extract the recipe with AI. Some sites may block reading.
            </p>
          </div>
        ) : null}

        {importMode === 'photo' ? (
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
              Recipe photo
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              disabled={isImporting}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setImageFile(file);
                if (error) setError('');
              }}
            />
            <button
              type="button"
              disabled={isImporting}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full rounded-2xl border-2 border-dashed transition-colors text-left disabled:opacity-60
                ${
                  imagePreviewUrl
                    ? 'border-brand/40 bg-blue-50/40 p-3'
                    : 'border-slate-200 bg-slate-50 hover:border-brand/50 hover:bg-blue-50/50 px-4 py-6 sm:py-8'
                }`}
            >
              {imagePreviewUrl ? (
                <div className="flex items-center gap-4">
                  <img
                    src={imagePreviewUrl}
                    alt=""
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {imageFile?.name || 'Selected photo'}
                    </p>
                    <p className="text-sm text-brand font-semibold mt-1">Tap to change photo</p>
                  </div>
                  <FontAwesomeIcon icon={faImage} className="text-brand text-xl shrink-0" aria-hidden="true" />
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-2">
                  <span className="w-12 h-12 rounded-2xl bg-blue-50 text-brand flex items-center justify-center">
                    <FontAwesomeIcon icon={faUpload} className="text-xl" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-bold text-slate-800">Upload recipe photo</span>
                  <span className="text-xs text-slate-500">JPG, PNG, or HEIC from your camera roll</span>
                </div>
              )}
            </button>
          </div>
        ) : null}

        {importMode === 'text' ? (
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
              Recipe text
            </p>
            <textarea
              value={sourceText}
              onChange={(event) => {
                setSourceText(event.target.value);
                if (error) setError('');
              }}
              rows={5}
              disabled={isImporting}
              className="w-full min-h-[7.5rem] max-h-[30vh] bg-slate-50 rounded-2xl p-4 text-base leading-relaxed border border-slate-200 outline-none transition-all resize-y text-slate-700 focus:border-brand focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
              placeholder="Paste ingredients and steps here…"
            />
          </div>
        ) : null}

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={simplify}
            disabled={isImporting}
            onChange={(event) => setSimplify(event.target.checked)}
            className="mt-1 w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand shrink-0"
          />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-700">Simplify</span>
            <span className="block text-xs sm:text-sm text-slate-500 leading-snug">
              Shorter steps — one action each. Keeps ingredients and essentials.
            </span>
          </span>
        </label>

        {error ? (
          <p className="text-sm text-red-600 font-medium whitespace-pre-wrap" role="alert">
            {error}
          </p>
        ) : null}
        {importStatus ? (
          <p className="text-sm text-slate-500" role="status">
            {importStatus}
          </p>
        ) : null}

        {allowPersonalKey ? (
          <details className="rounded-2xl border border-slate-200 bg-slate-50/80 group">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-slate-600 flex items-center justify-between gap-2">
              <span>Use your own Gemini key</span>
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 group-open:hidden">
                Show
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 hidden group-open:inline">
                Hide
              </span>
            </summary>
            <div className="px-4 pb-4 space-y-3 border-t border-slate-200/80">
              <p className="text-sm text-slate-500 pt-3 leading-relaxed">
                Unlimited — does not use your free shared imports. Save a key in{' '}
                <Link
                  to="/account"
                  className="font-bold text-brand underline underline-offset-2"
                  onClick={onClose}
                >
                  Account
                </Link>
                . Billing goes to your Google account.
              </p>
              {hasApiKey ? (
                <button
                  type="button"
                  className="w-full py-3 rounded-2xl font-bold text-sm text-brand bg-white border border-blue-100 hover:bg-blue-50 transition-colors disabled:opacity-50"
                  onClick={() => handleImport({ preferPersonalKey: true })}
                  disabled={isImporting}
                >
                  Import with your key only
                </button>
              ) : (
                <p className="text-sm text-slate-500">
                  No personal key on this device yet — add one in Account first.
                </p>
              )}
            </div>
          </details>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3 sm:px-6 sm:py-4 flex gap-3">
        <button
          type="button"
          className="flex-1 py-3 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
          onClick={onClose}
          disabled={isImporting}
        >
          Cancel
        </button>
        <button
          type="button"
          className="flex-1 py-3 rounded-2xl font-bold text-white bg-brand hover:bg-brand-dark transition-colors disabled:opacity-50"
          onClick={() => handleImport()}
          disabled={isImporting || usageLoading || !canPrimaryImport}
        >
          {isImporting ? importStatus || 'Importing…' : 'Import'}
        </button>
      </div>
    </ModalShell>
  );
}

export default RecipeAiImportModal;
