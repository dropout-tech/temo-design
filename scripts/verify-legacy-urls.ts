import assert from "node:assert/strict"
import approved from "./fixtures/approved-legacy-works.json"

const base = process.argv[2] || "http://localhost:3107"
const headers = { "user-agent": "Googlebot" }
function decode(s: string) {
  return s.replace(/&amp;/g,"&").replace(/&#x27;|&#39;/g,"'").replace(/&quot;/g,'"')
}
async function run() {
  for (const row of approved) {
    const res = await fetch(base+row.oldPath, { redirect:"manual", headers })
    assert.equal(res.status,200,`${row.oldPath}: must serve HTML without redirect`)
    assert.equal(res.headers.get("location"),null)
    const html=await res.text()
    const h1=[...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map(m=>decode(m[1].replace(/<[^>]+>/g,"")))
    assert.ok(h1.includes(row.title),`${row.oldPath}: wrong work: ${h1}`)
    assert.ok(html.includes(`rel="canonical" href="https://temo.design${row.oldPath}"`),`${row.oldPath}: canonical`)
    assert.ok(!/name="robots" content="[^"]*noindex/.test(html),`${row.oldPath}: noindex`)
    assert.ok(!/name="robots" content="[^"]*none/.test(html),`${row.oldPath}: robots none`)
    assert.ok((html.match(/<img\b/g)||[]).length>0,`${row.oldPath}: no images`)
    const alias=await fetch(`${base}/portfolio/${row.slug}`,{redirect:"manual",headers})
    assert.ok([301,308].includes(alias.status),`${row.slug}: new alias must converge to old address`)
    assert.equal(new URL(alias.headers.get("location")!,base).pathname,row.oldPath)
    console.log(`PASS ${row.oldPath} -> ${row.title}`)
  }
  const sitemap=await (await fetch(base+"/sitemap.xml")).text()
  for(const row of approved){
    assert.ok(sitemap.includes(`<loc>https://temo.design${row.oldPath}</loc>`))
    assert.ok(!sitemap.includes(`<loc>https://temo.design/portfolio/${row.slug}</loc>`))
  }
  const chaj=await fetch(base+"/portfolio/oriental-beauty",{redirect:"manual",headers})
  assert.equal(chaj.status,200)
  assert.ok((await chaj.text()).includes('茶覺 - 東方美人茶潤澤修護凝露'))
  for(const path of ["/not-a-real-legacy-work-zz", "/constructor", "/oriental-beauty"]){
    assert.equal((await fetch(base+path,{redirect:"manual",headers})).status,404,path)
  }
  for(const path of ["/", "/about", "/contact", "/services/brand-graphic", "/studio/login"]){
    assert.equal((await fetch(base+path,{redirect:"manual",headers})).status,200,path)
  }
  const listing=await (await fetch(base+"/services/brand-graphic",{headers})).text()
  assert.ok(listing.includes('href="/60-1"'))
  assert.ok(!listing.includes('href="/portfolio/golden-bell-60"'))
  console.log("PASS sitemap, CHAJ, unknown paths, existing routes and internal links")
}
run().catch(e=>{ console.error(e);process.exitCode=1 })
