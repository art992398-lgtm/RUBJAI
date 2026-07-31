// Receipt handling WITHOUT Firebase Storage (free / Spark plan).
// Compress image on the client to a small JPEG data URL, stored in Firestore.

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Compress an image file to a JPEG data URL.
 * Firestore doc limit is ~1MB, so we cap dimension + quality and reject
 * anything still too large after compression.
 */
export async function fileToCompressedDataUrl(
  file: File,
  maxDim = 1000,
  quality = 0.7
): Promise<string> {
  const raw = await readAsDataUrl(file);
  const img = await loadImage(raw);

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas not supported");
  ctx.drawImage(img, 0, 0, w, h);

  let out = canvas.toDataURL("image/jpeg", quality);
  // if still large, drop quality once more
  if (out.length * 0.75 > 700_000) {
    out = canvas.toDataURL("image/jpeg", 0.5);
  }
  if (out.length * 0.75 > 900_000) {
    throw new Error("รูปใหญ่เกินไป ลองใช้รูปที่เล็กลง");
  }
  return out;
}
