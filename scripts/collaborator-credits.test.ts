import assert from "node:assert/strict"
import Module from "node:module"
import type { WorkInput } from "../app/studio/(app)/works/actions"

// Exercise the actual server save/load/rename paths against an in-memory adapter.
// No Supabase client, credentials, network, or production data are used.
type Row = Record<string, unknown> & { id: string }
type QueryError = { code: string; message: string }
const rows = new Map<string, Row>()
const writes: { table: string; payload: Record<string, unknown> }[] = []
let creditReadError: QueryError | null = null

class Query implements PromiseLike<{ data: unknown; error: QueryError | null }> {
  private columns = "*"
  private id?: string
  private one = false
  private payload?: Record<string, unknown>
  private deleting = false
  constructor(private table: string) {}
  select(columns = "*") { this.columns = columns; return this }
  eq(_column: string, value: string) { this.id = value; return this }
  order() { return this }
  limit() { return this }
  in() { return this }
  single() { this.one = true; return this }
  maybeSingle() { this.one = true; return this }
  update(payload: Record<string, unknown>) { this.payload = payload; return this }
  delete() { this.deleting = true; return this }
  then<TResult1 = { data: unknown; error: QueryError | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: QueryError | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    let result: { data: unknown; error: QueryError | null }
    if (this.payload) {
      writes.push({ table: this.table, payload: this.payload })
      if (this.table === "works" && this.id) Object.assign(rows.get(this.id)!, this.payload)
      result = { data: null, error: null }
    } else if (this.deleting || this.table !== "works") {
      result = { data: [], error: null }
    } else if (this.columns.includes("collaborator_credits") && creditReadError) {
      result = { data: null, error: creditReadError }
    } else {
      const selected = this.id ? [rows.get(this.id)].filter(Boolean) : [...rows.values()]
      result = { data: this.one ? selected[0] : selected, error: null }
    }
    return Promise.resolve(result).then(onfulfilled, onrejected)
  }
}

const supabase = {
  from: (table: string) => new Query(table),
  rpc: async () => ({ error: null }),
}
const moduleLoader = Module as unknown as { _load: (id: string, ...args: unknown[]) => unknown }
const originalLoad = moduleLoader._load
moduleLoader._load = function (id, ...args) {
  if (id === "@/lib/supabase/server" || id.endsWith("/lib/supabase/server.ts")) {
    return { createClient: async () => supabase }
  }
  if (id === "next/cache") return { revalidatePath: () => undefined }
  if (id === "next/navigation") return { redirect: () => undefined }
  return originalLoad.call(this, id, ...args)
}

async function run() {
  const { saveWork } = await import("../app/studio/(app)/works/actions")
  const { getWorkForEdit } = await import("../lib/studio/works")
  const { renameCollaborator } = await import("../app/studio/(app)/collaborators/actions")
  const { getCollaboratorDirectory } = await import("../lib/studio/collaborators")
  const input: WorkInput = {
    slug: "local-test", title: "測試作品", subtitle: "", categoryGroupValues: [], year: "",
    client_id: "", cover_url: "", cover_zoom: 1, cover_position_x: 50, cover_position_y: 50,
    hero_url: "", client_logo_urls: [], video_url: "", size: "medium", description: "",
    services: [], deliverables: [], challenge: "", approach: "", result: "", quote_text: "",
    quote_author: "", awards: [], press_mentions: [], published: false, industryValues: [],
    customIndustryNames: [], designerCredits: [], guestDesignerCredits: [], blocks: [],
    collaboratorCredits: [
      { name: " Studio  A ", creditTitle: " 攝影  統籌 " },
      { name: "studio a", creditTitle: "duplicate" },
      { name: "合作團隊 B", creditTitle: "" },
    ],
  }
  rows.set("work-1", { id: "work-1", untouched: "preserved" })
  assert.deepEqual(await saveWork(input, "work-1"), { id: "work-1" })
  assert.deepEqual(rows.get("work-1")?.collaborator_names, ["Studio A", "合作團隊 B"])
  assert.deepEqual(rows.get("work-1")?.collaborator_credits, [
    { name: "Studio A", creditTitle: "攝影 統籌" }, { name: "合作團隊 B", creditTitle: "" },
  ])
  const reloaded = await getWorkForEdit("work-1")
  assert.deepEqual(reloaded?.collaboratorCredits, rows.get("work-1")?.collaborator_credits)
  assert.equal(rows.get("work-1")?.untouched, "preserved")

  // Clearing titles and deleting a partner must not resurrect stale legacy names.
  await saveWork({ ...input, collaboratorCredits: [{ name: "Studio A", creditTitle: "" }] }, "work-1")
  assert.deepEqual((await getWorkForEdit("work-1"))?.collaboratorCredits, [{ name: "Studio A", creditTitle: "" }])
  assert.deepEqual(rows.get("work-1")?.collaborator_names, ["Studio A"])
  rows.set("legacy", { id: "legacy", collaborator_names: ["舊合作夥伴"], title: "舊作品" })
  assert.deepEqual((await getWorkForEdit("legacy"))?.collaboratorCredits, [{ name: "舊合作夥伴", creditTitle: "" }])

  // Server validation happens before writes, independently of the browser limits.
  const beforeInvalid = writes.length
  for (const credits of [
    [{ name: "A", creditTitle: "字".repeat(101) }],
    [{ name: "名".repeat(101), creditTitle: "" }],
    Array.from({ length: 21 }, (_, index) => ({ name: `partner-${index}`, creditTitle: "" })),
  ]) {
    assert.ok("error" in await saveWork({ ...input, collaboratorCredits: credits }, "work-1"))
  }
  assert.equal(writes.length, beforeInvalid)

  await saveWork(input, "work-1")
  assert.deepEqual(await renameCollaborator("collaborator", "Studio A", "新團隊"), { updatedWorks: 1 })
  assert.deepEqual((await getWorkForEdit("work-1"))?.collaboratorCredits, [
    { name: "新團隊", creditTitle: "攝影 統籌" }, { name: "合作團隊 B", creditTitle: "" },
  ])
  const directory = await getCollaboratorDirectory()
  assert.equal(directory.entries.find((entry) => entry.name === "新團隊")?.usages[0].creditTitle, "攝影 統籌")
  await saveWork({ ...input, collaboratorCredits: [
    { name: "Source", creditTitle: "攝影" }, { name: "Target", creditTitle: "製片" },
  ] }, "work-1")
  await renameCollaborator("collaborator", "Source", "Target")
  assert.deepEqual(rows.get("work-1")?.collaborator_credits, [{ name: "Target", creditTitle: "製片" }])
  assert.deepEqual(rows.get("work-1")?.collaborator_names, ["Target"])

  creditReadError = { code: "42501", message: "permission denied" }
  const beforeFailedRename = writes.length
  assert.ok((await renameCollaborator("collaborator", "Target", "Blocked")).error)
  assert.equal(writes.length, beforeFailedRename)
  creditReadError = null

  console.log("collaborator-credits: save/load, legacy fallback, clear/remove, validation, rename/merge, directory titles, read-error safety passed")
}

run().catch((error: unknown) => { console.error(error); process.exitCode = 1 }).finally(() => {
  moduleLoader._load = originalLoad
})
