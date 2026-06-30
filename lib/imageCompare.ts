import pixelmatch from 'pixelmatch'
import JSZip from 'jszip'

// Tải 1 ảnh từ URL về dạng có thể đọc pixel
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous' // cho phep canvas doc pixel anh tu domain khac
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Không tải được ảnh: ' + url))
    img.src = url
  })
}

// Vẽ ảnh lên canvas với kích thước cố định -> lấy pixel data
function getImageData(img: HTMLImageElement, w: number, h: number): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h) // resize ve cung kich thuoc
  return ctx.getImageData(0, 0, w, h)
}

export interface CompareResult {
  diffPercent: number      // % pixel khac biet
  diffDataUrl: string      // anh diff (vung khac to do) dang base64 de hien
}

// So sánh 2 ảnh -> ra % khác + ảnh diff
export async function compareImages(urlA: string, urlB: string): Promise<CompareResult> {
  const [imgA, imgB] = await Promise.all([loadImage(urlA), loadImage(urlB)])

  // pixelmatch bat buoc 2 anh cung kich thuoc -> resize ve cung 1 size
  const w = 800
  const h = 1200
  const dataA = getImageData(imgA, w, h)
  const dataB = getImageData(imgB, w, h)

  // canvas chua anh diff
  const diffCanvas = document.createElement('canvas')
  diffCanvas.width = w
  diffCanvas.height = h
  const diffCtx = diffCanvas.getContext('2d')!
  const diffData = diffCtx.createImageData(w, h)

  // so sanh tung pixel; tra ve so pixel khac
  const numDiff = pixelmatch(dataA.data, dataB.data, diffData.data, w, h, { threshold: 0.1 })

  diffCtx.putImageData(diffData, 0, 0)

  return {
    diffPercent: Math.round((numDiff / (w * h)) * 100 * 100) / 100, // lam tron 2 so le
    diffDataUrl: diffCanvas.toDataURL()
  }
}

// Kiem tra file co phai anh khong (theo duoi)
function isImageName(name: string): boolean {
  return /\.(png|jpe?g|webp)$/i.test(name)
}

// Giai nen 1 zip tu URL -> tra ve danh sach { ten, dataUrl } cua cac anh, sort theo ten
async function extractImagesFromZip(zipUrl: string): Promise<{ name: string; dataUrl: string }[]> {
  const res = await fetch(zipUrl)
  const blob = await res.blob()
  const zip = await JSZip.loadAsync(blob)

  const entries = Object.values(zip.files)
    .filter(f => !f.dir && isImageName(f.name))
    .sort((a, b) => a.name.localeCompare(b.name)) // sap xep theo ten de "thu tu" on dinh

  const images: { name: string; dataUrl: string }[] = []
  for (const entry of entries) {
    const base64 = await entry.async('base64')
    const ext = entry.name.split('.').pop()?.toLowerCase()
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
    images.push({ name: entry.name, dataUrl: `data:${mime};base64,${base64}` })
  }
  return images
}

// Ket qua so sanh cho TUNG trang
export interface PageCompareResult {
  index: number
  nameA?: string
  nameB?: string
  status: 'changed' | 'same' | 'added' | 'removed' // them moi / da xoa / giong / khac
  diffPercent?: number
  diffDataUrl?: string
}

// So sanh 2 zip -> ket qua tung trang (ghep theo THU TU) + % khac trung binh
export async function compareZips(zipUrlOld: string, zipUrlNew: string): Promise<{
  pages: PageCompareResult[]
  avgDiffPercent: number
}> {
  const [imagesOld, imagesNew] = await Promise.all([
    extractImagesFromZip(zipUrlOld),
    extractImagesFromZip(zipUrlNew),
  ])

  const maxLen = Math.max(imagesOld.length, imagesNew.length)
  const pages: PageCompareResult[] = []
  let sumDiff = 0
  let comparedCount = 0

  for (let i = 0; i < maxLen; i++) {
    const oldImg = imagesOld[i]
    const newImg = imagesNew[i]

    if (oldImg && !newImg) {
      pages.push({ index: i, nameA: oldImg.name, status: 'removed' }) // trang da xoa
    } else if (!oldImg && newImg) {
      pages.push({ index: i, nameB: newImg.name, status: 'added' })   // trang moi them
    } else if (oldImg && newImg) {
      const result = await compareImages(oldImg.dataUrl, newImg.dataUrl)
      sumDiff += result.diffPercent
      comparedCount++
      pages.push({
        index: i,
        nameA: oldImg.name,
        nameB: newImg.name,
        status: result.diffPercent > 0 ? 'changed' : 'same',
        diffPercent: result.diffPercent,
        diffDataUrl: result.diffDataUrl,
      })
    }
  }

  return {
    pages,
    avgDiffPercent: comparedCount > 0 ? Math.round((sumDiff / comparedCount) * 100) / 100 : 0,
  }
}
export async function compareAny(urlA: string, urlB: string): Promise<{
  isZip: boolean
  diffPercent: number
  diffDataUrl?: string
  pages?: PageCompareResult[]
}> {
  const isZip = (u: string) => /\.zip(\?|$)/i.test(u)
  if (isZip(urlA) || isZip(urlB)) {
    const r = await compareZips(urlA, urlB)
    return { isZip: true, diffPercent: r.avgDiffPercent, pages: r.pages }
  }
  const r = await compareImages(urlA, urlB)
  return { isZip: false, diffPercent: r.diffPercent, diffDataUrl: r.diffDataUrl }
}