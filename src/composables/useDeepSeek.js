import axios from 'axios'
import { useAppStore } from '../stores/appStore'
import {
  CONTENT_SYSTEM_PROMPT,
  COVER_SYSTEM_PROMPT,
  buildContentUserPrompt,
  buildCoverUserPrompt,
  parseItems,
} from '../utils/promptTemplate'

const OPTIMIZE_SYSTEM_PROMPT = `你是一个 AI 绘画提示词优化专家。用户会给你一段已有的生图提示词，这段提示词在生成图片时因为内容审核被拒绝了。

你的任务是：
1. 分析提示词中可能触发内容审核的部分（如暴力、血腥、色情、歧视、敏感政治等描述）
2. 用安全、温和但含义相近的表达替换这些内容
3. 保持提示词的整体风格、结构、格式完全不变
4. 只替换可能违规的部分，其他内容一字不改

直接返回优化后的完整提示词文本，不要加任何解释、标注或 JSON 包裹。`

export function useDeepSeek() {
  const store = useAppStore()

  async function generatePrompts() {
    const items = parseItems(store.rawContent)
    if (!items.length) throw new Error('未解析到有效素材')

    const client = axios.create({
      baseURL: 'https://api.deepseek.com',
      headers: { Authorization: `Bearer ${store.dsKey}` },
    })

    const contentUserPrompt = buildContentUserPrompt(
      store.title, items, store.perImage, store.watermark
    )

    const contentResp = await client.post('/v1/chat/completions', {
      model: store.dsModel,
      messages: [
        { role: 'system', content: CONTENT_SYSTEM_PROMPT },
        { role: 'user', content: contentUserPrompt },
      ],
      temperature: 0.7,
    })

    let contentText = contentResp.data.choices?.[0]?.message?.content || ''
    contentText = contentText.replace(/\`\`\`json\s*/g, '').replace(/\`\`\`/g, '').trim()

    let contentArr
    try {
      contentArr = JSON.parse(contentText)
    } catch {
      const match = contentText.match(/\[[\s\S]*\]/)
      if (match) contentArr = JSON.parse(match[0])
      else throw new Error('无法解析 DeepSeek 返回的提示词 JSON')
    }

    const prompts = contentArr.map((item, i) => ({
      index: i + 1,
      label: `内容图 ${item.items || i + 1}`,
      prompt: item.prompt,
      type: 'content',
    }))

    if (store.genCover) {
      const coverUserPrompt = buildCoverUserPrompt(
        store.title, items, store.watermark
      )
      const coverResp = await client.post('/v1/chat/completions', {
        model: store.dsModel,
        messages: [
          { role: 'system', content: COVER_SYSTEM_PROMPT },
          { role: 'user', content: coverUserPrompt },
        ],
        temperature: 0.7,
      })

      let coverText = coverResp.data.choices?.[0]?.message?.content || ''
      coverText = coverText.replace(/\`\`\`json\s*/g, '').replace(/\`\`\`/g, '').trim()

      let coverObj
      try {
        coverObj = JSON.parse(coverText)
      } catch {
        const match = coverText.match(/\{[\s\S]*\}/)
        if (match) coverObj = JSON.parse(match[0])
        else throw new Error('无法解析封面提示词 JSON')
      }

      prompts.push({
        index: prompts.length + 1,
        label: '封面图',
        prompt: coverObj.prompt,
        type: 'cover',
      })
    }

    return prompts
  }

  async function optimizePrompt(originalPrompt) {
    if (!store.dsKey) throw new Error('请先填写 DeepSeek API Key')

    const client = axios.create({
      baseURL: 'https://api.deepseek.com',
      headers: { Authorization: `Bearer ${store.dsKey}` },
    })

    const resp = await client.post('/v1/chat/completions', {
      model: store.dsModel,
      messages: [
        { role: 'system', content: OPTIMIZE_SYSTEM_PROMPT },
        { role: 'user', content: `以下提示词在生图时被内容审核拒绝，请优化它使其通过审核：\n\n${originalPrompt}` },
      ],
      temperature: 0.7,
    })

    const optimized = resp.data.choices?.[0]?.message?.content?.trim()
    if (!optimized) throw new Error('DeepSeek 未返回优化结果')
    return optimized
  }

  return { generatePrompts, optimizePrompt }
}
