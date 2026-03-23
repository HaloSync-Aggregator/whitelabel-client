/**
 * @template vite-env.d.ts
 * @version 4.1.0
 * @description Vite client type declarations for DEMO001 tenant app.
 *              Extends ImportMeta with custom environment variables.
 */
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MIDDLEWARE_URL: string;
  readonly VITE_BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
