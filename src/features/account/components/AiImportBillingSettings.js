import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  fetchAiImportUsage,
  openBillingPortal,
  startAiImportCheckout,
} from '../../recipes/services/recipeAiImportApi.js';
import {
  formatAiImportRemaining,
} from '../../recipes/utils/aiImportQuota.js';

function AiImportBillingSettings({ user }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [usage, setUsage] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refreshUsage = async () => {
    const next = await fetchAiImportUsage();
    setUsage(next);
    return next;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await fetchAiImportUsage();
        if (!cancelled) setUsage(next);
      } catch (loadError) {
        if (!cancelled) {
          console.error('[Billing] usage load failed', loadError);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  useEffect(() => {
    const billing = searchParams.get('billing');
    if (!billing) return undefined;

    if (billing === 'success') {
      setStatus('Payment received — refreshing your plan…');
      refreshUsage()
        .then((next) => {
          if (next?.unlimited) {
            setStatus('You’re on Plus — unlimited shared AI imports.');
          } else {
            setStatus('Payment received. If Plus isn’t active yet, wait a few seconds and refresh.');
          }
        })
        .catch(() => {
          setStatus('Payment received. Refresh in a moment if Plus isn’t showing yet.');
        });
    } else if (billing === 'cancel') {
      setStatus('Checkout canceled — no changes made.');
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('billing');
    setSearchParams(nextParams, { replace: true });
    return undefined;
  }, [searchParams, setSearchParams]);

  const handleUpgrade = async () => {
    setBusy(true);
    setError('');
    try {
      const url = await startAiImportCheckout();
      window.location.assign(url);
    } catch (checkoutError) {
      setError(checkoutError.message || 'Could not start checkout.');
      setBusy(false);
    }
  };

  const handlePortal = async () => {
    setBusy(true);
    setError('');
    try {
      const url = await openBillingPortal();
      window.location.assign(url);
    } catch (portalError) {
      setError(portalError.message || 'Could not open billing portal.');
      setBusy(false);
    }
  };

  const isPlus = Boolean(usage?.unlimited);

  return (
    <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60">
        <h2 className="text-label font-black uppercase tracking-widest text-slate-500">
          AI import plan
        </h2>
      </div>
      <div className="px-6 py-5 space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          Free accounts get 10 shared AI imports (our Gemini key). Plus is $4.99/month for unlimited
          shared imports.
        </p>
        <p className="text-sm font-bold text-slate-800">
          {usage ? formatAiImportRemaining(usage) : 'Loading usage…'}
          {usage ? ` · Plan: ${isPlus ? 'Plus' : 'Free'}` : ''}
        </p>

        {status ? (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2" role="status">
            {status}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-red-600 font-medium" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {!isPlus ? (
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-brand hover:bg-brand-dark disabled:opacity-50"
            >
              {busy ? 'Working…' : 'Upgrade to Plus'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePortal}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-brand bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
            >
              {busy ? 'Working…' : 'Manage billing'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default AiImportBillingSettings;
