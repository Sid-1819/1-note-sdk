import { useMemo, useState } from "react";
import {
  createSecureShareClient,
  DEFAULT_ONE_NOTE_API_ORIGIN,
  resolveBaseUrl,
} from "@1note/sdk";

function App() {
  const [baseUrlOverride, setBaseUrlOverride] = useState("");
  const [content, setContent] = useState("Hello from @1note/playground");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clientBaseUrl = useMemo(() => {
    const trimmed = baseUrlOverride.trim();
    const fromEnv = import.meta.env.VITE_ONE_NOTE_API_URL?.trim();
    if (trimmed) return trimmed;
    if (fromEnv) return fromEnv;
    return undefined;
  }, [baseUrlOverride]);

  const resolvedDisplay = resolveBaseUrl(clientBaseUrl);

  const client = useMemo(
    () => createSecureShareClient({ baseUrl: clientBaseUrl }),
    [clientBaseUrl],
  );

  async function handleCreate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await client.createNote({ content });
      setResult(JSON.stringify(res, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>@1note/playground</h1>
      <p style={{ color: "#444", lineHeight: 1.5 }}>
        Uses <code>@1note/sdk</code> via workspace. Set{" "}
        <code>VITE_ONE_NOTE_API_URL</code> in <code>.env</code> for a local API,
        or override below. Default SDK origin:{" "}
        <code>{DEFAULT_ONE_NOTE_API_ORIGIN}</code>
      </p>

      <section style={{ marginTop: "1.25rem" }}>
        <label
          style={{ display: "block", fontWeight: 600, marginBottom: "0.35rem" }}
        >
          Base URL override (optional)
        </label>
        <input
          type="text"
          value={baseUrlOverride}
          onChange={(e) => setBaseUrlOverride(e.target.value)}
          placeholder="e.g. http://localhost:3000"
          style={{ width: "100%", padding: "0.5rem 0.65rem", fontSize: 14 }}
        />
        <p style={{ fontSize: 13, color: "#555", marginTop: "0.5rem" }}>
          Resolved for requests: <code>{resolvedDisplay || "(same-origin)"}</code>
        </p>
      </section>

      <section style={{ marginTop: "1rem" }}>
        <label
          style={{ display: "block", fontWeight: 600, marginBottom: "0.35rem" }}
        >
          Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          style={{ width: "100%", padding: "0.5rem 0.65rem", fontSize: 14 }}
        />
      </section>

      <button
        type="button"
        onClick={handleCreate}
        disabled={loading}
        style={{
          marginTop: "1rem",
          padding: "0.55rem 1rem",
          fontSize: 15,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Creating…" : "Create note"}
      </button>

      {error && (
        <pre
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            background: "#fee",
            color: "#900",
            overflow: "auto",
          }}
        >
          {error}
        </pre>
      )}

      {result && (
        <pre
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            background: "#f5f5f5",
            overflow: "auto",
          }}
        >
          {result}
        </pre>
      )}
    </div>
  );
}

export default App;
