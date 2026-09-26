// PHASE 3 (`T-09`) — KIẾN TRÚC PHÂN CẤP CỦA MÀN CÔNG VIỆC. Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `T-09`:
//   «Kiến trúc Task → Team → Thành viên → Hỗ trợ liên phòng (§10)».
//
// DỮ LIỆU THẬT — đo ở bootstrap, KHÔNG đoán, KHÔNG tạo bảng mới:
//   • **Task** = `workItems[]` — `id · taskNo · title · projectId · projectCode · departmentCode · assignedTo ·
//     assignedToName · status · dueAt` (`scripts/system-route.mjs:775`, bảng `work_items`).
//   • **Team** = `teams[]` — `id · code · name · trade · projectId · warehouseId` (`scripts/system-route.mjs:634`,
//     bảng `teams`) ⇒ một việc THUỘC một tổ đội khi CÙNG `projectId` (`teams.project_id` ⇄ `work_items.project_id`).
//   • **Thành viên** = `teamMembers[]` — `teamId · userId · roleInTeam · joinedAt · leftAt · active · fullName ·
//     employeeCode · roleName · department` (bảng `team_members`, migration `V14__project_membership_and_team_members.sql`;
//     khoá do Java sinh — `BootstrapDataAdapter.java:1200`). ⚠️ Khoá này **Java-only**: bootstrap JS
//     (`scripts/system-route.mjs`) KHÔNG trả `teamMembers` ⇒ khi vắng phải ghi rõ «chưa có nguồn», KHÔNG bịa sĩ số.
//   • **Hỗ trợ liên phòng** = hai nguồn THẬT, ghi rõ nguồn từng dòng:
//       (a) `workItemParticipants[]` — `workItemId · userId · userName · roleInTeam · roleName · employeeCode`
//           (`scripts/system-route.mjs:783`, bảng `work_item_participants` của `T-04`);
//       (b) thành viên tổ đội có phòng KHÁC phòng của việc (`teamMembers.department`).
//     Phòng của một người lấy từ `staffDirectory[]`/`users[]` (`organizationCode`) hoặc tra TÊN phòng trong
//     `organizationUnits[]` (`scripts/system-route.mjs:735`) — nếu KHÔNG tra được thì dòng đó bị LOẠI và nguồn
//     được ghi là «chưa có nguồn», không suy diễn.
//
// LIÊN KẾT MỞ `EntityDetailModal`: mọi chỗ bấm **Team** hoặc **Nhân sự** đi qua CỔNG DÙNG CHUNG đã có của PHASE 4
// (`app/screens/ProjectEntityModal.tsx` — `PR-04`), chính component đó render `EntityDetailModal` (U-01) với tab
// Thành viên / Dự án / Kho. KHÔNG viết modal mới, KHÔNG mở màn mới.

import { ProjectEntityModal, type ProjectEntity } from "@/app/screens/ProjectEntityModal";
import { CardHead, Empty } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { useState } from "react";

// -------------------------------------------------------------------------------------------------
// T09-PURE-BEGIN
// KHỐI THUẦN (không JSX, không import) — test `tests/t09-task-team-member.test.mjs` TRÍCH RA và CHẠY THẬT.
// -------------------------------------------------------------------------------------------------

// Bốn cấp của kiến trúc `§10`, nguyên văn theo yêu cầu — dùng để VẼ và để đối chiếu.
const HIERARCHY_LEVELS = ["Task", "Team", "Thành viên", "Hỗ trợ liên phòng"];
const NO_SOURCE_TEXT = "chưa có nguồn";

/** Task → Team: việc thuộc tổ đội CÙNG DỰ ÁN. Không có `projectId` ⇒ KHÔNG gán bừa tổ đội nào. */
function hierarchyTeamOfTask(task: Row, teams: Row[]) {
  const projectId = String(task.projectId || "");
  if (!projectId) return null;
  return (teams || []).find((team) => String(team.projectId || "") === projectId) || null;
}

/** Team → Thành viên: chỉ người ĐANG hoạt động (`active` = 1 và chưa rời `leftAt`) — đúng cách màn Tổ đội đang lọc. */
function hierarchyMembersOfTeam(team: Row | null, teamMembers: Row[]) {
  if (!team) return [];
  const teamId = String(team.id || "");
  return (teamMembers || []).filter((member) => String(member.teamId || "") === teamId
    && Number(member.active ?? 1) === 1 && !member.leftAt
    && String(member.userId || "") !== "");
}

/** Mã phòng của một người — ưu tiên mã có thật, rồi tra TÊN phòng trong `organizationUnits`; tra không ra ⇒ "". */
function hierarchyDepartmentCode(person: Row | null | undefined, units: Row[]) {
  if (!person) return "";
  const direct = String(person.organizationCode || "");
  if (direct) return direct;
  const name = String(person.department || person.organizationName || "");
  if (!name) return "";
  const unit = (units || []).find((row) => String(row.code || "") === name || String(row.name || "") === name);
  return unit ? String(unit.code || "") : "";
}

