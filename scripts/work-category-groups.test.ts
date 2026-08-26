import assert from "node:assert/strict"
import {
  getWorkCategoryGroupValues,
  normalizeCategoryGroupValues,
  workHasAnyCategoryGroup,
  workHasCategoryGroup,
} from "../lib/work-category-groups"

assert.deepEqual(
  normalizeCategoryGroupValues([" logo ", "packaging", "logo", "", null]),
  ["logo", "packaging"]
)
assert.deepEqual(
  getWorkCategoryGroupValues({ categoryGroup: "legacy", categoryGroups: [] }),
  ["legacy"]
)
assert.deepEqual(
  getWorkCategoryGroupValues({ categoryGroup: "legacy", categoryGroups: ["logo", "packaging"] }),
  ["logo", "packaging"]
)
assert.equal(workHasCategoryGroup({ categoryGroups: ["logo", "packaging"] }, "packaging"), true)
assert.equal(
  workHasAnyCategoryGroup({ categoryGroups: ["logo", "packaging"] }, ["craft", "packaging"]),
  true
)

console.log("work category groups: 5/5 passed")
