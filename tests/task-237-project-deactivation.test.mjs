// TASK-237 — TEST quy tắc ③ (phần còn lại): «DỰ ÁN NGỪNG ⇒ HỎI USER CÓ NGỪNG KHO KHÔNG»
//   (user chốt · DEC-20261008-013)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  projectDeactivationPrompt,
  ALLOW_DELETE_WAREHOUSE,
  WAREHOUSE_DEACTIVATE_ACTIONS,
  WAREHOUSE_DEACTIVATE_LABELS,
} from "../lib/warehouse-hub.ts";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("TASK-237 — ⛔⛔ nguyên tắc gốc: KHÔNG cho phép XOÁ kho", () => {
  assert.equal(ALLOW_DELETE_WAREHOUSE, false, "user chốt: «Xóa kho: không cho phép»");
  assert.deepEqual([...WAREHOUSE_DEACTIVATE_ACTIONS], ["hide", "deactivate"], "chỉ có ẨN hoặc NGỪNG");
  assert.equal(WAREHOUSE_DEACTIVATE_LABELS.hide, "Ẩn kho");
  assert.equal(WAREHOUSE_DEACTIVATE_LABELS.deactivate, "Ngừng hoạt động");
});

test("TASK-237 — ⭐ ngừng dự án CÓ kho ⇒ PHẢI HỎI user, và nêu ĐÚNG tên kho", () => {
  const duAn = { id: "P1", name: "Dự án A06" };
  const kho = [
    { id: "W1", code: "KD-001", name: "KHO Dự án A06", projectId: "P1", active: 1 },
    { id: "W2", code: "KD-002", name: "KHO Dự án A06 - kho 2", projectId: "P1", active: 1 },
  ];
  const r = projectDeactivationPrompt(duAn, kho);
  assert.equal(r.shouldAsk, true, "có kho ⇒ PHẢI hỏi (⛔ không tự ngừng)");
  assert.equal(r.warehouses.length, 2);
  assert.match(r.message, /Dự án A06/);
  assert.match(r.message, /Bạn có ngừng 2 kho/, "nêu ĐÚNG số kho");
  assert.match(r.message, /KHO Dự án A06/, "nêu tên kho trong câu hỏi");
});

test("TASK-237 — ⭐ kho ĐÃ NGỪNG thì ⛔ KHÔNG hỏi lại (chỉ hỏi kho còn hoạt động)", () => {
  const duAn = { id: "P1", name: "Dự án A06" };
  const r = projectDeactivationPrompt(duAn, [
    { id: "W1", code: "KD-001", name: "KHO A06", projectId: "P1", active: 0 }, // đã ngừng
    { id: "W2", code: "KD-002", name: "KHO A06 - 2", projectId: "P1", active: 1 },
  ]);
  assert.equal(r.warehouses.length, 1, "⛔ bỏ kho đã ngừng");
  assert.equal(r.warehouses[0].id, "W2");
});

test("TASK-237 — ⭐ dự án KHÔNG có kho nào ⇒ ⛔ KHÔNG hỏi (không có gì để ngừng)", () => {
  const r = projectDeactivationPrompt({ id: "P9", name: "Dự án mới" }, [
    { id: "W1", code: "KD-001", name: "KHO A06", projectId: "P1", active: 1 }, // của dự án KHÁC
  ]);
  assert.equal(r.shouldAsk, false);
  assert.equal(r.warehouses.length, 0);
  assert.equal(r.message, "");
});

test("TASK-237 — ⭐ kho TỔNG (⛔ không gắn dự án) KHÔNG bị ảnh hưởng", () => {
  const r = projectDeactivationPrompt({ id: "P1", name: "Dự án A06" }, [
    { id: "WC", code: "KD-000", name: "Kho Tổng", projectId: null, active: 1 },
    { id: "W1", code: "KD-001", name: "KHO Dự án A06", projectId: "P1", active: 1 },
  ]);
  assert.equal(r.warehouses.length, 1, "⛔ Kho Tổng KHÔNG bị liệt kê");
  assert.equal(r.warehouses[0].id, "W1");
});

test("TASK-237 — chịu dữ liệu thiếu/bẩn (dự án null · kho rỗng · thiếu `active`)", () => {
  assert.equal(projectDeactivationPrompt(null, []).shouldAsk, false);
  assert.equal(projectDeactivationPrompt(undefined, null).shouldAsk, false);
  assert.equal(projectDeactivationPrompt({}, []).shouldAsk, false, "⛔ không có id ⇒ ⛔ không hỏi");
  // ⚠️ thiếu `active` ⇒ coi như ĐANG hoạt động (mặc định 1) — giống `Number(w.active ?? 1)`
  const r = projectDeactivationPrompt({ id: "P1", name: "X" }, [
    { id: "W1", code: "KD-001", name: "KHO X", projectId: "P1" },
  ]);
  assert.equal(r.shouldAsk, true, "thiếu `active` ⇒ vẫn coi là đang hoạt động");
});

test("TASK-237 — phải ghi rõ ⛔ KHÔNG tự ngừng kho (user chốt «không thì kệ») + truy vết §22", () => {
  const hub = read("lib/warehouse-hub.ts");
  assert.match(hub, /DEC-20261008-013/, "phải trỏ về quyết định của user");
  assert.match(hub, /kệ/, "phải ghi nguyên văn «không thì kệ» ⇒ ⛔ hệ thống không tự ngừng");
  assert.match(hub, /KHÔNG tự ngừng kho/, "phải nêu rõ giới hạn");
  assert.doesNotMatch(hub, /delete_warehouse/, "⛔ lib KHÔNG được chứa action xoá kho");
});
