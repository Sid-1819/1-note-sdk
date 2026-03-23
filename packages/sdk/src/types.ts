/** Error codes returned in JSON body for note read failures (403 / 429). */
export type NoteErrorCode =
  | "PASSWORD_REQUIRED"
  | "INVALID_PASSWORD"
  | "WRONG_PASSWORD_LIMIT";

export type CreateNoteInput = {
  content: string;
  /** ISO 8601 datetime string; optional on server. */
  expiresAt?: string;
  maxViews?: number;
  password?: string;
};

export type CreateNoteResult = {
  slug: string;
  url: string;
  expiresAt: string | null;
  maxViews: number | null;
};

export type GetNoteResult = {
  content: string;
};

export type SecureShareClientOptions = {
  /**
   * API origin without trailing slash. If omitted, uses `process.env.ONE_NOTE_API_URL` (Node)
   * then the package default origin. Browser apps should usually pass `baseUrl`
   * (e.g. from `import.meta.env.VITE_ONE_NOTE_API_URL`).
   */
  baseUrl?: string;
  /** Override fetch (tests, custom runtimes). Defaults to global `fetch`. */
  fetch?: typeof fetch;
};
