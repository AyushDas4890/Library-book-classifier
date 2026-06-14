# Web app — Library Circulation Intelligence

Next.js 14 (App Router, TypeScript) front end. Runs entirely on static JSON
artifacts in `public/data/` — semantic search and similarity are computed
client-side, so the deployment needs no server and no API key.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
```

Regenerate `public/data/` from the ML pipeline:

```bash
cd ..
python -m library_intel.pipeline
python scripts/build_web_artifacts.py
```
