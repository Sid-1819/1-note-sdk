import { DEFAULT_ONE_NOTE_API_ORIGIN } from "./constants.js";
import { ApiError, parseErrorBody } from "./errors.js";
import type {
  CreateNoteInput,
  CreateNoteResult,
  GetNoteResult,
  SecureShareClientOptions,
} from "./types.js";

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

/** Resolve API origin: explicit option, then `ONE_NOTE_API_URL` in Node, then default. Empty string = same-origin relative URLs. */
export function resolveBaseUrl(explicitBaseUrl?: string): string {
  if (explicitBaseUrl === "") return "";
  const trimmed = explicitBaseUrl?.trim();
  if (trimmed) return normalizeBaseUrl(trimmed);
  const fromEnv =
    typeof process !== "undefined" && process.env?.ONE_NOTE_API_URL?.trim();
  if (fromEnv) return normalizeBaseUrl(fromEnv);
  return normalizeBaseUrl(DEFAULT_ONE_NOTE_API_ORIGIN);
}

function errorMessageFromText(text: string, status: number): string {
  const trimmed = text.trim();
  const parsed = parseErrorBody(trimmed);
  if (parsed?.message) return parsed.message;
  if (trimmed) return trimmed;
  return `Request failed (${status})`;
}

export function createSecureShareClient(options: SecureShareClientOptions = {}) {
  const base = resolveBaseUrl(options.baseUrl);
  const fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis);

  async function createNote(input: CreateNoteInput): Promise<CreateNoteResult> {
    const path = `${base}/s`;
    const res = await fetchFn(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const body = parseErrorBody(text);
      throw new ApiError(errorMessageFromText(text, res.status), res.status, body);
    }

    return res.json() as Promise<CreateNoteResult>;
  }

  async function getNote(
    slug: string,
    password?: string,
  ): Promise<GetNoteResult> {
    const headers: HeadersInit = {};
    if (password !== undefined && password !== "") {
      headers["X-Note-Password"] = password;
    }
    const path = `${base}/s/${encodeURIComponent(slug)}`;
    const res = await fetchFn(path, {
      headers: Object.keys(headers).length ? headers : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      const body = parseErrorBody(text);
      throw new ApiError(
        errorMessageFromText(text, res.status),
        res.status,
        body,
      );
    }

    return res.json() as Promise<GetNoteResult>;
  }

  return { createNote, getNote };
}

export type SecureShareClient = ReturnType<typeof createSecureShareClient>;
