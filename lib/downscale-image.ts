// 上傳前在瀏覽器端把圖片縮小，避免有人再把上萬 px 的原圖丟進來（那會讓前台跑馬燈爆卡）。
// 作法：讀進圖片 → 若最長邊超過 maxDim 就等比例縮到 maxDim → 輸出 webp（支援透明、檔案更小）。
// SVG／GIF 不動（向量圖與動圖不適合這樣處理）。任何失敗都退回原檔，確保上傳不會被卡住。
export async function downscaleImage(file: File, maxDim = 800, quality = 0.85): Promise<File> {
  try {
    if (!file.type.startsWith("image/")) return file
    if (file.type === "image/svg+xml" || file.type === "image/gif") return file

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader()
      fr.onload = () => resolve(fr.result as string)
      fr.onerror = reject
      fr.readAsDataURL(file)
    })

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new window.Image()
      im.onload = () => resolve(im)
      im.onerror = reject
      im.src = dataUrl
    })

    const { width, height } = img
    if (!width || !height) return file
    if (Math.max(width, height) <= maxDim) return file // 已經夠小，不動

    const scale = maxDim / Math.max(width, height)
    const w = Math.round(width * scale)
    const h = Math.round(height * scale)

    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return file
    ctx.drawImage(img, 0, 0, w, h)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    )
    if (!blob) return file

    const newName = file.name.replace(/\.[^.]+$/, "") + ".webp"
    return new File([blob], newName, { type: "image/webp" })
  } catch {
    return file // 縮圖失敗就用原檔，不擋上傳
  }
}
