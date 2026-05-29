import React from 'react';
import { PersistGate } from 'redux-persist/integration/react';
import ReactDOM from 'react-dom/client';
import './index.css';
import PageLoader from './components/PageLoader';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux'; // Import Provider
import { store, persistor } from './app/store.ts'; // Import your store
import { applyPendingRecipesFromSyncQueue } from './features/recipes/slices/recipesSlice.ts';
import * as serviceWorkerRegistration from './serviceWorkerRegistration.ts';

const flushPersistedState = () => {
  persistor.persist();
};

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushPersistedState();
    }
  });
  window.addEventListener('pagehide', flushPersistedState);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
    <Provider store={store}> {/* Wrap App with Provider */}
      <PersistGate
        loading={<PageLoader message="Restoring your data…" />}
        persistor={persistor}
        onBeforeLift={() => store.dispatch(applyPendingRecipesFromSyncQueue())}
      >
        <App />
      </PersistGate>
    </Provider>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
serviceWorkerRegistration.register();