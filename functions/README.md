# Cloud Functions

Set before first deploy (Blaze plan required for outbound Gemini calls):

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

Install and deploy:

```bash
cd functions && npm install
cd .. && npm run deploy:functions
```

Shared AI import is available to any signed-in user. Model is hardcoded as `gemini-2.5-flash`.
