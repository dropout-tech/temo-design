"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { sanitizeRichText, richTextIsEmpty } from "@/lib/sanitize-rich-text"
import { normalizeWorkSlug } from "@/lib/work-slug"
import { normalizeCoverCrop } from "@/lib/cover-crop"
import {
  BUTTON_DEFAULTS,
  DIVIDER_DEFAULTS,
  WORK_BLOCK_LIMITS,
  clampInteger,
  getSafeWorkBlockHref,
  isButtonFontWeight,
  isHexColor,
  normalizeHexColor,
  normalizeOptionalImageHeightPercent,
} from "@/lib/work-block-config"
import { normalizeCategoryGroupValues } from "@/lib/work-category-groups"

export type WorkInput = {
  slug: string
  title: string
  subtitle: string
  categoryGroupValues: string[]
  year: string
  client_id: string
  cover_url: string
  cover_zoom: number
  cover_position_x: number
  cover_position_y: number
  /** 內頁首圖，選填，留空＝沿用封面圖 */
  hero_url: string
  /** 客戶 LOGO，選填可多張（一件作品可能有多位客戶）；顯示於作品內頁右側資訊欄最頂端 */
  client_logo_urls: string[]
  video_url: string
  size: "large" | "medium" | "small"
  description: string
  services: string[]
  deliverables: string[]
  challenge: string
  approach: string
  result: string
  quote_text: string
  quote_author: string
  awards: string[]
  /** 新聞報導：一行一則「媒體名稱 網址」（migration 0019） */
  press_mentions: string[]
  published: boolean
  industryValues: string[]
  /** 作品專屬、未列入固定選項的行業顯示名稱 */
  customIndustryNames: string[]
  designerIds: string[]
  /** 作品專屬的外部／單次合作設計師顯示名稱 */
  guestDesignerNames: string[]
  /** 作品專屬的攝影師、顧問或外部合作團隊顯示名稱 */
  collaboratorNames: string[]
  blocks: {
    type: "image" | "video" | "text" | "divider" | "button"
    src: string
    alt: string
    width: number | null
    height: number | null
    desktop_height_percent: number | null
    src2: string
    alt2: string
    width2: number | null
    height2: number | null
    desktop_height_percent2: number | null
    text_content: string
    video_url: string
    caption: string
    caption_mobile: string
    divider_color: string
    divider_width: number
    divider_thickness: number
    button_text: string
    button_url: string
    button_open_new_tab: boolean
    button_width: number
    button_height: number
    button_text_color: string
    button_background_color: string
    button_font_size: number
    button_font_weight: number
  }[]
}

const CUSTOM_NAME_MAX = 100
const CUSTOM_NAME_LIMIT = 20

function normalizeCustomNames(names: unknown) {
  const seen = new Set<string>()
  const normalized: string[] = []

  if (!Array.isArray(names)) return normalized

  for (const raw of names) {
    if (typeof raw !== "string") continue
    const name = raw.trim().replace(/\s+/g, " ")
    const key = name.toLocaleLowerCase()
    if (!name || seen.has(key)) continue
    seen.add(key)
    normalized.push(name)
  }

  return normalized
}

function toRow(input: WorkInput, categoryGroupValues: string[]) {
  const coverCrop = normalizeCoverCrop({
    zoom: input.cover_zoom,
    positionX: input.cover_position_x,
    positionY: input.cover_position_y,
  })

  return {
    slug: normalizeWorkSlug(input.slug),
    title: input.title.trim(),
    subtitle: input.subtitle.trim() || null,
    // 舊欄位保留第一個選項，讓尚未改用多對多關聯的讀取端仍能正常顯示。
    category_group: categoryGroupValues[0] ?? null,
    year: input.year.trim() || null,
    client_id: input.client_id || null,
    cover_url: input.cover_url.trim() || null,
    cover_zoom: coverCrop.zoom,
    cover_position_x: coverCrop.positionX,
    cover_position_y: coverCrop.positionY,
    hero_url: input.hero_url.trim() || null,
    // 多張 LOGO 以換行分隔存進既有 text 欄位（免 migration；讀取端 split("\n") 還原）
    client_logo_url:
      input.client_logo_urls.map((u) => u.trim()).filter(Boolean).join("\n") || null,
    video_url: input.video_url.trim() || null,
    size: input.size,
    description: input.description.trim() || null,
    services: input.services,
    deliverables: input.deliverables,
    challenge: input.challenge.trim() || null,
    approach: input.approach.trim() || null,
    result: input.result.trim() || null,
    quote_text: input.quote_text.trim() || null,
    quote_author: input.quote_author.trim() || null,
    awards: input.awards,
    press_mentions: input.press_mentions,
    custom_industry_names: normalizeCustomNames(input.customIndustryNames),
    guest_designer_names: normalizeCustomNames(input.guestDesignerNames),
    collaborator_names: normalizeCustomNames(input.collaboratorNames),
    published: input.published,
  }
}

