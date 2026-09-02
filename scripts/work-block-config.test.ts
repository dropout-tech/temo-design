import assert from "node:assert/strict"
import test from "node:test"
import {
  BUTTON_DEFAULTS,
  IMAGE_HEIGHT_DEFAULTS,
  TEXT_BLOCK_DEFAULTS,
  clampInteger,
  getWorkImageCount,
  getSafeWorkBlockHref,
  hasCompleteWorkImageSlots,
  isButtonFontWeight,
  normalizeHexColor,
  normalizeOptionalImageHeightPercent,
  normalizeOptionalTextFontSize,
  normalizeOptionalTextFontWeight,
  normalizeOptionalTextLetterSpacing,
  normalizeOptionalTextLineHeight,
  normalizeWorkImageCount,
} from "../lib/work-block-config"

test("button links accept supported destinations", () => {
  assert.equal(getSafeWorkBlockHref("https://example.com/work"), "https://example.com/work")
  assert.equal(getSafeWorkBlockHref("/portfolio/example"), "/portfolio/example")
  assert.equal(getSafeWorkBlockHref("#contact"), "#contact")
  assert.equal(getSafeWorkBlockHref("mailto:hello@example.com"), "mailto:hello@example.com")
  assert.equal(getSafeWorkBlockHref("tel:+886212345678"), "tel:+886212345678")
})

test("button links reject executable and ambiguous URLs", () => {
  assert.equal(getSafeWorkBlockHref("javascript:alert(1)"), null)
  assert.equal(getSafeWorkBlockHref("data:text/html,test"), null)
  assert.equal(getSafeWorkBlockHref("//example.com"), null)
  assert.equal(getSafeWorkBlockHref("example.com"), null)
  assert.equal(getSafeWorkBlockHref(""), null)
})

test("style values are normalized to safe renderable values", () => {
  assert.equal(normalizeHexColor("#ABC", BUTTON_DEFAULTS.textColor), "#aabbcc")
  assert.equal(normalizeHexColor("not-a-color", BUTTON_DEFAULTS.textColor), BUTTON_DEFAULTS.textColor)
  assert.equal(clampInteger(999, 120, 720, BUTTON_DEFAULTS.width), 720)
  assert.equal(clampInteger("40", 12, 40, BUTTON_DEFAULTS.fontSize), 40)
  assert.equal(isButtonFontWeight(700), true)
  assert.equal(isButtonFontWeight(550), false)
})

test("optional desktop image heights preserve auto mode and clamp custom values", () => {
  assert.equal(normalizeOptionalImageHeightPercent(null), null)
  assert.equal(normalizeOptionalImageHeightPercent(""), null)
  assert.equal(normalizeOptionalImageHeightPercent("125"), 125)
  assert.equal(normalizeOptionalImageHeightPercent(25), 50)
  assert.equal(normalizeOptionalImageHeightPercent(240), 200)
  assert.equal(
    normalizeOptionalImageHeightPercent("invalid"),
    IMAGE_HEIGHT_DEFAULTS.desktopPercent
  )
})

test("text block typography preserves website defaults and clamps explicit values", () => {
  assert.equal(normalizeOptionalTextFontSize(null), null)
  assert.equal(normalizeOptionalTextFontSize(96), 72)
  assert.equal(normalizeOptionalTextLineHeight("1.675"), 1.675)
  assert.equal(normalizeOptionalTextLineHeight(0.5), 1)
  assert.equal(normalizeOptionalTextLetterSpacing("0.126"), 0.126)
  assert.equal(normalizeOptionalTextLetterSpacing(1), 0.3)
  assert.equal(normalizeOptionalTextFontWeight("700"), 700)
  assert.equal(normalizeOptionalTextFontWeight(600), TEXT_BLOCK_DEFAULTS.fontWeight)
})

test("image count is normalized and inferred from the highest populated slot", () => {
  assert.equal(normalizeWorkImageCount(0), 1)
  assert.equal(normalizeWorkImageCount(9), 4)
  assert.equal(getWorkImageCount({ src: "one.jpg" }), 1)
  assert.equal(getWorkImageCount({ src: "one.jpg", src2: "two.jpg" }), 2)
  assert.equal(getWorkImageCount({ src: "one.jpg", src3: "three.jpg" }), 3)
  assert.equal(getWorkImageCount({ src: "one.jpg", src4: "four.jpg" }), 4)
})

test("image layouts require every active slot to be populated", () => {
  const fourImages = {
    src: "one.jpg",
    src2: "two.jpg",
    src3: "three.jpg",
    src4: "four.jpg",
  }

  assert.equal(hasCompleteWorkImageSlots(fourImages, 4), true)
  assert.equal(hasCompleteWorkImageSlots({ src: "one.jpg" }, 1), true)
  assert.equal(hasCompleteWorkImageSlots({ src: "one.jpg" }, 2), false)
  assert.equal(
    hasCompleteWorkImageSlots({ src: "one.jpg", src2: "two.jpg", src4: "four.jpg" }, 4),
    false
  )
  assert.equal(hasCompleteWorkImageSlots({ src: "   " }, 1), false)
})
