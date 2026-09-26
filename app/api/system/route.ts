// VNTECH PROPRIETARY SOURCE | Owner: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH)
// FULL W2: one runtime route only. Next API delegates to the backend SSOT.
import { getRuntimeEnv } from "../../../lib/runtime-env";
import { GET as runtimeGET, POST as runtimePOST } from "../../../scripts/system-route.mjs";

async function bindRuntimeEnv() {
  const runtimeEnv = await getRuntimeEnv();
  (globalThis as typeof globalThis & { __MEP_LOCAL_ENV__?: unknown }).__MEP_LOCAL_ENV__ = runtimeEnv;
}

export async function GET(request: Request) {
  await bindRuntimeEnv();
  return runtimeGET(request);
}

export async function POST(request: Request) {
  await bindRuntimeEnv();
  return runtimePOST(request);
}
