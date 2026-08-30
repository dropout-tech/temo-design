import assert from "node:assert/strict"
import {
  DEFAULT_TEAM_CATEGORY,
  getEnglishTeamCategoryLabel,
  groupTeamMembersByCategory,
  isDesignerTeamCategory,
} from "../lib/team-members"

const members = [
  { id: "legal", category: "LEGAL CONSULTANT 法律顧問" },
  { id: "designer", category: "DESIGNER 設計團隊" },
  { id: "patent", category: "PATENT ATTORNEY 專利顧問" },
  { id: "legacy", category: "  " },
  { id: "legal-2", category: "LEGAL CONSULTANT 法律顧問" },
]

const groups = groupTeamMembersByCategory(members, [
  "DESIGNER 設計團隊",
  "PATENT ATTORNEY 專利顧問",
  "LEGAL CONSULTANT 法律顧問",
])

assert.deepEqual(
  groups.map((group) => group.category),
  [
    "DESIGNER 設計團隊",
    "PATENT ATTORNEY 專利顧問",
    "LEGAL CONSULTANT 法律顧問",
  ],
  "registered categories should lead and blank legacy values should join the default category"
)
assert.deepEqual(
  groups.find((group) => group.category === DEFAULT_TEAM_CATEGORY)?.members.map((member) => member.id),
  ["designer", "legacy"],
  "blank legacy values should join the default category without creating a duplicate group"
)
assert.deepEqual(
  groups.find((group) => group.category === "LEGAL CONSULTANT 法律顧問")?.members.map((member) => member.id),
  ["legal", "legal-2"],
  "members should keep their original order inside a category"
)

const duplicateOrder = groupTeamMembersByCategory(
  [{ id: "member", category: "DESIGNER 設計團隊" }],
  ["DESIGNER 設計團隊", "DESIGNER 設計團隊"]
)
assert.equal(duplicateOrder.length, 1, "duplicate category registry entries should not duplicate groups")

assert.equal(getEnglishTeamCategoryLabel("DESIGNER 設計團隊"), "DESIGNER")
assert.equal(getEnglishTeamCategoryLabel("LEGAL CONSULTANT 法律顧問"), "LEGAL CONSULTANT")
assert.equal(getEnglishTeamCategoryLabel("PATENT ATTORNEY"), "PATENT ATTORNEY")

assert.equal(isDesignerTeamCategory("DESIGNER 設計團隊"), true)
assert.equal(isDesignerTeamCategory("設計師"), true)
assert.equal(isDesignerTeamCategory("PHOTOGRAPHER 攝影團隊"), false)
assert.equal(isDesignerTeamCategory("BUSINESS & TECHNOLOGY 企業科技顧問"), false)
assert.equal(isDesignerTeamCategory(null), true, "legacy blank categories should remain designers")

console.log("team member grouping tests passed")
