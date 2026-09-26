export const USER_BULK_HEADERS = [
  "Mã nhân viên",
  "Họ và tên",
  "Tên đăng nhập",
  "Mật khẩu",
  "Email",
  "Phòng/Bộ phận",
  "Mã chức danh",
  "Mã dự án",
  "Mã kho",
  "Ngoại lệ quyền cấp thêm",
  "Ngoại lệ quyền thu hồi",
  "Trạng thái",
];

export const PROJECT_BULK_HEADERS = [
  "Mã dự án",
  "Tên dự án",
  "Mã kho",
  "Tên kho",
  "Số hợp đồng",
  "Tên/Gói hợp đồng",
  "Ngày bắt đầu",
  "Dự kiến kết thúc",
  "Trạng thái",
];

export type UserBulkRow = {
  rowNo: number;
  employeeCode: string;
  fullName: string;
  username: string;
  password: string;
  email: string;
  department: string;
  role: string;
  projectCodes: string;
  warehouseCodes: string;
  grantSpec: string;
  revokeSpec: string;
  status: "ACTIVE" | "LOCKED";
};

export type ProjectBulkRow = {
  rowNo: number;
  code: string;
  name: string;
  warehouseCode: string;
  warehouseName: string;
  contractNo: string;
  contractName: string;
  startDate: string;
  plannedEndDate: string;
  status: "ACTIVE" | "ARCHIVED";
};

type UserMapOptions = {
  existingUsernames?: Iterable<string>;
  roleCodes?: Iterable<string>;
  organizationCodes?: Iterable<string>;
};

function normalized(value: unknown) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function value(row: string[], index: number) {
  return index >= 0 ? String(row[index] ?? "").trim() : "";
}

function excelSerialToIso(serial: number) {
  if (!Number.isFinite(serial) || serial <= 0) return "";
  const epoch = Date.UTC(1899, 11, 30);
  const date = new Date(epoch + Math.round(serial * 86400000));
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : "";
}

export function normalizeProjectImportDate(raw: unknown) {
  if (raw === null || raw === undefined || raw === "") return "";
  if (raw instanceof Date && Number.isFinite(raw.getTime())) return raw.toISOString().slice(0, 10);
  const text = String(raw).trim();
  if (!text) return "";
  if (/^\d+(?:\.\d+)?$/.test(text)) {
    const serial = Number(text);
    if (serial > 20000 && serial < 80000) return excelSerialToIso(serial);
  }
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    const [, y, m, d] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  match = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return text;
}

const USER_ALIASES = {
  employeeCode: ["ma nhan vien", "employee code", "employeecode"],
  fullName: ["ho va ten", "ho ten", "full name", "fullname"],
  username: ["ten dang nhap", "tai khoan", "username"],
  password: ["mat khau", "password"],
  email: ["email", "email cong ty"],
  department: ["phong bo phan", "phong ban", "bo phan", "department", "organization"],
  role: ["ma chuc danh", "ma vai tro", "chuc danh", "role"],
  projectCodes: ["ma du an", "cac ma du an", "project codes", "projectcodes"],
  warehouseCodes: ["ma kho", "cac ma kho", "warehouse codes", "warehousecodes"],
  grantSpec: ["ngoai le quyen cap them", "quyen cap them", "grant spec", "grantspec"],
  revokeSpec: ["ngoai le quyen thu hoi", "quyen thu hoi", "revoke spec", "revokespec"],
  status: ["trang thai", "status"],
} as const;

const PROJECT_ALIASES = {
  code: ["ma du an", "project code", "code"],
  name: ["ten du an", "project name", "name"],
  warehouseCode: ["ma kho", "warehouse code", "warehousecode"],
  warehouseName: ["ten kho", "warehouse name", "warehousename"],
  contractNo: ["so hop dong", "ma hop dong", "contract no", "contractno"],
  contractName: ["ten goi hop dong", "ten hop dong", "goi hop dong", "contract name", "contractname"],
  startDate: ["ngay bat dau", "ngay khoi cong", "start date", "startdate"],
  plannedEndDate: ["du kien ket thuc", "ngay ket thuc du kien", "planned end date", "plannedenddate"],
  status: ["trang thai", "status"],
} as const;

type AliasMap = Record<string, readonly string[]>;

function findHeader(rows: string[][], aliases: AliasMap, requiredKeys: string[]) {
  let best = { index: -1, indexes: {} as Record<string, number>, score: -1 };
  rows.forEach((row, rowIndex) => {
    const headers = row.map(normalized);
    const indexes = Object.fromEntries(
      Object.entries(aliases).map(([key, names]) => [key, headers.findIndex((header) => names.includes(header))]),
    );
    const score = Object.values(indexes).filter((index) => index >= 0).length;
    const hasRequired = requiredKeys.every((key) => indexes[key] >= 0);
    if (hasRequired && score > best.score) best = { index: rowIndex, indexes, score };
  });
  if (best.index < 0) {
    const requiredLabels = requiredKeys.map((key) => {
      const alias = aliases[key]?.[0] ?? key;
      return alias.replace(/\b\w/g, (letter) => letter.toUpperCase());
    });
    throw new Error(`Không tìm thấy dòng tiêu đề hợp lệ. File phải có các cột: ${requiredLabels.join(", ")}. Hãy tải và dùng đúng mẫu từ phần mềm.`);
  }
  return best;
}