/** Tình trạng NGUỒN của một cột: có ít nhất một dòng mang giá trị thật ⇒ nêu nguồn; ngược lại ⇒ «chưa có nguồn». */
function hierarchySourceOf(rows: Row[], field: string, label: string) {
  const known = (rows || []).filter((row) => row && row[field] !== undefined && row[field] !== null && String(row[field]) !== "");
  return known.length ? `${label} · ${known.length}/${(rows || []).length} dòng có giá trị` : `${NO_SOURCE_TEXT} — ${label} rỗng trong payload`;
}

/**
 * Thành viên → Hỗ trợ liên phòng: người THAM GIA việc (`work_item_participants`) hoặc ở trong tổ đội của việc
 * (`team_members`) mà PHÒNG KHÁC phòng của việc. Mỗi dòng GIỮ NGUỒN của nó để không trộn hai nguồn làm một.
 * KHÔNG biết chắc phòng của người đó ⇒ LOẠI (không suy diễn «liên phòng»).
 */
function hierarchySupport(task: Row, members: Row[], directory: Row[], participants: Row[], units: Row[]) {
  const taskDept = String(task.departmentCode || "");
  const taskId = String(task.id || "");
  const found = new Map<string, { userId: string; name: string; departmentCode: string; department: string; role: string; sources: string[] }>();
  const push = (userId: string, name: string, person: Row | null | undefined, role: string, source: string) => {
    const code = hierarchyDepartmentCode(person, units);
    if (!userId || !taskDept || !code || code === taskDept) return;
    const current = found.get(userId);
    if (current) { if (!current.sources.includes(source)) current.sources.push(source); return; }
    found.set(userId, {
      userId,
      name: String(name || person?.fullName || ""),
      departmentCode: code,
      department: String(person?.organizationName || person?.department || ""),
      role: String(role || person?.roleName || ""),
      sources: [source],
    });
  };
  for (const participant of (participants || []).filter((row) => String(row.workItemId || "") === taskId)) {
    const userId = String(participant.userId || "");
    const person = (directory || []).find((row) => String(row.id) === userId) || null;
    push(userId, String(participant.userName || ""), person, String(participant.roleInTask || participant.roleName || ""), "work_item_participants");
  }
  for (const member of members || []) {
    push(String(member.userId || ""), String(member.fullName || ""), member, String(member.roleInTeam || ""), "team_members");
  }
  return [...found.values()];
}

/**
 * DỰNG CÂY 4 CẤP cho từng việc. Mỗi cấp mang theo `source` ĐO ĐƯỢC; cấp nào thiếu nguồn thì ghi «chưa có nguồn»
 * — UI KHÔNG được hiện 0 thay cho "không biết".
 */
function workHierarchy(data: AppData, rows: Row[]) {
  const teams = data.teams || [];
  const teamMembers = data.teamMembers || [];
  const participants = data.workItemParticipants || [];
  const units = data.organizationUnits || [];
  // Danh bạ để đối chiếu phòng ban: `staffDirectory` (mọi người) trước, rồi `users` (chỉ admin có).
  const directory = (data.staffDirectory && data.staffDirectory.length ? data.staffDirectory : (data.users || []));
  return (rows || []).map((task) => {
    const team = hierarchyTeamOfTask(task, teams);
    const members = hierarchyMembersOfTeam(team, teamMembers);
    const support = hierarchySupport(task, members, directory, participants, units);
    const taskParticipants = participants.filter((row) => String(row.workItemId || "") === String(task.id || ""));
    return {
      task, team, members, support,
      taskSource: hierarchySourceOf([task], "projectId", "workItems.projectId"),
      teamSource: team ? `teams.project_id = ${String(task.projectId || "")}` : hierarchySourceOf([task], "projectId", "teams khớp workItems.projectId"),
      memberSource: team ? hierarchySourceOf(teamMembers, "teamId", "team_members.team_id") : `${NO_SOURCE_TEXT} — chưa xác định được tổ đội`,
      supportSource: taskParticipants.length
        ? hierarchySourceOf(directory, "id", "work_item_participants + staffDirectory để đối chiếu phòng ban")
        : `${NO_SOURCE_TEXT} — chưa có người tham gia cho việc này`,
    };
  });
}

/** ĐẾM theo cấp — dùng cho dòng ghi chú của khối UI (mọi số đều từ cây thật ở trên). */
function hierarchyTotals(tree: ReturnType<typeof workHierarchy>) {
  return {
    tasks: tree.length,
    withTeam: tree.filter((node) => Boolean(node.team)).length,
    members: tree.reduce((sum, node) => sum + node.members.length, 0),
    support: tree.reduce((sum, node) => sum + node.support.length, 0),
  };
}

