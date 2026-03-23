# 1Note SDK monorepo

This folder is a **pnpm workspace** with:

| Package | Path | Description |
|--------|------|-------------|
| `@1note/sdk` | [`packages/sdk`](packages/sdk) | Publishable TypeScript client |
| `@1note/playground` | [`apps/playground`](apps/playground) | Private Vite + React app that consumes the SDK like an external user (`workspace:*`) |

```text
1note-sdk/
  apps/
    playground/
  packages/
    sdk/
  pnpm-workspace.yaml
  package.json
```

The **`vanixx`** parent folder does not need a root `package.json` or workspace: treat **secureShare** and **1note-sdk** as separate projects. Link an app to the SDK with `file:../1note-sdk/packages/sdk` (or publish `@1note/sdk` to npm).

## Standalone (this repo only)

```bash
cd 1note-sdk
pnpm install
pnpm build
```

### Playground (browser)

```bash
cp apps/playground/.env.example apps/playground/.env
# optional: VITE_ONE_NOTE_API_URL=http://localhost:3000 for a local API
pnpm dev:playground
```

Vite runs on **http://localhost:5174** by default. If the API is on another origin, ensure that origin is allowed in Nest `enableCors` (see [`secureShare/apps/backend/src/main.ts`](../secureShare/apps/backend/src/main.ts); `http://localhost:5174` is included for this playground).

## Backend (not in this repo)

There is **no** Nest app under `1note-sdk`. Run your existing API locally, for example from the **secureShare** monorepo:

```bash
cd ../secureShare/apps/backend
# follow that project’s README (env, DB, etc.)
pnpm start:dev
```

Default local URL is often **http://localhost:3000**. Point the playground at it with `VITE_ONE_NOTE_API_URL=http://localhost:3000` in `apps/playground/.env`.

---

# @1note/sdk

TypeScript client for the **1Note** (secureShare) HTTP API: create ephemeral notes and read them by slug.

## Install

```bash
npm install @1note/sdk
```

From a sibling app folder (e.g. `secret-share` next to `1note-sdk`):

```json
{
  "dependencies": {
    "@1note/sdk": "file:../1note-sdk/packages/sdk"
  }
}
```

Build before consuming `dist` (or rely on the SDK package `prepare` script on install):

```bash
pnpm --filter @1note/sdk build
```

## Base URL: Node vs browser

- **Browser bundles** usually do not have `process.env` populated. Pass **`baseUrl`** from your app (e.g. Vite: `import.meta.env.VITE_ONE_NOTE_API_URL`).
- **Node** can set **`ONE_NOTE_API_URL`**; if `baseUrl` is omitted, the client uses that env var, then **`DEFAULT_ONE_NOTE_API_ORIGIN`** (exported from the package; change the constant in one place for your production API).

Pass **`baseUrl: ""`** for same-origin relative requests (`/s`, `/s/:slug`).

```ts
import {
  createSecureShareClient,
  DEFAULT_ONE_NOTE_API_ORIGIN,
  resolveBaseUrl,
} from "@1note/sdk";

const client = createSecureShareClient({
  baseUrl: "https://your-api.example.com",
});

const { slug, url } = await client.createNote({
  content: "Hello",
  maxViews: 1,
  expiresAt: new Date(Date.now() + 300_000).toISOString(),
  password: undefined,
});

const { content } = await client.getNote(slug);
```

### Playground / Vite example

```env
VITE_ONE_NOTE_API_URL=http://localhost:3000
```

```ts
createSecureShareClient({
  baseUrl: import.meta.env.VITE_ONE_NOTE_API_URL?.trim() || undefined,
});
```

### CORS (browser)

`fetch` from a browser sends an `Origin`. Your API must allow that origin (see Nest `enableCors` in secureShare). **Node** scripts using the SDK often send no `Origin`; the backend allows that case.

### Errors

Failed responses throw `ApiError` with `status` and optional `body` (`code`, `message`) for note read errors (e.g. `PASSWORD_REQUIRED`, `INVALID_PASSWORD`, `WRONG_PASSWORD_LIMIT`).

## Publishing (optional)

1. Publish only **`packages/sdk`** (`@1note/sdk`), not **`@1note/playground`**.
2. Bump `version` in `packages/sdk/package.json` per semver.
3. From `packages/sdk`: `pnpm publish --access public` (or npm equivalent).

Use `prepublishOnly` so `dist` is built before publish.
