import axios from 'axios'
import JSZip from 'jszip'
import { useAppStore } from '../stores/appStore'
import { base64ToFile, tryShareFiles } from '../utils/mobile'

export function useImageGen() {
  const store = useAppStore()
  const logs = []
  let logCallback = null

  function onLog(cb) { logCallback = cb }
  function log(msg) { logs.push(msg); logCallback?.(msg) }

  async function generateOne(idx) {
    const r = store.results[idx]
    r.status = 'running'
    r.url = null
    r.error = null
    log(`📤 [${r.label}] 发送生图请求...`)

    try {
      const resp = await axios.post(
        'https://newapi-2.oairegbox.cc/v1/images/generations',
        {
          model: store.imageModel,
          prompt: r.prompt,
          n: 1,
          size: store.imageSize,
          response_format: 'b64_json',
        },
        { headers: { Authorization: `Bearer ${store.oaiKey}` } }
      )

      const item = resp.data.data?.[0] || {}
      const imageUrl = item.b64_json
        ? `data:image/png;base64,${item.b64_json}`
        : item.url || ''
      if (!imageUrl) throw new Error('返回数据中没有图片')

      r.status = 'done'
      r.url = imageUrl
      log(`✅ [${r.label}] 生成成功`)
    } catch (err) {
      r.status = 'error'
      r.error = err.response?.data?.error?.message || err.message
      log(`❌ [${r.label}] 失败: ${r.error}`)
    }
  }

  async function generateAll() {
    const pending = store.results
      .filter(r => r.status === 'pending')
      .map(r => r.index)

    log(`🚀 开始生图，总计 ${pending.length} 张，全部并发发送...`)
    await Promise.all(pending.map(idx => generateOne(idx)))
    log('🎉 全部完成！')
  }

  async function retryOne(idx) {
    store.results[idx].status = 'pending'
    await generateOne(idx)
  }

  async function retryAllFailed() {
    store.results.forEach(r => {
      if (r.status === 'error') r.status = 'pending'
    })
    await generateAll()
  }

  function downloadOne(idx) {
    const r = store.results[idx]
    if (!r?.url) return
    const filename = (idx + 1) + '.png'
    const a = document.createElement('a')

    if (r.url.startsWith('data:')) {
      a.href = r.url
      a.download = filename
      a.click()
    } else {
      window.open(r.url, '_blank')
    }
  }

  async function downloadAllZip(progressCb) {
    const done = store.results.filter(r => r.status === 'done' && r.url)
    if (!done.length) throw new Error('没有可下载的图片')

    const zip = new JSZip()
    for (let i = 0; i < done.length; i++) {
      const r = done[i]
      const filename = (i + 1) + '.png'
      progressCb?.(`打包 ${i + 1}/${done.length}`)

      if (r.url.startsWith('data:')) {
        zip.file(filename, r.url.split(',')[1], { base64: true })
      }
    }

    progressCb?.('生成 ZIP...')
    const blob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = (store.title || '批量生图') + '.zip'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function shareOne(idx) {
    const r = store.results[idx]
    if (!r?.url) return false
    try {
      const file = await base64ToFile(r.url, (idx + 1) + '.png')
      return await tryShareFiles([file])
    } catch {
      return false
    }
  }

  async function shareAll() {
    const done = store.results.filter(r => r.status === 'done' && r.url)
    if (!done.length) throw new Error('没有可分享的图片')
    const files = []
    for (let i = 0; i < done.length; i++) {
      const r = done[i]
      const file = await base64ToFile(r.url, (i + 1) + '.png')
      files.push(file)
    }
    return await tryShareFiles(files)
  }

  return {
    generateOne, generateAll, retryOne, retryAllFailed,
    downloadOne, downloadAllZip, shareOne, shareAll, onLog, logs,
  }
}
