import assert from "node:assert/strict";
import { mapBoqRows } from "../app/screens/BoqControl";

const rows=[
  ["BẢNG ĐƠN GIÁ DỰ THẦU HẠNG MỤC CÔNG TRÌNH","","","","",""],
  ["STT theo Hợp đồng","Tên vật tư theo HĐ","Đơn vị","Khối lượng BOQ/HĐ","Loại dòng","Mã hệ"],
  ["IV","PHẦN ĐIỆN","đồng","","Tiêu đề hệ","DIEN"],
  ["IV.1","Lắp đặt phần thiết bị điện","đồng","","Nhóm công việc","DIEN"],
  ["","Tủ điện hạ thế tổng","","","Nhóm công việc","DIEN"],
  ["1","Ngăn tụ bù TBU-1, TBU-2","1 tủ","2","Vật tư","DIEN"],
  ["","Vỏ tủ tôn dày 2mm - Cái - 2","","","Cấu kiện","DIEN"],
  ["V","PHẦN CẤP THOÁT NƯỚC","đồng","","Tiêu đề hệ","CTN"],
  ["1","Ống uPVC D110 PN8","m","200","Vật tư","CTN"],
];
const mapped=mapBoqRows(rows,[]);
assert.deepEqual(mapped.map(row=>row.sourceOrder),[1,2,3,4,5,6,7]);
assert.deepEqual(mapped.map(row=>row.sourceRow),[3,4,5,6,7,8,9]);
assert.equal(mapped.find(row=>row.sourceOrder===1)?.rowRole,"system");
assert.equal(mapped.find(row=>row.sourceOrder===4)?.rowRole,"material");
assert.equal(mapped.find(row=>row.sourceOrder===4)?.systemCode,"DIEN");
assert.equal(mapped.find(row=>row.sourceOrder===6)?.systemCode,"CTN");
assert.equal(mapped.find(row=>row.sourceOrder===7)?.systemCode,"CTN");
assert.equal(Number(mapped.find(row=>row.sourceOrder===7)?.contractQty),200);
assert.equal(mapped.find(row=>row.sourceOrder===5)?.materialName,"Vỏ tủ tôn dày 2mm - Cái - 2");
console.log("Source-only BOQ import passed: batch order + original Excel row + explicit structure preserved without inference.");
