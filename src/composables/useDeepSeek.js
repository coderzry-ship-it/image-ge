import axios from 'axios'
import { useAppStore } from '../stores/appStore'
import {
  CONTENT_SYSTEM_PROMPT,
  COVER_SYSTEM_PROMPT,
  buildContentUserPrompt,
  buildCoverUserPrompt,
  parseItems,
} from '../utils/promptTemplate'

export function useDeepSeek() {
  const store = useAppStore()

  async function generatePrompts() {
    const items = parseItems(store.rawContent)
    if (!items.length) throw new Error('未解析到有效素材')

    const client = axios.create({
      baseURL: 'https://api.deepseek.com',
      headers: { Authorization: `Bearer ${store.dsKey}` },
    })

    // Content prompts
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
    contentText = contentText.replace(/```json\s*/g, '').replace(/```/g, '').trim()

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

    // Cover prompt
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
      coverText = coverText.replace(/```json\s*/g, '').replace(/```/g, '').trim()

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

  return { generatePrompts }
}
