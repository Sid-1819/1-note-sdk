/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ONE_NOTE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
