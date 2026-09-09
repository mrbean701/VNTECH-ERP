// VNTECH PROPRIETARY SOURCE | Universal PostgreSQL adapter for VNTECH-KHO-MEP-001 V5.0.0

function replacePlaceholders(sql) {
  let out = "";
  let index = 0;
  let quote = null;
  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    if (quote) {
      out += ch;
      if (ch === quote) {
        if (sql[i + 1] === quote) { out += sql[++i]; }
        else quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"') { quote = ch; out += ch; continue; }
    if (ch === "?") { index += 1; out += `$${index}`; continue; }
    out += ch;
  }
  return out;
}

function appendConflictIgnore(sql) {
  if (!/^\s*INSERT\s+OR\s+IGNORE\s+INTO\b/i.test(sql)) return sql;
  let out = sql.replace(/^\s*INSERT\s+OR\s+IGNORE\s+INTO\b/i, "INSERT INTO").trim();
  const semicolon = out.endsWith(";") ? ";" : "";
  if (semicolon) out = out.slice(0, -1).trimEnd();
  if (!/\bON\s+CONFLICT\b/i.test(out)) out += " ON CONFLICT DO NOTHING";
  return out + semicolon;
}

function translateSql(sql) {
  let out = String(sql)
    .replaceAll("`", '"')
    .replace(/\bMAX\(\s*requested_qty\s*-\s*stock_allocation_qty\s*,\s*0\s*\)/gi, "GREATEST(requested_qty-stock_allocation_qty,0)")
    .replace(/\bdatetime\(\s*'now'\s*\)/gi, "to_char((CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"')");
  out = appendConflictIgnore(out);
  return replacePlaceholders(out);
}

function aliasesFromSql(sql) {
  const aliases = [];
  const regex = /\bAS\s+([A-Za-z_][A-Za-z0-9_]*)/gi;
  let match;
  while ((match = regex.exec(sql))) aliases.push(match[1]);
  return aliases;
}

function restoreAliases(rows, aliases) {
  if (!aliases.length) return rows;
  return rows.map((source) => {
    const row = { ...source };
    for (const alias of aliases) {
      const lower = alias.toLowerCase();
      if (alias !== lower && Object.prototype.hasOwnProperty.call(row, lower) && !Object.prototype.hasOwnProperty.call(row, alias)) {
        row[alias] = row[lower];
        delete row[lower];
      }
    }
    return row;
  });
}

export class PostgresStatement {
  constructor(adapter, sql, values = []) {
    this.adapter = adapter;
    this.sql = String(sql);
    this.values = values;
    this.aliases = aliasesFromSql(this.sql);
  }

  bind(...values) { return new PostgresStatement(this.adapter, this.sql, values); }

  async _query(client) {
    const target = client || this.adapter.pool;
    const result = await target.query(translateSql(this.sql), this.values);
    result.rows = restoreAliases(result.rows || [], this.aliases);
    return result;
  }

  async first(column) {
    const result = await this._query();
    const row = result.rows?.[0] ?? null;
    if (column && row) return row[column];
    return row;
  }

  async all() {
    const result = await this._query();
    return { success: true, results: result.rows || [], meta: { changes: Number(result.rowCount || 0) } };
  }

  async run() {
    const result = await this._query();
    return { success: true, meta: { changes: Number(result.rowCount || 0), last_row_id: 0 } };
  }

  async raw() {
    const result = await this._query();
    return (result.rows || []).map((row) => Object.values(row));
  }

  async runWithClient(client) {
    const result = await this._query(client);
    return { success: true, meta: { changes: Number(result.rowCount || 0), last_row_id: 0 } };
  }
}

export class PostgresD1Database {
  constructor(pool) { this.pool = pool; }
  prepare(sql) { return new PostgresStatement(this, sql); }

  async batch(statements) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const results = [];
      for (const statement of statements) results.push(await statement.runWithClient(client));
      await client.query("COMMIT");
      return results;
    } catch (error) {
      try { await client.query("ROLLBACK"); } catch {}
      throw error;
    } finally {
      client.release();
    }
  }

  async exec(sql) {
    const result = await this.pool.query(translateSql(sql));
    return { count: Number(result.rowCount || 0), duration: 0 };
  }
}

export { translateSql };