// T09-PURE-END

function WorkHierarchy({ data, rows, scopeNote, permission }: {
  data: AppData;
  rows: Row[];
  scopeNote: string;
  permission: Row;
}) {
  // LIÊN KẾT THỰC THỂ: Team / Nhân sự bấm vào mở CỔNG DÙNG CHUNG `ProjectEntityModal`
  // (component này render `EntityDetailModal` — U-01/PR-04). `null` ⇒ không render gì.
  const [entity, setEntity] = useState<ProjectEntity | null>(null);
  const tree = workHierarchy(data, rows);
  const totals = hierarchyTotals(tree);

  return <div className="stack work-hierarchy">
    <section className="card">
      <CardHead title="Kiến trúc Task → Team → Thành viên → Hỗ trợ liên phòng"
        note={`T-09 · ${totals.tasks} việc · ${totals.withTeam} việc xác định được tổ đội · ${totals.members} thành viên · ${totals.support} lượt hỗ trợ liên phòng — ${scopeNote}`}/>
      <p className="muted">Bốn cấp: {HIERARCHY_LEVELS.map((level, index) => <span key={level}>{index ? " → " : ""}<b>{level}</b></span>)}
        {". Nguồn: workItems · teams · team_members · work_item_participants · staffDirectory/organizationUnits."}</p>
      {!tree.length && <Empty text="Chưa có việc trong phạm vi được phép để dựng cây phân cấp."/>}
      {tree.map((node) => {
        const team = node.team;
        return <article key={String(node.task.id)} className="card hierarchy-node" data-hierarchy-task={String(node.task.id)}>
          <header className="card-head">
            <div>
              <h3><span className="code">{String(node.task.taskNo || node.task.id || "")}</span> · {String(node.task.title || "")}</h3>
              <p className="muted">Task · phòng {String(node.task.departmentCode || "—")} · dự án {String(node.task.projectCode || "—")} · người làm {String(node.task.assignedToName || "—")}</p>
            </div>
          </header>

          <div className="form-grid">
            <div data-hierarchy-level="team">
              <span className="muted">Team</span>
              {team
                ? <button type="button" className="export-mini" data-entity-kind="team"
                    title="Mở chi tiết tổ đội (EntityDetailModal)"
                    onClick={() => setEntity({ kind: "team", row: team })}>
                    {String(team.code || "")} · {String(team.name || "")}
                  </button>
                : <b className="muted">—</b>}
              <small>{node.teamSource}</small>
            </div>
            <div data-hierarchy-level="members">
              <span className="muted">Thành viên ({node.members.length})</span>
              {node.members.length
                ? node.members.map((member) => <button key={String(member.id)} type="button" className="export-mini" data-entity-kind="user"
                    title="Mở hồ sơ nhân sự (EntityDetailModal)"
                    onClick={() => setEntity({ kind: "user", row: { ...member, id: member.userId } })}>
                    {String(member.fullName || member.userId || "")}{member.roleInTeam ? ` · ${String(member.roleInTeam)}` : ""}
                  </button>)
                : <b className="muted">{NO_SOURCE_TEXT}</b>}
              <small>{node.memberSource}</small>
            </div>
            <div data-hierarchy-level="support">
              <span className="muted">Hỗ trợ liên phòng ({node.support.length})</span>
              {node.support.length
                ? node.support.map((person) => <button key={person.userId} type="button" className="export-mini" data-entity-kind="user"
                    data-support-source={person.sources.join("+")}
                    title={`Mở hồ sơ nhân sự (EntityDetailModal) · nguồn ${person.sources.join(" + ")}`}
                    onClick={() => setEntity({ kind: "user", row: { id: person.userId, fullName: person.name } })}>
                    {person.name || person.userId} · {person.departmentCode}{person.role ? ` · ${person.role}` : ""} · <em>{person.sources.join(" + ")}</em>
                  </button>)
                : <b className="muted">{NO_SOURCE_TEXT}</b>}
              <small>{node.supportSource}</small>
            </div>
          </div>
        </article>;
      })}
    </section>
    <ProjectEntityModal data={data} entity={entity} onClose={() => setEntity(null)} permission={permission}/>
  </div>;
}

export {
  HIERARCHY_LEVELS,
  NO_SOURCE_TEXT,
  WorkHierarchy,
  hierarchyDepartmentCode,
  hierarchyMembersOfTeam,
  hierarchySourceOf,
  hierarchySupport,
  hierarchyTeamOfTask,
  hierarchyTotals,
  workHierarchy,
};
