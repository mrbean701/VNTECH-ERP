// KHO VNTECH installer credential helpers.
// Kept side-effect free so the exact credential transformation can be regression tested.
export function mergeManagedEnv(baseEnv = {}, managedEnv = {}) {
  return { ...baseEnv, ...managedEnv };
}

export function encodeDatabasePassword(password) {
  return encodeURIComponent(String(password ?? ""));
}
