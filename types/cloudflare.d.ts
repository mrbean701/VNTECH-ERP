interface D1Result<T = Record<string, unknown>> { results?: T[]; success?: boolean; meta?: Record<string, unknown>; }
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>;
  exec(query: string): Promise<unknown>;
}
interface R2Bucket {
  get(key: string): Promise<{ body: BodyInit } | null>;
  put(key: string, value: unknown, options?: unknown): Promise<unknown>;
  delete(key: string): Promise<void>;
}
interface Fetcher { fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>; }

declare module "cloudflare:workers" {
  export const env: Record<string, unknown> & { DB: D1Database; BUCKET: R2Bucket; ASSETS: Fetcher };
}
