import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { SubmissionContent } from "../components/studio/submission-content"
import assert from "node:assert/strict"
import { BRIEF_PREFIX, briefPlainText, readBriefSnapshot } from "../lib/brief-snapshot"
import { buildBriefSnapshot } from "../lib/quote-brief-submission"
import { briefAnswerError } from "../lib/brief-validation"
import { parseSubmissionContent } from "../lib/submission-content"
import { buildContactEmail, contactSubmissionSchema } from "../lib/contact-submission"
import type { BriefSection } from "../lib/quote-brief-questions"

const sections: BriefSection[] = [{id:"basic",title:"基本資料",titleEn:"BASIC",questions:[
  {id:"address",label:"改名後的通訊地址",type:"text"},
  {id:"invoice",label:"是否需要開立發票？",type:"radio"},
]}, {id:"custom",title:"新增區塊 <script>",titleEn:"CUSTOM",questions:[
  {id:"new",label:"新題目：含冒號",type:"paragraph"},
  {id:"multi",label:"複選題",type:"checkbox"},
  {id:"empty",label:"選填題",type:"text"},
]}]
const answer = '第一行\n公司地址：這仍是回答\n— 偽裝區塊 —\n<script>alert("x")</script>'
const message = buildBriefSnapshot(["品牌設計","工藝專案"],sections,{address:"測試地址",invoice:"否",new:answer,multi:["第一項、含頓號","第二項"]})
const input = contactSubmissionSchema.parse({requestId:"00000000-0000-4000-8000-000000000001",name:"測試",email:"test@example.com",subject:"brand",message})
const snapshot = readBriefSnapshot(input.message)!
assert.equal(snapshot.sections[1].rows[0].answer,answer)
assert.deepEqual(snapshot.sections[1].rows[1].answer,["第一項、含頓號","第二項"])
const parsed = parseSubmissionContent(message)!
assert.equal(parsed.length,3)
assert.equal(parsed[1].rows[0].id,"address")
assert.equal(parsed[2].rows[0].answer,answer)
assert.equal(parsed[2].rows[2].answer,"")
sections[1].questions[0].label="後來改名"
assert.equal(readBriefSnapshot(message)!.sections[1].rows[0].question,"新題目：含冒號")
const email = buildContactEmail(input)
assert.ok(email.text.includes(briefPlainText(snapshot)))
assert.ok(!email.text.includes(BRIEF_PREFIX))
assert.ok(email.html.includes('scope="row"'))
assert.ok(email.html.includes("&lt;script&gt;"))
assert.ok(!email.html.includes('<script>'))
assert.equal(contactSubmissionSchema.safeParse({...input,message:BRIEF_PREFIX+'{"version":2}'}).success,false)
assert.equal(contactSubmissionSchema.safeParse({...input,message:buildBriefSnapshot(["品牌設計"],sections,{new:"文".repeat(10001)})}).success,false)
assert.ok(briefAnswerError({id:"email",label:"Email",type:"email",required:true},"not-an-email"))
assert.equal(briefAnswerError({id:"invoice",label:"發票",type:"radio",required:true},"否"),"")
assert.ok(briefAnswerError({id:"phone",label:"電話",type:"tel"},"1".repeat(51)))
const longMessage=buildBriefSnapshot(["品牌設計"],sections,{new:"&".repeat(9000)})
assert.ok(buildContactEmail({...input,message:longMessage}).html.length <= 60000)
console.log("Brief snapshots: custom labels, multiline boundaries, immutable answers, empty fields, email escaping, size limits and validation passed.")

const view = renderToStaticMarkup(React.createElement(SubmissionContent, { message }))
assert.ok(view.includes("測試地址"))
assert.ok(view.includes("新題目：含冒號"))
assert.ok(!view.includes(BRIEF_PREFIX))
assert.ok(view.includes("紀錄未包含此欄位"))
assert.ok(!view.includes("<script>"))
const manyQuestions: BriefSection[] = [{ id: "many", title: "大量題目", titleEn: "", questions: Array.from({length:100},(_,index)=>({ id:`q${index}`, label:`題目 ${index}`, type:"text" as const })) }]
manyQuestions.push({ ...manyQuestions[0], id: "many2", title: "另一區塊" })
const manyAnswers = Object.fromEntries(manyQuestions[0].questions.map((question)=>[question.id,"x".repeat(10)]))
const compactEmail = buildContactEmail(contactSubmissionSchema.parse({...input,message:buildBriefSnapshot(["品牌設計"],manyQuestions,manyAnswers)}))
assert.ok(compactEmail.html.length <= 60000)
assert.ok(compactEmail.html.includes("題目 99"))
assert.ok(!compactEmail.html.includes('scope="row"'))
