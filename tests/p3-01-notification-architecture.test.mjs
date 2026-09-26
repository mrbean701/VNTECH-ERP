import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const root = new URL("../java-backend/application/src/main/java/com/vntech/erp/application/", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");

test("P3-01 — §15.1 tách RULE thành lớp riêng, không nhúng luật vào service", () => {
  const file = "notification/NotificationRule.java";
  assert.ok(existsSync(new URL(file, root)), "phải có NotificationRule.java");
  const src = read(file);
  assert.match(src, /activeConfigsFor/);
  assert.match(src, /"web"/);
  assert.match(src, /"email"/);
});

test("P3-01 — §15.1 tách RECIPIENT RESOLVER thành lớp riêng", () => {
  const file = "notification/NotificationRecipientResolver.java";
  assert.ok(existsSync(new URL(file, root)), "phải có NotificationRecipientResolver.java");
  const src = read(file);
  assert.match(src, /resolve\(/);
  assert.match(src, /recipientMode/);
  assert.match(src, /userIdsByDepartment/);
  assert.match(src, /userIdsByProject/);
});

test("P3-01 — service DUY NHẤT điều phối pipeline, không rải logic notification", () => {
  const src = read("service/NotificationManagementUseCase.java");
  assert.match(src, /NotificationRule/);
  assert.match(src, /NotificationRecipientResolver/);
  assert.match(src, /rule\.activeConfigsFor/);
  assert.match(src, /resolver\.resolve/);
  assert.doesNotMatch(src, /switch \(type\)/, "resolver phải nằm ngoài use-case");
});
