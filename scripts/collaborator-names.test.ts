import assert from "node:assert/strict"
import {
  buildCollaboratorDirectory,
  normalizeCollaboratorNames,
  replaceCollaboratorName,
} from "../lib/collaborator-names"

assert.deepEqual(
  normalizeCollaboratorNames(["  YVONNE   (小手川) ", "yvonne (小手川)", "", null]),
  ["YVONNE (小手川)"]
)

assert.deepEqual(
  replaceCollaboratorName(
    ["YVONNE (小手川)", "攝影團隊 A"],
    "yvonne (小手川)",
    "攝影團隊 A"
  ),
  ["攝影團隊 A"]
)

const directory = buildCollaboratorDirectory([
  {
    id: "work-1",
    slug: "first-work",
    title: "第一件作品",
    published: true,
    guest_designer_names: ["YVONNE (小手川)"],
    collaborator_names: ["攝影團隊 A"],
  },
  {
    id: "work-2",
    slug: "second-work",
    title: "第二件作品",
    published: false,
    guest_designer_names: ["yvonne (小手川)"],
    collaborator_names: ["YVONNE (小手川)"],
  },
])

assert.equal(directory.length, 3)
const yvonne = directory.find(
  (entry) => entry.kind === "guest-designer" && entry.name === "YVONNE (小手川)"
)
const collaboratorYvonne = directory.find(
  (entry) => entry.kind === "collaborator" && entry.name === "YVONNE (小手川)"
)
const photoTeam = directory.find(
  (entry) => entry.kind === "collaborator" && entry.name === "攝影團隊 A"
)
assert.ok(yvonne)
assert.ok(collaboratorYvonne)
assert.ok(photoTeam)
assert.equal(yvonne.usages.length, 2)
assert.equal(collaboratorYvonne.usages.length, 1)
assert.deepEqual(
  yvonne.variants,
  ["YVONNE (小手川)", "yvonne (小手川)"]
)
assert.equal(photoTeam.usages[0].published, true)

console.log("collaborator-names tests passed")
