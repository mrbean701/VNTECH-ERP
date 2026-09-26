// PHASE 1 (U-11) — MODULE DÙNG CHUNG TÁCH KHỎI `app/page.tsx`.
//
// Vì sao tách: `app/page.tsx` là MỘT tệp khổng lồ (hơn 4.000 dòng, hơn 250 khai báo top-level).
// Thứ tự cắt ĐÚNG (đã ghi ở `docs/agent-progress/U14-U11-KHAO-SAT.md` mục 2): tách HELPER DÙNG CHUNG trước
// (gỡ chặn IMPORT VÒNG), rồi mới tách từng màn.
//
// ⚠️ ĐIỀU KIỆN AN TOÀN (do `tools/tach-lat-cat-page.mjs` tự kiểm TRƯỚC KHI GHI): mọi tên mà các khối ở đây
// tham chiếu phải thuộc (a) khối cùng nằm trong tệp này, (b) tên có sẵn của JS, (c) tên đến từ `import` của
// `page.tsx` — công cụ SINH LẠI import đó ở đây, hoặc (d) kiểu của React ⇒ `import type … from "react"`.
// Không còn tên nào khác ⇒ KHÔNG thể tạo import vòng.

import { StatusBadge } from "@/app/components/ui";
import { CardHead, Empty, Kpi, date, money } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { FormEvent, useState } from "react";
import type { ChangeEvent } from "react";
function CashbankScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const [cbAccountId,setCbAccountId]=useState(data.bankAccounts[0]?.id||"");
  const selectedAccount=data.bankAccounts.find((a)=>String(a.id)===String(cbAccountId))||data.bankAccounts[0];
  const entries=data.cashbookEntries.filter((e)=>!cbAccountId||String(e.accountId)===String(cbAccountId));
  const inflow=entries.filter((e)=>String(e.entryType)==="IN").reduce((s,e)=>s+Number(e.amount||0),0),outflow=entries.filter((e)=>String(e.entryType)==="OUT").reduce((s,e)=>s+Number(e.amount||0),0);
  const balance=Number(selectedAccount?.openingBalance||0)+inflow-outflow;
  async function saveAccount(event:FormEvent<HTMLFormElement>){event.preventDefault();if(await action("save_bank_account",Object.fromEntries(new FormData(event.currentTarget))))(event.currentTarget as HTMLFormElement).reset();}
  async function saveEntry(event:FormEvent<HTMLFormElement>){event.preventDefault();const fd=new FormData(event.currentTarget);if(await action("save_cashbook_entry",{...Object.fromEntries(fd),accountId:String(fd.get("accountId")||cbAccountId)}))(event.currentTarget as HTMLFormElement).reset();}
  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="QD" label="Số dư hiện tại" value={money(balance)} note={selectedAccount?`${selectedAccount.code} · ${selectedAccount.bankName}`:"Chưa có tài khoản"} tone={balance>=0?"green":"red"}/><Kpi icon="TH" label="Thu vào" value={money(inflow)} note={`${entries.filter((e)=>String(e.entryType)==="IN").length} khoản`} tone="green"/><Kpi icon="CH" label="Chi ra" value={money(outflow)} note={`${entries.filter((e)=>String(e.entryType)==="OUT").length} khoản`} tone="amber"/><Kpi icon="TK" label="Tài khoản" value={String(data.bankAccounts.length)} note="Đang theo dõi"/></div>
  <section className="card"><CardHead title="Sổ quỹ & Ngân hàng" note="Theo dõi số quỹ tiền mặt và tài khoản ngân hàng; số dư = mở đầu + thu − chi."/><div className="filter-grid"><label><span>Tài khoản</span><select value={cbAccountId} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setCbAccountId(e.target.value)}>{data.bankAccounts.map((a)=><option key={a.id} value={a.id}>{a.code} · {a.bankName} · {a.accountNo}</option>)}{!data.bankAccounts.length&&<option value="">Chưa có tài khoản</option>}</select></label></div>
  {permission.canCreate&&<form className="payment-entry-inline bank-account-form" onSubmit={saveAccount}><input name="code" placeholder="Mã *" required/><input name="bankName" placeholder="Ngân hàng *" required/><input name="accountNo" placeholder="Số tài khoản *" required/><input name="branch" placeholder="Chi nhánh"/><input name="currency" defaultValue="VND" placeholder="Tiền tệ"/><input name="openingBalance" type="number" min="0" step="1" placeholder="Số dư đầu kỳ"/><button className="primary">＋ Thêm tài khoản</button></form>}
  {permission.canCreate&&<form className="payment-entry-inline cashbook-entry-form" onSubmit={saveEntry}><select name="accountId" value={cbAccountId} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setCbAccountId(e.target.value)}>{data.bankAccounts.map((a)=><option key={a.id} value={a.id}>{a.code}</option>)}</select><input name="entryDate" type="date" required/><select name="entryType" defaultValue="IN"><option value="IN">Thu vào</option><option value="OUT">Chi ra</option></select><input name="amount" type="number" min="0" step="1" placeholder="Số tiền *" required/><input name="counterparty" placeholder="Đối tác"/><input name="referenceType" placeholder="Loại tham chiếu (PO/HD/...)" hidden/><input name="referenceId" placeholder="Mã tham chiếu" hidden/><input name="note" placeholder="Nội dung"/><button className="primary">Ghi sổ</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Ngày</th><th>Số bút toán</th><th>Loại</th><th>Số tiền</th><th>Đối tác</th><th>Nội dung</th><th>Người ghi</th><th></th></tr></thead><tbody>{entries.map((e)=><tr key={e.id}><td>{e.entryDate}</td><td>{e.entryNo}</td><td><StatusBadge value={String(e.entryType)==="IN"?"Thu vào":"Chi ra"}/></td><td><strong className={String(e.entryType)==="IN"?"green-text":""}>{String(e.entryType)==="IN"?"+":"−"}{money(e.amount)}</strong></td><td>{e.counterparty||"—"}</td><td>{e.note||"—"}</td><td>{e.createdByName||"—"}</td><td>{permission.canEdit&&<button className="export-mini danger" onClick={()=>window.confirm("Xóa bút toán?")&&action("delete_cashbook_entry",{entryId:e.id})}>Xóa</button>}</td></tr>)}{!entries.length&&<tr><td colSpan={8}><Empty text="Chưa có bút toán."/></td></tr>}</tbody></table></div></section>
  </div>;
}
export {
  CashbankScreen,
};