/** 新增或更新作品（含 行業 / 設計師 關聯）。成功則導回列表，失敗回傳 { error }。 */
export async function saveWork(
  input: WorkInput,
  id?: string
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const normalizedSlug = normalizeWorkSlug(input.slug)

  if (!input.title.trim() || !normalizedSlug) {
    return { error: "標題與網址 slug 為必填" }
  }
  const customIndustryNames = normalizeCustomNames(input.customIndustryNames)
  if (customIndustryNames.length > CUSTOM_NAME_LIMIT) {
    return { error: `每件作品最多可新增 ${CUSTOM_NAME_LIMIT} 個其他行業` }
  }
  if (customIndustryNames.some((name) => name.length > CUSTOM_NAME_MAX)) {
    return { error: `其他行業名稱請控制在 ${CUSTOM_NAME_MAX} 個字內` }
  }
  const guestDesignerNames = normalizeCustomNames(input.guestDesignerNames)
  if (guestDesignerNames.length > CUSTOM_NAME_LIMIT) {
    return { error: `每件作品最多可新增 ${CUSTOM_NAME_LIMIT} 位其他合作設計師` }
  }
  if (guestDesignerNames.some((name) => name.length > CUSTOM_NAME_MAX)) {
    return { error: `其他合作設計師名稱請控制在 ${CUSTOM_NAME_MAX} 個字內` }
  }
  const collaboratorNames = normalizeCustomNames(input.collaboratorNames)
  if (collaboratorNames.length > CUSTOM_NAME_LIMIT) {
    return { error: `每件作品最多可新增 ${CUSTOM_NAME_LIMIT} 個合作夥伴` }
  }
  if (collaboratorNames.some((name) => name.length > CUSTOM_NAME_MAX)) {
    return { error: `合作夥伴名稱請控制在 ${CUSTOM_NAME_MAX} 個字內` }
  }

  const categoryGroupValues = normalizeCategoryGroupValues(input.categoryGroupValues)
  if (categoryGroupValues.length > 0) {
    const { data: validGroups, error: categoryError } = await supabase
      .from("category_groups")
      .select("value")
      .in("value", categoryGroupValues)
    if (categoryError) return { error: categoryError.message }
    if ((validGroups ?? []).length !== categoryGroupValues.length) {
      return { error: "執行項目清單已更新，請重新整理後再選一次" }
    }
  }

  for (const [index, block] of input.blocks.entries()) {
    if (block.type === "button") {
      if (!block.button_text.trim()) {
        return { error: `第 ${index + 1} 個按鈕區塊尚未填寫按鈕文字` }
      }
      if (block.button_text.trim().length > 120) {
        return { error: `第 ${index + 1} 個按鈕區塊文字請控制在 120 個字內` }
      }
      if (!getSafeWorkBlockHref(block.button_url)) {
        return { error: `第 ${index + 1} 個按鈕區塊需要有效的網頁、站內、Email 或電話連結` }
      }
      if (block.button_url.trim().length > 2048) {
        return { error: `第 ${index + 1} 個按鈕區塊的連結過長` }
      }
      if (!isHexColor(block.button_text_color) || !isHexColor(block.button_background_color)) {
        return { error: `第 ${index + 1} 個按鈕區塊的顏色格式不正確` }
      }
    }

    if (block.type === "divider" && !isHexColor(block.divider_color)) {
      return { error: `第 ${index + 1} 個分隔線區塊的顏色格式不正確` }
    }
  }

  const row = toRow(input, categoryGroupValues)
  let workId = id

  if (id) {
    const { error } = await supabase.from("works").update(row).eq("id", id)
    if (error) return { error: error.message }
  } else {
    // 新作品一律接在目前排序最後，避免沿用 DB 預設 100 造成多筆同順位。
    const { data: lastWork, error: sortError } = await supabase
      .from("works")
      .select("sort")
      .order("sort", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (sortError) return { error: sortError.message }

    const { data, error } = await supabase
      .from("works")
      .insert({ ...row, sort: (lastWork?.sort ?? 0) + 1 })
      .select("id")
      .single()
    if (error) return { error: error.message }
    workId = data.id
  }

  // 重建執行項目關聯；第一個選項同時已寫入 works.category_group 作為舊版相容值。
  const { error: deleteCategoryError } = await supabase
    .from("work_category_groups")
    .delete()
    .eq("work_id", workId!)
  if (deleteCategoryError) {
    return { error: `執行項目複選尚未就緒：${deleteCategoryError.message}` }
  }
  if (categoryGroupValues.length > 0) {
    const { error } = await supabase.from("work_category_groups").insert(
      categoryGroupValues.map((value, index) => ({
        work_id: workId!,
        category_group_value: value,
        sort: index,
      }))
    )
    if (error) return { error: error.message }
  }

  // 重建行業關聯
  await supabase.from("work_industries").delete().eq("work_id", workId!)
  if (input.industryValues.length > 0) {
    const { error } = await supabase
      .from("work_industries")
      .insert(input.industryValues.map((v) => ({ work_id: workId!, industry_value: v })))
    if (error) return { error: error.message }
  }

  // 重建 設計師 關聯
  await supabase.from("work_designers").delete().eq("work_id", workId!)
  if (input.designerIds.length > 0) {
    const { error } = await supabase
      .from("work_designers")
      .insert(input.designerIds.map((d, i) => ({ work_id: workId!, designer_id: d, sort: i })))
    if (error) return { error: error.message }
  }

  // 重建 內容區塊（work_blocks，取代 work_gallery 成為作品內容的唯一來源）
  // 注意：migration 0015 尚未套用到 DB 時，work_blocks 表不存在，這裡會回傳錯誤並讓 saveWork 失敗——
  // 這是預期行為（資料層就緒前不假裝存檔成功），不吞掉錯誤。
  await supabase.from("work_blocks").delete().eq("work_id", workId!)
  if (input.blocks.length > 0) {
    const { error } = await supabase.from("work_blocks").insert(
      input.blocks.map((b, i) => {
        const cleanText = b.type === "text" ? sanitizeRichText(b.text_content) : b.text_content.trim()
        const safeButtonUrl = b.type === "button" ? getSafeWorkBlockHref(b.button_url) : null
        return {
          work_id: workId!,
          type: b.type,
          src: b.src.trim() || null,
          alt: b.alt.trim() || null,
          width: b.width,
          height: b.height,
          desktop_height_percent:
            b.type === "image"
              ? normalizeOptionalImageHeightPercent(b.desktop_height_percent)
              : null,
          src2: b.src2.trim() || null,
          alt2: b.alt2.trim() || null,
          width2: b.width2,
          height2: b.height2,
          desktop_height_percent2:
            b.type === "image" && b.src2.trim()
              ? normalizeOptionalImageHeightPercent(b.desktop_height_percent2)
              : null,
          text_content:
            b.type === "text" ? (richTextIsEmpty(cleanText) ? null : cleanText) : cleanText || null,
          video_url: b.video_url.trim() || null,
          caption: b.caption.trim() || null,
          caption_mobile: b.caption_mobile.trim() || null,
          divider_color:
            b.type === "divider" ? normalizeHexColor(b.divider_color, DIVIDER_DEFAULTS.color) : null,
          divider_width:
            b.type === "divider"
              ? clampInteger(
                  b.divider_width,
                  WORK_BLOCK_LIMITS.dividerWidth.min,
                  WORK_BLOCK_LIMITS.dividerWidth.max,
                  DIVIDER_DEFAULTS.width
                )
              : null,
          divider_thickness:
            b.type === "divider"
              ? clampInteger(
                  b.divider_thickness,
                  WORK_BLOCK_LIMITS.dividerThickness.min,
                  WORK_BLOCK_LIMITS.dividerThickness.max,
                  DIVIDER_DEFAULTS.thickness
                )
              : null,
          button_text: b.type === "button" ? b.button_text.trim() : null,
          button_url: safeButtonUrl,
          button_open_new_tab: b.type === "button" ? Boolean(b.button_open_new_tab) : null,
          button_width:
            b.type === "button"
              ? clampInteger(
                  b.button_width,
                  WORK_BLOCK_LIMITS.buttonWidth.min,
                  WORK_BLOCK_LIMITS.buttonWidth.max,
                  BUTTON_DEFAULTS.width
                )
              : null,
          button_height:
            b.type === "button"
              ? clampInteger(
                  b.button_height,
                  WORK_BLOCK_LIMITS.buttonHeight.min,
                  WORK_BLOCK_LIMITS.buttonHeight.max,
                  BUTTON_DEFAULTS.height
                )
              : null,
          button_text_color:
            b.type === "button"
              ? normalizeHexColor(b.button_text_color, BUTTON_DEFAULTS.textColor)
              : null,
          button_background_color:
            b.type === "button"
              ? normalizeHexColor(b.button_background_color, BUTTON_DEFAULTS.backgroundColor)
              : null,
          button_font_size:
            b.type === "button"
              ? clampInteger(
                  b.button_font_size,
                  WORK_BLOCK_LIMITS.buttonFontSize.min,
                  WORK_BLOCK_LIMITS.buttonFontSize.max,
                  BUTTON_DEFAULTS.fontSize
                )
              : null,
          button_font_weight:
            b.type === "button"
              ? isButtonFontWeight(b.button_font_weight)
                ? Number(b.button_font_weight)
                : BUTTON_DEFAULTS.fontWeight
              : null,
          sort: i,
        }
      })
    )
    if (error) return { error: error.message }
  }

  // 後台與前台一起刷新（前台立即反映，不必等 ISR 60 秒）
  revalidatePath("/studio/works")
  revalidatePath("/portfolio")
  revalidatePath("/portfolio/[slug]", "page")
  redirect("/studio/works")
}

export async function deleteWork(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { error } = await supabase.from("works").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/studio/works")
  redirect("/studio/works")
}

export async function setWorkPublished(
  id: string,
  published: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("works")
    .update({ published })
    .eq("id", id)
    .select("slug")
    .maybeSingle()
  if (error) return { error: error.message }

  revalidatePath("/studio/works")
  revalidatePath("/portfolio")
  if (data?.slug) revalidatePath(`/portfolio/${data.slug}`)

  return {}
}

export async function setWorkCardSize(
  id: string,
  size: "large" | "medium" | "small"
): Promise<{ error?: string }> {
  if (!["large", "medium", "small"].includes(size)) {
    return { error: "不支援的卡片版型" }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("works").update({ size }).eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/studio/works")
  revalidatePath("/portfolio")
  revalidatePath("/services/[slug]", "page")
  return {}
}

/** 作品管理拖曳排序：列表必須是完整且不重複的作品 ID，避免篩選中誤改隱藏項目的相對順序。 */
export async function reorderWorks(ids: string[]): Promise<{ error?: string }> {
  if (ids.length === 0 || new Set(ids).size !== ids.length) {
    return { error: "排序資料不完整，請重新整理後再試" }
  }

  const supabase = await createClient()
  const { data: current, error: listError } = await supabase.from("works").select("id, sort")
  if (listError) return { error: listError.message }

  const currentIds = new Set((current ?? []).map((row) => row.id))
  if (currentIds.size !== ids.length || ids.some((id) => !currentIds.has(id))) {
    return { error: "作品清單已更新，請重新整理後再排序" }
  }

  const previousSort = new Map((current ?? []).map((row) => [row.id, row.sort]))
  for (const [index, id] of ids.entries()) {
    const { error } = await supabase
      .from("works")
      .update({ sort: index + 1 })
      .eq("id", id)

    if (error) {
      // 最佳努力回復原順序，避免只寫入一半造成前台順序難以理解。
      await Promise.all(
        ids.map((workId) =>
          supabase
            .from("works")
            .update({ sort: previousSort.get(workId) ?? 100 })
            .eq("id", workId)
        )
      )
      return { error: error.message }
    }
  }

  revalidatePath("/studio/works")
  revalidatePath("/portfolio")
  revalidatePath("/services/[slug]", "page")
  return {}
}
