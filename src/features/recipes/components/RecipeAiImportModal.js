import React, { useState } from 'react';
import ModalShell from '../../../components/ModalShell.js';
import { copyTextToClipboard } from '../../../utils/clipboard.js';
import {
  RECIPE_AI_IMPORT_PROMPT,
  parseRecipeImportJson,
} from '../utils/recipeAiImport.js';

function RecipeAiImportModal({ onClose, onImport }) {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  const handleCopyPrompt = async () => {
    const copied = await copyTextToClipboard(RECIPE_AI_IMPORT_PROMPT);
    setCopyStatus(copied ? 'Prompt copied — paste it into your AI app.' : 'Could not copy. Select and copy manually.');
  };

  const handleImport = () => {
    const result = parseRecipeImportJson(jsonText);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    onImport(result.recipe);
    onClose();
  };

  return (
    <ModalShell
      onClose={onClose}
      titleId="recipe-ai-import-title"
      panelClassName="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
      overlayClassName="!z-[10002]"
    >
      <div className="bg-brand px-6 py-4 shrink-0">
        <h2 id="recipe-ai-import-title" className="text-white font-black text-lg tracking-tight">
          Import with AI
        </h2>
        <p className="text-blue-100 text-sm mt-1">
          Copy the prompt, extract a recipe in ChatGPT or similar, then paste JSON here.
        </p>
      </div>

      <div className="p-6 space-y-5 overflow-y-auto">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
            Step 1 — Copy prompt
          </p>
          <button
            type="button"
            onClick={handleCopyPrompt}
            className="w-full py-3 rounded-2xl font-bold text-sm bg-blue-50 text-brand border border-blue-100 hover:bg-blue-100 transition-colors"
          >
            Copy AI prompt
          </button>
          {copyStatus ? (
            <p className="text-sm text-slate-600 mt-2" role="status">
              {copyStatus}
            </p>
          ) : null}
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
            Step 2 — Paste JSON
          </p>
          <textarea
            value={jsonText}
            onChange={(event) => {
              setJsonText(event.target.value);
              if (error) setError('');
            }}
            rows={8}
            className="w-full bg-slate-50 rounded-2xl p-4 text-sm leading-relaxed border border-slate-200 outline-none transition-all resize-none font-mono text-slate-700 focus:border-brand focus:ring-4 focus:ring-blue-500/10"
            placeholder='{"name":"...","ingredients":[...],"instructions":"..."}'
            spellCheck={false}
          />
          {error ? (
            <p className="text-sm text-red-600 mt-2 font-medium" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            className="flex-1 py-3 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 py-3 rounded-2xl font-bold text-white bg-brand hover:bg-brand-dark transition-colors"
            onClick={handleImport}
          >
            Fill form
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export default RecipeAiImportModal;
