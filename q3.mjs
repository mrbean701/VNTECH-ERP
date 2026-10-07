import { readFileSync, writeFileSync } from "node:fs";
const P="app/page.tsx";
const L=readFileSync(P,"utf8").split("\n");
const i=L.findIndex(l=>l.includes("task-notify-popover"));
if(i<0) throw new Error("khong tim thay panel chuong");
const s=L[i];
if(!s.includes("<header>")) throw new Error("panel khong con header");
// them nut dong vao header
const B='<button type="button" className="notify-close" aria-label="Đóng thông báo" onClick={()=>setNotifyOpen(false)}>×</button>';
L[i]=s.replace("</header>","  "+B+"</header>");
writeFileSync(P,L.join("\n"),"utf8");
console.log("OK da them notify-close vao header panel chuong");
