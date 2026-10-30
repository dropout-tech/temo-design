import assert from "node:assert/strict"
import Module from "node:module"
import type { WorkInput } from "../app/studio/(app)/works/actions"
import { DEFAULT_COVER_CROP, getCoverCropStyle } from "../lib/cover-crop"

// Exercise the real save → Studio reload → public detail path without production writes.
type Row = Record<string, unknown>
type Result = { data: unknown; error: { message: string } | null }
const rows = new Map<string, Row>()
let missingCropColumns = false

class Query implements PromiseLike<Result> {
  private columns = "*"
  private filters: [string, unknown][] = []
  private excluded: [string, unknown][] = []
  private one = false
  private payload?: Row
  private deleting = false
  constructor(private table: string) {}
  select(columns = "*") { this.columns = columns; return this }
  eq(column: string, value: unknown) { this.filters.push([column, value]); return this }
  neq(column: string, value: unknown) { this.excluded.push([column, value]); return this }
  order() { return this }
  limit() { return this }
  in() { return this }
  single() { this.one = true; return this }
  maybeSingle() { this.one = true; return this }
  update(payload: Row) { this.payload = payload; return this }
  delete() { this.deleting = true; return this }
  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    let result: Result
    const selected = [...rows.values()].filter((row) =>
      this.filters.every(([key, value]) => row[key] === value) &&
      this.excluded.every(([key, value]) => row[key] !== value)
    )
    if (this.table !== "works" || this.deleting) {
      result = { data: [], error: null }
    } else if (this.payload) {
      selected.forEach((row) => Object.assign(row, this.payload))
      result = { data: null, error: null }
    } else if (missingCropColumns && this.columns.includes("hero_zoom")) {
      result = { data: null, error: { message: "column hero_zoom does not exist" } }
    } else {
      result = { data: this.one ? selected[0] ?? null : selected, error: null }
    }
    return Promise.resolve(result).then(onfulfilled, onrejected)
  }
}

const supabase = { from: (table: string) => new Query(table), rpc: async () => ({ error: null }) }
const loader = Module as unknown as { _load: (id: string, ...args: unknown[]) => unknown }
const originalLoad = loader._load
loader._load = function (id, ...args) {
  if (id === "@/lib/supabase/server") return { createClient: async () => supabase }
  if (id === "@/lib/supabase/public") return { createPublicClient: () => supabase }
  if (id === "server-only") return {}
  if (id === "next/cache") return { revalidatePath: () => undefined }
  if (id === "next/navigation") return { redirect: () => undefined }
  return originalLoad.call(this, id, ...args)
}

async function run() {
  const { saveWork } = await import("../app/studio/(app)/works/actions")
  const { getWorkForEdit } = await import("../lib/studio/works")
  const { getWorkDetail } = await import("../lib/portfolio-supabase")
  const input: WorkInput = {
    slug: "hero-test", title: "首圖測試", subtitle: "", categoryGroupValues: [], year: "",
    client_id: "", cover_url: "/cover.webp", cover_zoom: 1.2, cover_position_x: 15, cover_position_y: 25,
    hero_url: "/hero.webp", hero_zoom: 1.7, hero_position_x: 80, hero_position_y: 90,
    client_logo_urls: [], video_url: "", size: "medium", description: "", services: [],
    deliverables: [], challenge: "", approach: "", result: "", quote_text: "", quote_author: "",
    awards: [], press_mentions: [], published: true, industryValues: [], customIndustryNames: [],
    designerCredits: [], guestDesignerCredits: [], collaboratorCredits: [], blocks: [],
  }
  rows.set("work-1", { id: "work-1" })
  assert.deepEqual(await saveWork(input, "work-1"), { id: "work-1" })
  const edit = await getWorkForEdit("work-1")
  assert.deepEqual([edit?.hero_zoom, edit?.hero_position_x, edit?.hero_position_y], [1.7, 80, 90])
  assert.deepEqual([edit?.cover_zoom, edit?.cover_position_x, edit?.cover_position_y], [1.2, 15, 25])
  const detail = await getWorkDetail("hero-test")
  assert.equal(detail?.hero, "/hero.webp")
  assert.deepEqual(detail?.heroCrop, { zoom: 1.7, positionX: 80, positionY: 90 })
  assert.equal(getCoverCropStyle(detail?.heroCrop).objectPosition, "80% 90%")

  // Reusing the cover image still uses the independently saved hero framing.
  await saveWork({ ...input, hero_url: "" }, "work-1")
  const fallback = await getWorkDetail("hero-test")
  assert.equal(fallback?.hero, "/cover.webp")
  assert.deepEqual(fallback?.heroCrop, detail?.heroCrop)

  // Resetting cannot alter the list cover; incoming values are bounded server-side.
  await saveWork({ ...input, hero_zoom: 1, hero_position_x: 50, hero_position_y: 50 }, "work-1")
  assert.deepEqual((await getWorkDetail("hero-test"))?.heroCrop, DEFAULT_COVER_CROP)
  assert.equal((await getWorkForEdit("work-1"))?.cover_zoom, 1.2)
  await saveWork({ ...input, hero_zoom: 99, hero_position_x: -10, hero_position_y: 120 }, "work-1")
  assert.deepEqual((await getWorkDetail("hero-test"))?.heroCrop, { zoom: 3, positionX: 0, positionY: 100 })

  // A deployment before the additive migration must preserve the separate hero URL.
  missingCropColumns = true
  const oldSchema = await getWorkDetail("hero-test")
  assert.equal(oldSchema?.hero, "/hero.webp")
  assert.deepEqual(oldSchema?.heroCrop, DEFAULT_COVER_CROP)
  missingCropColumns = false
  const row = rows.get("work-1")!
  delete row.hero_zoom
  delete row.hero_position_x
  delete row.hero_position_y
  const legacy = await getWorkForEdit("work-1")
  assert.deepEqual([legacy?.hero_zoom, legacy?.hero_position_x, legacy?.hero_position_y], [1, 50, 50])
  console.log("work-hero-crop: save/reload, public detail, cover independence, reset, bounds, legacy fallback passed")
}

run().catch((error: unknown) => { console.error(error); process.exitCode = 1 }).finally(() => {
  loader._load = originalLoad
})
