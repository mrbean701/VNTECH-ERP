import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const shared = readFileSync(new URL("../lib/ui-shared.tsx", import.meta.url), "utf8");

test("P2-06b — lightbox ảnh chạy trong app, có marker nghiệm thu và đóng bằng ESC", () => {
  assert.match(shared, /className="attachment-lightbox"[^>]*role="dialog"[^>]*aria-modal="true"/);
  assert.match(shared, /data-vntech="attachment-lightbox"/);
  assert.match(shared, /event\.key === "Escape"/);
});

test("P2-06b — click ảnh KHÔNG mở tab mới: chuyển sang lightbox trong app", () => {
  const listBlock = shared.slice(shared.indexOf('className="attachment-list"'), shared.indexOf('attachment-lightbox"'));
  assert.match(listBlock, /startsWith\("image\/"\)/, "phải phân biệt tệp ảnh trong danh sách");
  assert.match(listBlock, /event\.preventDefault\(\)/, "click ảnh phải chặn mở tab mới");
  assert.match(listBlock, /setPreview\(file\)/, "click ảnh phải mở lightbox");
});