function isGuidanceRow(row: string[]) {
  const cells = row.map(normalized).filter(Boolean);
  if (!cells.length) return false;
  const guidance = /^(bat buoc|tuy chon|mac dinh|email|ten ma|ma |nhieu ma|vd |yyyy mm dd|active |locked|de trong)/;
  return cells.filter((cell) => guidance.test(cell)).length >= Math.max(1, Math.ceil(cells.length * 0.6));
}

function validDate(valueToCheck: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valueToCheck)) return false;
  const date = new Date(`${valueToCheck}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === valueToCheck;
}

function addError(errors: string[], rowNo: number, column: string, message: string) {
  errors.push(`Dòng ${rowNo} · Cột “${column}”: ${message}`);
}

function throwErrors(errors: string[]) {
  if (!errors.length) return;
  const visible = errors.slice(0, 20);
  if (errors.length > visible.length) visible.push(`… và ${errors.length - visible.length} lỗi khác.`);
  throw new Error(visible.join("\n"));
}

function canonicalSet(values?: Iterable<string>) {
  return new Set(Array.from(values ?? [], (item) => normalized(item)));
}

export function mapUserBulkSheet(rows: string[][], options: UserMapOptions = {}) {
  const { index: headerIndex, indexes } = findHeader(rows, USER_ALIASES, ["fullName", "username", "role"]);
  const existingUsernames = canonicalSet(options.existingUsernames);
  const roleCodes = canonicalSet(options.roleCodes);
  const organizationCodes = canonicalSet(options.organizationCodes);
  const imported: UserBulkRow[] = [];
  const errors: string[] = [];
  const seenUsernames = new Map<string, number>();
  const seenEmployees = new Map<string, number>();

  rows.slice(headerIndex + 1).forEach((rawRow, offset) => {
    const rowNo = headerIndex + offset + 2;
    if (!rawRow.some((cell) => String(cell ?? "").trim()) || isGuidanceRow(rawRow)) return;
    const get = (key: keyof typeof USER_ALIASES) => value(rawRow, indexes[key]);
    const username = get("username").toLowerCase();
    const employeeCode = get("employeeCode");
    const fullName = get("fullName");
    const password = get("password");
    const email = get("email").toLowerCase();
    const department = get("department");
    const role = get("role").toLowerCase();
    const rawStatus = normalized(get("status") || "ACTIVE");

    if (!fullName) addError(errors, rowNo, "Họ và tên", "bắt buộc nhập.");
    if (!username) addError(errors, rowNo, "Tên đăng nhập", "bắt buộc nhập.");
    else if (!/^[a-z0-9._-]{3,64}$/.test(username)) addError(errors, rowNo, "Tên đăng nhập", "chỉ nhận 3–64 ký tự a-z, số, dấu chấm, gạch dưới hoặc gạch ngang.");
    if (!role) addError(errors, rowNo, "Mã chức danh", "bắt buộc nhập mã canonical.");
    else if (roleCodes.size && !roleCodes.has(normalized(role))) addError(errors, rowNo, "Mã chức danh", `không tồn tại hoặc đang bị ẩn: ${role}.`);
    if (!department) addError(errors, rowNo, "Phòng/Bộ phận", "bắt buộc chọn đơn vị trong danh mục tổ chức.");
    else if (organizationCodes.size && !organizationCodes.has(normalized(department))) addError(errors, rowNo, "Phòng/Bộ phận", `không tồn tại hoặc đang bị ẩn: ${department}.`);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) addError(errors, rowNo, "Email", "không đúng định dạng email.");
    if (!existingUsernames.has(normalized(username)) && !password) addError(errors, rowNo, "Mật khẩu", "tài khoản mới bắt buộc có mật khẩu; để trống chỉ áp dụng khi cập nhật tài khoản đã tồn tại.");
    if (password) {
      if (password.length < 8) addError(errors, rowNo, "Mật khẩu", "phải có ít nhất 8 ký tự.");
      else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) addError(errors, rowNo, "Mật khẩu", "phải có chữ hoa, chữ thường, số và ký tự đặc biệt.");
    }
    if (!["active", "locked"].includes(rawStatus)) addError(errors, rowNo, "Trạng thái", "chỉ nhận ACTIVE hoặc LOCKED.");

    const usernameKey = normalized(username);
    if (usernameKey && seenUsernames.has(usernameKey)) addError(errors, rowNo, "Tên đăng nhập", `trùng với dòng ${seenUsernames.get(usernameKey)}.`);
    else if (usernameKey) seenUsernames.set(usernameKey, rowNo);
    const employeeKey = normalized(employeeCode);
    if (employeeKey && seenEmployees.has(employeeKey)) addError(errors, rowNo, "Mã nhân viên", `trùng với dòng ${seenEmployees.get(employeeKey)}.`);
    else if (employeeKey) seenEmployees.set(employeeKey, rowNo);

    imported.push({
      rowNo,
      employeeCode,
      fullName,
      username,
      password,
      email,
      department,
      role,
      projectCodes: get("projectCodes"),
      warehouseCodes: get("warehouseCodes"),
      grantSpec: get("grantSpec"),
      revokeSpec: get("revokeSpec"),
      status: rawStatus === "locked" ? "LOCKED" : "ACTIVE",
    });
  });

  if (!imported.length) throw new Error(`Không có dòng dữ liệu tài khoản sau dòng tiêu đề ${headerIndex + 1}. Hãy xóa dòng ghi chú dư hoặc dùng đúng mẫu từ phần mềm.`);
  if (imported.length > 500) errors.push(`File có ${imported.length} dòng dữ liệu; mỗi lần chỉ nhận tối đa 500 tài khoản.`);
  throwErrors(errors);
  return imported;
}

export function mapProjectBulkSheet(rows: string[][]) {
  const { index: headerIndex, indexes } = findHeader(rows, PROJECT_ALIASES, ["code", "name"]);
  const imported: ProjectBulkRow[] = [];
  const errors: string[] = [];
  const seenCodes = new Map<string, number>();
  const seenWarehouses = new Map<string, number>();

  rows.slice(headerIndex + 1).forEach((rawRow, offset) => {
    const rowNo = headerIndex + offset + 2;
    if (!rawRow.some((cell) => String(cell ?? "").trim()) || isGuidanceRow(rawRow)) return;
    const get = (key: keyof typeof PROJECT_ALIASES) => value(rawRow, indexes[key]);
    const code = get("code").toUpperCase();
    const name = get("name");
    const warehouseCode = (get("warehouseCode") || (code ? `KHO-${code}` : "")).toUpperCase();
    const startDate = normalizeProjectImportDate(get("startDate"));
    const plannedEndDate = normalizeProjectImportDate(get("plannedEndDate"));
    const rawStatus = normalized(get("status") || "ACTIVE");

    if (!code) addError(errors, rowNo, "Mã dự án", "bắt buộc nhập.");
    else if (!/^[A-Z0-9._-]{2,24}$/.test(code)) addError(errors, rowNo, "Mã dự án", "chỉ nhận 2–24 ký tự A-Z, số, dấu chấm, gạch dưới hoặc gạch ngang.");
    if (!name) addError(errors, rowNo, "Tên dự án", "bắt buộc nhập.");
    if (warehouseCode && !/^[A-Z0-9._-]{2,32}$/.test(warehouseCode)) addError(errors, rowNo, "Mã kho", "chỉ nhận A-Z, số, dấu chấm, gạch dưới hoặc gạch ngang.");
    if (startDate && !validDate(startDate)) addError(errors, rowNo, "Ngày bắt đầu", "phải là ngày hợp lệ theo định dạng DD/MM/YYYY.");
    if (plannedEndDate && !validDate(plannedEndDate)) addError(errors, rowNo, "Dự kiến kết thúc", "phải là ngày hợp lệ theo định dạng DD/MM/YYYY.");
    if (startDate && plannedEndDate && validDate(startDate) && validDate(plannedEndDate) && plannedEndDate < startDate) addError(errors, rowNo, "Dự kiến kết thúc", "không được trước Ngày bắt đầu.");
    if (!["active", "inactive", "archived"].includes(rawStatus)) addError(errors, rowNo, "Trạng thái", "chỉ nhận ACTIVE, INACTIVE hoặc ARCHIVED.");

    const codeKey = normalized(code);
    if (codeKey && seenCodes.has(codeKey)) addError(errors, rowNo, "Mã dự án", `trùng với dòng ${seenCodes.get(codeKey)}.`);
    else if (codeKey) seenCodes.set(codeKey, rowNo);
    const warehouseKey = normalized(warehouseCode);
    if (warehouseKey && seenWarehouses.has(warehouseKey)) addError(errors, rowNo, "Mã kho", `trùng với dòng ${seenWarehouses.get(warehouseKey)}.`);
    else if (warehouseKey) seenWarehouses.set(warehouseKey, rowNo);

    imported.push({
      rowNo,
      code,
      name,
      warehouseCode,
      warehouseName: get("warehouseName") || (code ? `Kho công trường ${code}` : ""),
      contractNo: get("contractNo"),
      contractName: get("contractName"),
      startDate,
      plannedEndDate,
      status: ["inactive", "archived"].includes(rawStatus) ? "ARCHIVED" : "ACTIVE",
    });
  });

  if (!imported.length) throw new Error(`Không có dòng dữ liệu dự án sau dòng tiêu đề ${headerIndex + 1}. Hãy xóa dòng ghi chú dư hoặc dùng đúng mẫu từ phần mềm.`);
  if (imported.length > 300) errors.push(`File có ${imported.length} dòng dữ liệu; mỗi lần chỉ nhận tối đa 300 dự án.`);
  throwErrors(errors);
  return imported;
}
