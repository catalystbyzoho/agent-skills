> **Slate is the preferred frontend deployment for all new Catalyst projects.**
> It supersedes legacy Web Client Hosting with modern Git-based workflows and native framework support.

## Key Features

- Native support: Next.js, React (Vite/CRA), Vue, Angular, Svelte, Astro, SolidJS, Preact, static HTML
- Git-based deployment (GitHub/GitLab repos)
- Auto build and deploy on push
- Preview deployments for branches
- Custom domain mapping
- Environment variables
- SSR and ISR support (Next.js)

---

## CLI Commands

```bash
catalyst slate:create --name <name> --framework <framework> --default  # Add Slate app
catalyst slate:link               # ⚠️ Interactive — link existing dir
catalyst slate:unlink             # Unlink a Slate app
catalyst serve --only slate       # Serve locally
catalyst deploy slate             # Deploy all Slate apps to Development
catalyst deploy slate -m "msg"    # Deploy with message
catalyst deploy --only slate:name # Deploy specific app
catalyst deploy slate --production # Deploy to Production ⚠️
```

**Slate URL format** (varies by data center):

| DC | URL format |
|----|------------|
| US | `https://<subdomain>.onslate.com` |
| EU | `https://<subdomain>.onslate.eu` |
| IN | `https://<subdomain>.onslate.in` |
| AU | `https://<subdomain>.onslate.au` |
| CA | `https://<subdomain>.onslate.ca` |

---

## Supported Frameworks

| Framework Value | Detection | Build Output |
|----------------|-----------|--------------|
| `static` | HTML/CSS/JS | `.` or `public/` |
| `react-vite` | React + Vite | `dist/` |
| `nextjs` | Next.js | `out/` or `.next/` |
| `vue` | Vue.js | `dist/` |
| `angular` | Angular | `dist/<project-name>` |
| `svelte` | SvelteKit | `dist/` or `build/` |
| `astro` | Astro | `dist/` |
| `solidjs` | SolidJS | `dist/` |
| `preact` | Preact | `dist/` |
| `create-react-app` | CRA | `build/` |

---

## Manual Setup (Non-Interactive)

`catalyst slate:link` is interactive-only. For automated environments:

**Step 1** — Create `.catalyst/slate-config.toml` inside the build output directory:
```toml
framework = "static"
deployment_name = "default"
```

> **No build step (pure static HTML/CSS/JS)?** Your source directory *is* the output directory. Place `.catalyst/slate-config.toml` directly inside your `client/` (or equivalent) folder. No build command needed.

**Step 2** — Add to `catalyst.json` with **absolute** source path:
```json
"slate": [{ "name": "my-frontend", "source": "/absolute/path/to/client" }]
```

**Step 3** — Deploy:
```bash
catalyst deploy slate -m "initial deploy"
```

## Common Errors

### `slate-config.toml` wiped by clean builds

The `.catalyst/slate-config.toml` lives inside the build output directory (e.g., `dist/`). Build commands that clean the output (`--clean`, `rm -rf dist/`) delete this file.

```bash
# Recreate after every clean build (Vite/React example):
npm run build && mkdir -p dist/.catalyst && \
  echo -e 'framework = "static"\ndeployment_name = "default"' > dist/.catalyst/slate-config.toml && \
  catalyst deploy slate

# Expo web example:
npx expo export --platform web --clear && \
  mkdir -p dist/.catalyst && \
  echo -e 'framework = "static"\ndeployment_name = "default"' > dist/.catalyst/slate-config.toml && \
  catalyst deploy slate
```

### `baseUrl` breaks assets on Slate

If your build config has a `baseUrl` or `basePath` set to a non-root path, all JS/CSS URLs get prefixed. Since Slate serves from root `/`, every asset returns 404.

**Fix:** Remove `baseUrl`/`basePath` from your build config before building for Slate. Only set it when serving from inside a function or AppSail sub-path.

### Slate + Serverless Functions cross-origin (works with correct setup)

1. Add Slate domain to Authorized Domains: Console → Authentication → Whitelisting → + Add Domain → enable CORS toggle
2. **Do NOT set CORS headers in function code for production origins** — gateway injects them automatically
3. Only set CORS headers for `localhost` (local dev)

### Slate + AppSail (does NOT work without same-origin trick)

Slate → AppSail calls get blocked by Catalyst's auth layer. **Solution:** serve the frontend from AppSail itself using `express.static()` so all calls are same-origin.
