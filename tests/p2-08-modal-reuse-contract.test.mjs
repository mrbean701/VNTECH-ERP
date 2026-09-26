import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../app/screens/ProjectDetailTabs.tsx", import.meta.url), "utf8");

test("P2-08 — ProjectDetailTabs không còn modal tự chế cho form tạo công việc", () => {
  assert.doesNotMatch(source, /className="overlay"[^\n]*onMouseDown/);
  assert.doesNotMatch(source, /role="dialog"[^\n]*aria-label="Tạo công việc\/nhiệm vụ"/);
});

test("P2-08 — form tạo công việc dùng BaseModal dùng chung", () => {
  assert.match(source, /import \{ BaseModal \} from "@\/lib\/ui-blocks"/);
  assert.match(source, /<BaseModal title="Tạo công việc\/nhiệm vụ"/);
  assert.match(source, /<footer className="modal-footer"><button type="button" className="secondary"/);
  assert.match(source, /<button type="submit" className="primary" disabled=\{busy\}/);
});
