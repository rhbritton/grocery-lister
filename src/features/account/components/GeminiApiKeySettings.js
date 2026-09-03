import React, { useEffect, useState } from 'react';
import {
  clearGeminiApiKey,
  getGeminiApiKey,
  hasGeminiApiKey,
  setGeminiApiKey,
} from '../../../services/geminiApiKeyStorage.js';
import {
  getGeminiErrorDetails,
  getGeminiImportErrorMessage,
  testGeminiApiKey,
} from '../../recipes/services/geminiRecipeImport.js';

const AI_STUDIO_KEY_URL = 'https://aistudio.google.com/apikey';

function GeminiApiKeySettings({ userId }) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [verifiedKey, setVerifiedKey] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const trimmedInput = apiKeyInput.trim();
  const isVerifiedForSave = Boolean(trimmedInput && trimmedInput === verifiedKey);

  useEffect(() => {
    setIsConfigured(hasGeminiApiKey(userId));
  }, [userId]);

  const handleInputChange = (value) => {
    setApiKeyInput(value);
    if (verifiedKey && value.trim() !== verifiedKey) {
      setVerifiedKey(null);
    }
    if (error) setError('');
    if (status) setStatus('');
  };

  const handleSave = async () => {
    if (!isVerifiedForSave) {
      setError('Test the connection before saving this key.');
      return;
    }

    setIsSaving(true);
    setError('');
    setStatus('');

    try {
      setGeminiApiKey(userId, trimmedInput);
      setIsConfigured(true);
      setApiKeyInput('');
      setVerifiedKey(null);
      setStatus('Gemini API key saved on this device. You can import recipes with AI now.');
    } catch (saveError) {
      setError(saveError.message || 'Could not save API key.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setError('');
    setStatus('');

    try {
      const key = trimmedInput || getGeminiApiKey(userId);
      if (!key) {
        throw new Error('Enter an API key first.');
      }

      await testGeminiApiKey(key);
      if (trimmedInput) {
        setVerifiedKey(trimmedInput);
        setStatus('Connection works — tap Save key to finish.');
      } else {
        setStatus('Saved Gemini key still works.');
      }
    } catch (testError) {
      setVerifiedKey(null);
      setError(getGeminiImportErrorMessage(testError));
      const details = getGeminiErrorDetails(testError);
      if (details && !getGeminiImportErrorMessage(testError).includes(details.slice(0, 40))) {
        setError((prev) => `${prev}\n\nDetails: ${details.slice(0, 240)}`);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleRemove = () => {
    clearGeminiApiKey(userId);
    setApiKeyInput('');
    setVerifiedKey(null);
    setIsConfigured(false);
    setError('');
    setStatus('Gemini API key removed from this device. AI import will stay disabled until you add a key again.');
  };

  return (
    <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60">
        <h2 className="text-label font-black uppercase tracking-widest text-slate-500">
          Gemini API key
        </h2>
      </div>
      <div className="px-6 py-5 space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          AI recipe import needs your own Gemini API key. It stays on this device. Google bills usage
          to your Google account (the free Gemini quota is enough for typical recipe imports).
        </p>
        <ol className="text-sm text-slate-600 leading-relaxed space-y-2 list-decimal list-inside">
          <li>
            Create a free key at{' '}
            <a
              href={AI_STUDIO_KEY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand font-semibold underline underline-offset-2"
            >
              Google AI Studio
            </a>
            .
          </li>
          <li>Paste it below and tap <strong>Test connection</strong>.</li>
          <li>If the test succeeds, tap <strong>Save key</strong>.</li>
        </ol>
        <p className="text-sm text-slate-500 leading-relaxed">
          If a new key fails locally, open the key in Google Cloud → Credentials and set{' '}
          <strong>Application restrictions</strong> to <strong>None</strong> (or allow{' '}
          <code className="text-xs">http://localhost:3000/*</code>). Import uses{' '}
          <code className="text-xs">gemini-2.5-flash</code>.
        </p>

        {isConfigured ? (
          <p className="text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
            Gemini key saved on this device. AI import is ready.
          </p>
        ) : (
          <p className="text-sm font-medium text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            No Gemini key on this device yet — AI import is disabled until you save one.
          </p>
        )}

        <div>
          <label
            htmlFor="gemini-api-key"
            className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2"
          >
            Gemini API key
          </label>
          <input
            id="gemini-api-key"
            type="password"
            autoComplete="off"
            value={apiKeyInput}
            onChange={(event) => handleInputChange(event.target.value)}
            placeholder={isConfigured ? 'Enter a new key to replace saved key' : 'Paste API key'}
            className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm border border-slate-200 outline-none focus:border-brand focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        {error ? (
          <p className="text-sm text-red-600 font-medium whitespace-pre-line" role="alert">
            {error}
          </p>
        ) : null}
        {status ? (
          <p className="text-sm text-slate-600" role="status">
            {status}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting || (!trimmedInput && !isConfigured)}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-brand bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isTesting ? 'Testing…' : 'Test connection'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isVerifiedForSave}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving…' : 'Save key'}
          </button>
          {isConfigured ? (
            <button
              type="button"
              onClick={handleRemove}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Remove key
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default GeminiApiKeySettings;
