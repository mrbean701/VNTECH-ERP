import assert from "node:assert/strict";
import { createServer } from "node:net";
import { createHash, webcrypto } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { readFile, readdir } from "node:fs/promises";
import { dispatchEmailOutbox } from "../scripts/email-dispatcher.mjs";

const database = new DatabaseSync(":memory:");
class D1Statement {
  constructor(sql, values = []) { this.sql = sql; this.values = values; }
  bind(...values) { return new D1Statement(this.sql, values); }
  async first() { return database.prepare(this.sql).get(...this.values) ?? null; }
  async all() { return { success: true, results: database.prepare(this.sql).all(...this.values) }; }
  async run() { return { success: true, meta: database.prepare(this.sql).run(...this.values) }; }
}
const d1 = {
  prepare(sql) { return new D1Statement(sql); },
  async batch(statements) {
    database.exec("BEGIN");
    try { const results=[]; for (const statement of statements) results.push(await statement.run()); database.exec("COMMIT"); return results; }
    catch (error) { database.exec("ROLLBACK"); throw error; }
  },
};
for (const file of (await readdir("drizzle")).filter((name) => name.endsWith(".sql")).sort()) {
  const source = await readFile(`drizzle/${file}`, "utf8");
  for (const statement of source.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) database.exec(statement);
}

let receivedMessage = "";
const smtpServer = createServer((socket) => {
  socket.write("220 smtp.test ESMTP\r\n");
  let buffer = ""; let dataMode = false; let authStep = 0;
  socket.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    while (true) {
      if (dataMode) {
        const end = buffer.indexOf("\r\n.\r\n");
        if (end < 0) return;
        receivedMessage += buffer.slice(0, end); buffer = buffer.slice(end + 5); dataMode = false; socket.write("250 2.0.0 queued\r\n"); continue;
      }
      const end = buffer.indexOf("\r\n");
      if (end < 0) return;
      const line = buffer.slice(0, end); buffer = buffer.slice(end + 2);
      if (line.startsWith("EHLO")) socket.write("250-smtp.test\r\n250 AUTH LOGIN\r\n");
      else if (line === "AUTH LOGIN") { authStep = 1; socket.write("334 VXNlcm5hbWU6\r\n"); }
      else if (authStep === 1) { authStep = 2; socket.write("334 UGFzc3dvcmQ6\r\n"); }
      else if (authStep === 2) { authStep = 0; socket.write("235 2.7.0 authenticated\r\n"); }
      else if (line.startsWith("MAIL FROM")) socket.write("250 2.1.0 ok\r\n");
      else if (line.startsWith("RCPT TO")) socket.write("250 2.1.5 ok\r\n");
      else if (line === "DATA") { dataMode = true; socket.write("354 End data with <CR><LF>.<CR><LF>\r\n"); }
      else if (line === "QUIT") { socket.write("221 2.0.0 bye\r\n"); socket.end(); }
      else socket.write("250 ok\r\n");
    }
  });
});

await new Promise((resolve) => smtpServer.listen(0, "127.0.0.1", resolve));
const address = smtpServer.address();
assert(address && typeof address === "object");
const stamp = new Date().toISOString();
const emailSecret = "test-secret-for-email-encryption"; const iv = new Uint8Array(12).fill(7); const keyBytes = createHash("sha256").update(emailSecret).digest(); const key = await webcrypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]); const encrypted = await webcrypto.subtle.encrypt({ name: "AES-GCM", iv }, key, Buffer.from("app-password")); const storedPassword = `aesgcm$${Buffer.from(iv).toString("hex")}$${Buffer.from(encrypted).toString("hex")}`;
database.prepare(`INSERT INTO email_settings (id,enabled,smtp_host,smtp_port,security,username,password,sender_email,sender_name,base_url,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run("EMAIL", 1, "127.0.0.1", address.port, "plain", "warehouse@test.local", storedPassword, "warehouse@test.local", "MEP Warehouse", "http://127.0.0.1:8787", stamp, stamp);
database.prepare(`INSERT INTO email_outbox (id,event,recipients,subject,text_body,html_body,status,attempt_count,next_attempt_at,queued_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run("MAIL-TEST", "test", "pda@test.local", "Thử gửi SMTP", "Nội dung thử", "<b>Nội dung thử</b>", "queued", 0, stamp, stamp, stamp, stamp);

await dispatchEmailOutbox(d1, emailSecret);
const result = database.prepare(`SELECT status,sent_at AS sentAt,last_error AS lastError FROM email_outbox WHERE id='MAIL-TEST'`).get();
assert.equal(result.status, "sent", result.lastError);
assert(result.sentAt);
assert.match(receivedMessage, /Content-Type: multipart\/alternative/);
assert.match(receivedMessage, /Subject: =\?UTF-8\?B\?/);

await new Promise((resolve) => smtpServer.close(resolve));
database.close();
console.log("Email dispatcher passed: SMTP authentication → MIME message → sent status.");
