import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dataTable = readFileSync(new URL("../app/components/ui/DataTable.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("P2-04 — DataTable dùng sort, aria-sort và click handler cho cột sortable", () => {
  assert.match(dataTable, /sortable\?: boolean/);
  assert.match(dataTable, /onClick=\{c\.sortable && sort \? \(\) => sort\.onChange\(c\.key\) : undefined\}/);
  assert.match(dataTable, /aria-sort=\{sort && sort\.key === c\.key \? \(sort\.dir === "asc" \? "ascending" : "descending"\) : undefined\}/);
});

test("P2-04 — DataTable có trạng thái loading, error và empty thống nhất", () => {
  assert.match(dataTable, /loading\?: boolean/);
  assert.match(dataTable, /error\?: string \| null/);
  assert.match(dataTable, /emptyText = "Chưa có dữ liệu\."/);
  assert.match(dataTable, /Đang tải dữ liệu/);
  assert.match(dataTable, /Lỗi tải dữ liệu/);
  assert.match(dataTable, /!loading && !rows\.length/);
});

test("P2-04 — DataTable giữ table-wrap, baseline-table và CSS overflow để không tràn viewport", () => {
  assert.match(dataTable, /<div className="table-wrap">/);
  assert.match(dataTable, /className=\{\["baseline-table", tableClassName\]/);
  assert.match(dataTable, /tableClassName\?: string/);
  assert.match(css, /\.table-wrap\{max-height:min\(68vh,720px\);overflow:auto;position:relative/);
  assert.match(css, /\.table-wrap\{max-width:100%!important;overflow:auto!important\}/);
});

test("P2-04 — các điểm mở rộng dùng chung giữ row/table class để không mất định dạng", () => {
  assert.match(dataTable, /rowStyle\?: \(row: T, index: number\) => CSSProperties \| undefined/);
  assert.match(dataTable, /rowClassName\?: \(row: T, index: number\) => string \| undefined/);
  assert.match(dataTable, /cellClassName\?: \(row: T, index: number\) => string \| undefined/);
  assert.match(dataTable, /style=\{rowStyle \? rowStyle\(row, i\) : undefined\}/);
  assert.match(dataTable, /rowClassName \? rowClassName\(row, i\) : ""/);
});
