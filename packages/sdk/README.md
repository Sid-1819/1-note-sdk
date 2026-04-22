# @1note/sdk

TypeScript/JavaScript client and terminal CLI for the **1Note** (secureShare) HTTP API: create time- or view-limited secure notes and read them by slug.

## Contents

- [Install](#install)
- [Build](#build)
- [TypeScript / Node API](#typescript--node-api)
- [CLI (`1note`)](#cli-1note)
- [HTTP overview](#http-overview)
- [Errors](#errors)
- [Publishing](#publishing)

---

## Install

```bash
npm install @1note/sdk
# or
pnpm add @1note/sdk
```

**Local path / monorepo** (from another package):

```json
{
  "dependencies": {
    "@1note/sdk": "file:../path/to/sdk/packages/sdk"
  }
}
```

The package runs `prepare` on install, which builds `dist/` via `tsup`. You can also run `pnpm run build` manually in this folder.

---

## Build

From **`sdk/packages/sdk`**:

```bash
pnpm install
pnpm run build
```

Outputs library bundles and the CLI entry (`dist/index.js`, `dist/index.cjs`, type declarations, `dist/cli.js`).

---

## TypeScript / Node API

### Imports

```ts
import {
  createSecureShareClient,
  resolveBaseUrl,
  DEFAULT_ONE_NOTE_API_ORIGIN,
  ApiError,
} from "@1note/sdk";
import type {
  CreateNoteInput,
  CreateNoteResult,
  GetNoteResult,
  SecureShareClientOptions,
} from "@1note/sdk";
```

### Base URL resolution

`createSecureShareClient({ baseUrl })` resolves the API origin in this order:

1. **`baseUrl`** if passed and non-empty (trailing slash stripped).
2. **`process.env.ONE_NOTE_API_URL`** in Node when `baseUrl` is omitted.
3. **`DEFAULT_ONE_NOTE_API_ORIGIN`** from this package (see `src/constants.ts` in the repo).

Special case: **`baseUrl: ""`** means same-origin relative URLs (`/s`, `/s/:slug`) for browser apps that proxy to the API.

`resolveBaseUrl(explicitBaseUrl?)` exposes the same resolution logic for your own code.

### Client

```ts
const client = createSecureShareClient({
  baseUrl: "https://your-api.example.com", // optional in Node if ONE_NOTE_API_URL is set
  // fetch: customFetch, // optional override for tests or non-standard runtimes
});

const created = await client.createNote({
  content: "Secret message",
  expiresAt: "2026-12-31T23:59:59.000Z", // optional; ISO 8601 string
  maxViews: 5, // optional; positive integer
  password: "optional-shared-secret",
});

console.log(created.slug, created.url, created.expiresAt, created.maxViews);

const { content } = await client.getNote(created.slug, "optional-shared-secret");
```

### Types (summary)

| Type | Role |
|------|------|
| `CreateNoteInput` | `content` (required), optional `expiresAt` (ISO string), `maxViews`, `password`. |
| `CreateNoteResult` | `slug`, `url`, `expiresAt`, `maxViews` (nullable per server). |
| `GetNoteResult` | `{ content: string }`. |
| `SecureShareClientOptions` | `baseUrl?`, `fetch?`. |
| `NoteErrorCode` | Server error codes on failed reads (`PASSWORD_REQUIRED`, etc.). |

### Browser notes

Bundlers often do not populate `process.env`. Pass **`baseUrl`** from your app (for example `import.meta.env.VITE_ONE_NOTE_API_URL` in Vite) instead of relying on `ONE_NOTE_API_URL`.

---

## CLI (`1note`)

The published binary is **`1note`**. It maps to `dist/cli.js` (`package.json` `"bin"`).

### Run after build

**Inside this package:**

```bash
pnpm run build
pnpm run cli -- --help
```

Use **`--`** so pnpm forwards flags and subcommands to `node` instead of consuming them.

**From the SDK workspace root** (`sdk/`):

```bash
pnpm --filter @1note/sdk run build
pnpm --filter @1note/sdk run cli -- --help
```

**Directly:**

```bash
node path/to/sdk/packages/sdk/dist/cli.js --help
```

Running the CLI with **no subcommand** prints top-level help (same as `1note` with no arguments).

### Global options

These apply to all subcommands (place them **before** the subcommand name, as usual with Commander):

| Option | Description |
|--------|-------------|
| `-V`, `--version` | Package version (read from `package.json` next to `dist/`). |
| `-h`, `--help` | Help. |
| `--base-url <url>` | API origin; overrides `ONE_NOTE_API_URL`. |
| `--json` | Machine-readable JSON on stdout; **no** interactive prompts, spinner, success panel, or clipboard copy. |

### Command: `create`

Creates a note via `POST /s`.

**Positional**

- `[content]` — Optional note body when stdin is a TTY. Empty string `""` can be used to force the interactive “note content” prompt.

**Options**

| Option | Description |
|--------|-------------|
| `--expires-at <iso>` | Expiry as **ISO 8601** (e.g. `2026-12-31T23:59:59.000Z`). |
| `--password <pw>` | Optional note password. |
| `--max-views <n>` | Positive integer; maximum views. |
| `--file <path>` | Read body from a UTF-8 file (resolved relative to the current working directory). |

**How the body is chosen**

1. `--file` wins if set.
2. Else non-empty positional `[content]`.
3. Else **`--json` with a TTY stdin** → error (you must pass a body, `--file`, or pipe stdin).
4. Else **non-TTY stdin** (pipe) → read full stdin as body.
5. Else **interactive TTY** → prompts for “Note content” if still missing.

**Interactive metadata (TTY, no `--json`)**

If stdin **and** stdout behave as a TTY and `--json` is **not** set, after the body is known the CLI prompts (unless the corresponding flag was already passed):

1. Expiry — ISO 8601, or empty to skip.
2. Password — or empty to skip.
3. Max views — positive integer, or empty to skip.

**Output**

- **TTY + no `--json`:** spinner, then a success panel; link copied with **clipboardy** when possible.
- **Otherwise:** JSON object for `create` (same shape as `CreateNoteResult`), pretty-printed with indentation.

**Examples**

```bash
# Interactive (local API)
ONE_NOTE_API_URL=http://localhost:3000 1note create

# Non-interactive JSON (local API)
1note --base-url http://localhost:3000 --json create "hello"

# Pipe body
echo "secret" | 1note --json --base-url http://localhost:3000 create

# With metadata
1note --json create "x" --expires-at 2026-12-31T23:59:59.000Z --max-views 3 --password pw
```

### Command: `get`

Fetches a note via `GET /s/:slug`.

**Arguments**

- `<slug>` — Slug from the share URL.

**Options**

- `--password <pw>` — Sent as **`X-Note-Password`** when non-empty.

**Output**

- **`--json`:** full JSON response body (shape matches `GetNoteResult` from the API).
- **No `--json`:** note `content` on stdout, with a trailing newline added if the content does not already end with one.

```bash
1note --json get my-slug-here --password pw
1note get my-slug-here
```

### Environment

| Variable | Used by |
|----------|---------|
| `ONE_NOTE_API_URL` | Library default origin in Node; CLI when `--base-url` is omitted. |

---

## HTTP overview

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `{base}/s` | Create note; JSON body `CreateNoteInput`. |
| `GET` | `{base}/s/{slug}` | Read note; optional header `X-Note-Password`. |

Exact validation of `expiresAt` and other fields is defined by your secureShare backend.

---

## Errors

Failed requests throw **`ApiError`** (extends `Error`):

- `message` — Human-readable message (from parsed JSON `message` or raw body when possible).
- `status` — HTTP status code.
- `body` — Optional `{ code?, message? }` when the response was JSON (`NoteErrorBody`).

The CLI catches `ApiError`, prints `message` in red, and exits with code **1**.

---

## Publishing

Only **`@1note/sdk`** (this package) is intended for npm. Bump `version` in `package.json`, build, then publish from this directory (see also the parent [`sdk/README.md`](../../README.md) in the monorepo).

---

## License

MIT (see `package.json`).
