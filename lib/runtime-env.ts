export type RuntimeEnv = { DB: D1Database; BUCKET: R2Bucket; EMAIL_SECRET?: string; COOKIE_SECURE?: boolean; PUBLIC_URL?: string | null; DEPLOYMENT_MODE?: string; DATABASE_ENGINE?: string; STORAGE_MODE?: string; REDIS?: unknown };

let testEnvironment: RuntimeEnv | null = null;

export function setRuntimeEnvForTests(value: RuntimeEnv | null) {
  testEnvironment = value;
}

export async function getRuntimeEnv(): Promise<RuntimeEnv> {
  if (testEnvironment) return testEnvironment;
  const localEnvironment = (globalThis as typeof globalThis & { __MEP_LOCAL_ENV__?: RuntimeEnv }).__MEP_LOCAL_ENV__;
  if (localEnvironment) return localEnvironment;
  return (await import("cloudflare:workers")).env as RuntimeEnv;
}
