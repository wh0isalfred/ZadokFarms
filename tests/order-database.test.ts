import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { handleOrderRequest } from "../src/lib/orders/boundary";

const exec = promisify(execFile);
const adminUrl = process.env.ORDER_TEST_DATABASE_URL;
let databaseUrl = adminUrl;
const databaseName = `zadok_order_test_${randomUUID().replaceAll("-", "")}`;
const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;
async function sql(query: string) {
  const { stdout } = await exec(process.env.PSQL_BIN ?? "psql", [databaseUrl!, "-X", "-q", "-t", "-A", "-v", "ON_ERROR_STOP=1", "-c", query]);
  return stdout.trim();
}
const payload = { details: { name: "Integration Customer", phone: "+2348012345678", fulfilment: "delivery" }, items: [{ slug: "cucumber", quantity: 2, expectedPrice: 3200, expectedName: "Cucumber", expectedUnit: "5 kg" }] };
const hash = "a".repeat(64);
function call(key: string, body = payload, fingerprint = hash, phone = "b".repeat(64)) {
  return `select public.submit_order_request('${key}', ${literal(JSON.stringify(body))}::jsonb, '${fingerprint}', '${phone}');`;
}

// Run only against an isolated migrated database; all non-concurrency tests roll back.
describe.skipIf(!adminUrl)("PostgreSQL order transaction", () => {
  beforeAll(async () => {
    const url = new URL(adminUrl!);
    if (!["localhost", "127.0.0.1"].includes(url.hostname)) throw Error("Use an isolated local PostgreSQL instance for these tests.");
    await sql(`create database ${databaseName};`);
    url.pathname = `/${databaseName}`;
    databaseUrl = url.toString();
    await sql(`do $$ begin
      if not exists(select from pg_roles where rolname='anon') then create role anon; end if;
      if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if;
      if not exists(select from pg_roles where rolname='service_role') then create role service_role bypassrls; end if;
      end $$;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql as 'select null::uuid';
      grant usage on schema public,auth to anon,authenticated,service_role;
      alter default privileges in schema public grant all on tables to service_role;
      alter default privileges in schema public grant all on sequences to service_role;`);
    for (const file of (await readdir("supabase/migrations")).filter((file) => file.endsWith(".sql")).sort()) {
      await sql(await readFile(`supabase/migrations/${file}`, "utf8"));
    }
  }, 30000);
  afterAll(async () => {
    databaseUrl = adminUrl;
    await sql(`drop database if exists ${databaseName};`);
  });
  it("atomically snapshots live items, records status and retries without another customer", async () => {
    const key = randomUUID();
    const output = await sql(`begin; set local role service_role; ${call(key)} ${call(key)}
      select json_build_object('orders', (select count(*) from public.order_requests), 'customers', (select count(*) from public.customers),
        'items', (select count(*) from public.order_items), 'events', (select count(*) from public.order_status_events),
        'stock', (select count(*) from public.inventory_adjustments)); rollback;`);
    const [first, second, counts] = output.split(/\r?\n/).map((line) => JSON.parse(line));
    expect(first).toEqual(second);
    expect(first.items).toEqual([{ name: "Cucumber", unit: "5 kg", price: 3200, quantity: 2 }]);
    expect(first.reference).toMatch(/^ZF-\d{8}-[A-F0-9]{8}$/);
    expect(counts).toEqual({ orders: 1, customers: 1, items: 1, events: 1, stock: 0 });
  });

  it("rejects stale products and conflicting retry payloads without partial records", async () => {
    const key = randomUUID();
    const output = await sql(`begin; ${call(key, { ...payload, items: [{ ...payload.items[0], expectedPrice: 1 }] })}
      select count(*) from public.customers; ${call(key)} ${call(key, payload, "c".repeat(64))} rollback;`);
    const lines = output.split(/\r?\n/);
    expect(JSON.parse(lines[0]).code).toBe("catalogue_changed");
    expect(lines[1]).toBe("0");
    expect(JSON.parse(lines[3]).code).toBe("key_conflict");
  });

  it("rolls back customer and order when inserting a later snapshot fails", async () => {
    const key = randomUUID();
    // A forced item constraint failure occurs after customer/order insertion.
    const output = await sql(`begin;
      alter table public.order_items add constraint force_test_failure check (quantity < 0) not valid;
      do $$ begin begin perform public.submit_order_request('${key}', ${literal(JSON.stringify(payload))}::jsonb, '${hash}', '${"b".repeat(64)}');
        raise exception 'Expected item failure'; exception when check_violation then null; end; end $$;
      select (select count(*) from public.customers) + (select count(*) from public.order_requests) + (select count(*) from private.order_submission_keys); rollback;`);
    expect(output).toBe("0");
  });

  it("enforces rate limits but lets accepted retries recover", async () => {
    const key = randomUUID();
    const output = await sql(`begin; ${call(key)}
      ${Array.from({ length: 5 }, () => call(randomUUID())).join("\n")}
      ${call(key)} rollback;`);
    const lines = output.split(/\r?\n/).map((line) => JSON.parse(line));
    expect(lines[5]).toEqual({ code: "rate_limited" });
    expect(lines[6]).toEqual(lines[0]);
  });

  it("denies public execution and protects immutable snapshots", async () => {
    expect(await sql("select has_function_privilege('anon', 'public.submit_order_request(uuid,jsonb,text,text)', 'EXECUTE') or has_function_privilege('authenticated', 'public.submit_order_request(uuid,jsonb,text,text)', 'EXECUTE');")).toBe("f");
    const output = await sql(`begin; ${call(randomUUID())}
      do $$ begin begin update public.order_items set unit_price_ngn = 1; raise exception 'Expected immutable snapshot'; exception when check_violation then null; end;
      begin delete from public.order_items; raise exception 'Expected immutable snapshot'; exception when check_violation then null; end; end $$;
      select unit_price_ngn from public.order_items; rollback;`);
    expect(output.split(/\r?\n/)[1]).toBe("3200");
  });

  it("deduplicates concurrent HTTP submissions through the real RPC", async () => {
    const key = randomUUID();
    const input = { key, ...payload };
    const gateway = async (_input: unknown, fingerprint: string, phoneHash: string) => ({ data: JSON.parse(await sql(`set role service_role; ${call(key, payload, fingerprint, phoneHash)}`)), error: null });
    const requests = Array.from({ length: 4 }, () => handleOrderRequest(new Request("https://farm.test/api/order-requests", { method: "POST", headers: { origin: "https://farm.test", "content-type": "application/json" }, body: JSON.stringify(input) }), gateway, "test-secret"));
    const results = await Promise.all(requests);
    expect(results.map((result) => result.status)).toEqual([200, 200, 200, 200]);
    const bodies = await Promise.all(results.map((result) => result.json()));
    expect(new Set(bodies.map((body) => body.receipt.reference)).size).toBe(1);
    expect(await sql(`select count(*) from public.order_requests where reference = ${literal(bodies[0].receipt.reference)};`)).toBe("1");
  });
});
