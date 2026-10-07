// MT3 §IV.7 + quyết định user 27/09/2026 (A2) — TÌM VẬT TƯ THEO **TÊN PHỤ (alias)**.
//
// ⚠️ LÝ DO NGHIỆP VỤ (nguyên văn user):
//   «Trong phần modal tạo MR, PR, PO phải có giao diện tìm kiếm vật tư chứ. Tôi muốn thanh search
//    có thể tìm kiếm được bằng alias nữa vì 1 số nhân sự không nắm rõ tên chính xác của vật tư
//    họ thường tìm theo tên mà họ nhớ.»
//
// ⇒ TRƯỚC ĐÂY: ô chọn vật tư chỉ khớp **ĐÚNG CHUỖI** `` `${code} · ${name}` ``
//   (xem `app/page.tsx` — `materials.find((m)=>`${m.code} · ${m.name}`===value)`)
//   và `<datalist>` chỉ sinh option `code · name` ⇒ ⛔ **alias KHÔNG tìm được**.
//
// §14 — ĐÂY LÀ **HELPER DÙNG CHUNG** (không copy logic alias vào từng modal):
//   · `aliasOf`        — danh sách alias đang hoạt động của một vật tư
//   · `normalizeForSearch` — chuẩn hoá để so khớp «dễ dãi» (bỏ dấu · hoa/thường · khoảng trắng)
//   · `findMaterialBySearch` — tìm vật tư theo «mã · tên» HOẶC theo **alias**
//
// ⚠️ CHỐT AN TOÀN: `findMaterialBySearch` chỉ trả vật tư khi khớp **ĐÚNG** sau chuẩn hoá
//    (⛔ KHÔNG khớp mờ/một phần) — tránh chọn nhầm vật tư.
import type { Row } from "@/lib/ui-shared";

/** Chuỗi rỗng/không xác định ⇒ `""` (an toàn cho `String(...)`, ⛔ không ra `"undefined"`). */
const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));

/**
 * Chuẩn hoá văn bản để TÌM KIẾM «dễ dãi» — theo đúng nhu cầu user:
 * nhân sự **không nắm rõ tên chính xác** nên phải chịu được **khác dấu · khác hoa/thường · thừa khoảng trắng**.
 * ⛔ KHÔNG dùng cho việc GHI dữ liệu — chỉ dùng để SO KHỚP.
 */
export function normalizeForSearch(value: unknown): string {
  return s(value)
    .normalize("NFD")                     // tách dấu ra khỏi ký tự gốc
    .replace(/[\u0300-\u036f]/g, "")      // bỏ dấu
    .replace(/đ/g, "d").replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Danh sách alias **đang hoạt động** của một vật tư (⛔ bỏ alias đã ngừng: `active=0`). */
export function aliasOf(aliases: Row[] | undefined, materialId: unknown): string[] {
  const id = s(materialId);
  if (!id) return [];
  return (aliases || [])
    .filter((a) => s(a.materialId) === id && Number(a.active ?? 1) === 1)
    .map((a) => s(a.aliasName).trim())
    .filter(Boolean);
}

/** Nhãn hiển thị chuẩn của một vật tư trong danh sách chọn — dùng CHUNG cho mọi modal. */
export function materialDisplayName(material: Row): string {
  return `${s(material.code || material.materialCode)} · ${s(material.name || material.materialName)}`;
}

/**
 * Tìm vật tư theo **«mã · tên» ĐÚNG**, hoặc theo **ALIAS ĐÚNG** (đã chuẩn hoá dấu/hoa-thường).
 * ⛔ Trả `undefined` khi không khớp — người gọi tự quyết định (không tự đoán vật tư).
 */
export function findMaterialBySearch(
  materials: Row[] | undefined,
  aliases: Row[] | undefined,
  text: unknown,
): Row | undefined {
  const raw = s(text);
  const list = materials || [];
  // 1) khớp ĐÚNG nhãn hiển thị «mã · tên» (đường đi cũ — giữ nguyên để ⛔ không hồi quy)
  const exact = list.find((m) => materialDisplayName(m) === raw);
  if (exact) return exact;
  // 2) khớp theo ALIAS (đã chuẩn hoá cả hai phía)
  const target = normalizeForSearch(raw);
  if (!target) return undefined;
  const hit = list.find((m) => aliasOf(aliases, m.id).some((a) => normalizeForSearch(a) === target));
  return hit;
}

/**
 * Tập hợp các **chuỗi tra cứu** của một vật tư: nhãn hiển thị + mọi alias.
 * Dùng để sinh `<datalist>` (gợi ý) và để dựng «haystack» cho thanh tìm kiếm toàn cục.
 */
export function materialSearchTerms(material: Row, aliases: Row[] | undefined): string[] {
  const label = materialDisplayName(material);
  return [label, ...aliasOf(aliases, material.id)].filter(Boolean);
}
