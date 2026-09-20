// PHASE 2 (§21) — MÀN CHI TIẾT PO. BẢN TẠM trong bước D1: cầu nối tồn tại để `page.tsx` biên dịch được
// TRƯỚC khi khối nội dung 4 phần của §21 được viết ở bước D2 (commit riêng theo từng màn).
import type { AppData, Row } from "@/lib/ui-shared";

function PurchaseOrderDrawer({ purchaseOrder }: { data: AppData; purchaseOrder: Row; close: () => void; open?: (name: string, row?: Row) => void }) {
  return <div className="overlay page-mode"><div className="drawer-body">Đang hoàn thiện màn chi tiết PO (§21) — {purchaseOrder.poNo}</div></div>;
}

export { PurchaseOrderDrawer };
