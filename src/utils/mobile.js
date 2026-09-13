export function isMobile() {
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (window.innerWidth <= 768)
}

export async function base64ToFile(dataUrl, filename) {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  return new File([blob], filename, { type: blob.type || 'image/png' })
}

export function canShare() {
  return !!navigator.share && !!navigator.canShare
}

export async function tryShareFiles(files) {
  if (navigator.canShare && navigator.canShare({ files })) {
    await navigator.share({ files })
    return true
  }
  return false
}
