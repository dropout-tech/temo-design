import assert from "node:assert/strict"
import test from "node:test"
import {
  BUTTON_DEFAULTS,
  IMAGE_HEIGHT_DEFAULTS,
  clampInteger,
  getSafeWorkBlockHref,
  isButtonFontWeight,
  normalizeHexColor,
  normalizeOptionalImageHeightPercent,
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
