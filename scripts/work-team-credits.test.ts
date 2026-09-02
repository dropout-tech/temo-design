import assert from "node:assert/strict"
import {
  mergeGuestDesignerCredits,
  normalizeGuestDesignerCredits,
  normalizeWorkCreditTitle,
  renameGuestDesignerCredits,
} from "../lib/work-team-credits"

assert.equal(normalizeWorkCreditTitle("  設計  總監\n"), "設計 總監")

assert.deepEqual(
  normalizeGuestDesignerCredits([
    { name: " Amy ", creditTitle: " 統籌 " },
    { name: "amy", creditTitle: "DESIGNER" },
    { name: "Ben", title: " ART DIRECTOR " },
  ]),
  [
    { name: "Amy", creditTitle: "統籌" },
    { name: "Ben", creditTitle: "ART DIRECTOR" },
  ]
)

assert.deepEqual(
  mergeGuestDesignerCredits([{ name: "Amy", creditTitle: "統籌" }], ["Amy", "Cara"]),
  [
    { name: "Amy", creditTitle: "統籌" },
    { name: "Cara", creditTitle: "" },
  ]
)

assert.deepEqual(
  renameGuestDesignerCredits(
    [
      { name: "Amy", creditTitle: "設計總監" },
      { name: "Ben", creditTitle: "統籌" },
    ],
    "Amy",
    "Ben"
  ),
  [{ name: "Ben", creditTitle: "統籌" }]
)

console.log("work-team-credits: 4/4 passed")
