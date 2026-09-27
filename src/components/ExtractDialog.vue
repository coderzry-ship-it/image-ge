<script setup>
import { ref } from 'vue'
import axios from 'axios'
import {
  ElDialog, ElForm, ElFormItem, ElInput, ElButton, ElMessage,
  ElImage, ElImageViewer, ElTag, ElDivider, ElTooltip, ElAlert,
} from 'element-plus'
import { Search, CopyDocument, Picture } from '@element-plus/icons-vue'
import { useAppStore } from '../stores/appStore'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'fill'])

const store = useAppStore()
const API_VIDEO = 'https://apicx.asia/api/video_parse_api'
const API_XHS = 'https://apicx.asia/api/xhs'

const inputUrl = ref('')
const loading = ref(false)
const result = ref(null)
const ocrLoading = ref(false)
const ocrText = ref('')
const viewerVisible = ref(false)
const viewerUrls = ref([])
const viewerIndex = ref(0)

function close() {
  emit('update:modelValue', false)
}

function extractUrl(text) {
  const match = text.match(/https?:\/\/[^\s\u200b\u200c\u200d\ufeff]+/i)
  return match ? match[0] : text.trim()
}

function parseApiResponse(respData) {
  // API structure: { code, message, data: { type, title, desc, author, cover, images, url, ... } }
  const d = respData?.data || {}
  const res = {
    title: d.title || '',
    content: d.desc || d.description || d.content || '',
    platform: d.type || d.name || '',
    cover: d.cover || '',
    videoUrl: d.url || '',
    type: d.type || '',
    author: d.author?.name || '',
    images: [],
  }
  if (d.images && Array.isArray(d.images)) {
    res.images = d.images
  } else if (d.imageUrl && Array.isArray(d.imageUrl)) {
    res.images = d.imageUrl
  }
  if (!res.images.length && res.cover) {
    res.images = [res.cover]
  }
  return res
}

function isXhsLink(text) {
  return /xiaohongshu\.com|xhslink\.com|小红书/i.test(text)
}

function parseXhsResponse(respData) {
  const d = respData?.data || {}
  const note = d.note_info || {}
  return {
    title: note.title || '',
    content: note.desc || note.content || '',
    platform: '小红书',
    cover: '',
    videoUrl: '',
    type: 'xhs',
    author: note.author || note.nickname || '',
    images: Array.isArray(d.images) ? d.images.map(url => {
      // Clean up XHS CDN URLs - remove HTML artifacts if any
      return url.replace(/<[^>]*>/g, '').replace(/\s+/g, '').split('?imageView2')[0] + '?imageView2/format/jpeg'
    }) : [],
  }
}

async function handleExtract() {
  if (!inputUrl.value.trim()) return ElMessage.warning('请粘贴作品链接')
  if (!store.extractToken) return ElMessage.warning('请先填写解析 Token')

  loading.value = true
  result.value = null
  ocrText.value = ''

  try {
    const rawInput = inputUrl.value.trim()
    const url = extractUrl(rawInput)
    const isXhs = isXhsLink(rawInput)

    const apiUrl = isXhs ? API_XHS : API_VIDEO
    const resp = await axios.get(apiUrl, {
      params: {
        url: url || rawInput,
        token: store.extractToken,
      },
      headers: { Authorization: store.extractToken },
    })

    if (resp.data?.code === 200) {
      result.value = isXhs ? parseXhsResponse(resp.data) : parseApiResponse(resp.data)
      if (!result.value.title && !result.value.content && !result.value.images.length) {
        ElMessage.warning('未提取到内容，可能链接格式不对或平台暂不支持')
      } else {
        ElMessage.success('提取成功')
      }
    } else {
      ElMessage.error('提取失败：' + (resp.data?.msg || resp.data?.message || '解析失败'))
    }
  } catch (err) {
    ElMessage.error('提取失败：' + (err.response?.data?.msg || err.message))
  } finally {
    loading.value = false
  }
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => ElMessage.success('已复制'))
}

function handlePreview(images, idx) {
  viewerUrls.value = images
  viewerIndex.value = idx
  viewerVisible.value = true
}

async function handleOCR() {
  if (!store.dsKey) return ElMessage.warning('请先填写 DeepSeek API Key')
  if (!result.value?.images?.length) return ElMessage.warning('没有可识别的图片')

  ocrLoading.value = true
  ocrText.value = ''

  try {
    const client = axios.create({
      baseURL: 'https://api.deepseek.com',
      headers: { Authorization: `Bearer ${store.dsKey}` },
    })

    const imageContents = result.value.images.map(url => ({
      type: 'image_url',
      image_url: { url },
    }))

    const resp = await client.post('/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [{
        role: 'user',
        content: [
          ...imageContents,
          {
            type: 'text',
            text: `以上共 ${result.value.images.length} 张图片，请依次识别每张图片中的所有文字内容，按原文排版输出，图片之间用空行分隔。不要添加任何标记、编号或额外解释，只输出图中原文。`,
          },
        ],
      }],
      temperature: 0,
    })

    ocrText.value = resp.data.choices?.[0]?.message?.content?.trim() || ''
    ElMessage.success('图片文字识别完成')
  } catch (err) {
    ElMessage.error('OCR 失败：' + (err.response?.data?.error?.message || err.message))
  } finally {
    ocrLoading.value = false
  }
}

function removeImage(index) {
  result.value.images.splice(index, 1)
}

function handleFillTitle() {
  if (!result.value?.title) return
  emit('fill', { field: 'title', value: result.value.title })
  ElMessage.success('已填充标题')
}

function handleFillContent() {
  const text = result.value?.content || ''
  emit('fill', { field: 'content', value: text })
  ElMessage.success('已填充文案')
}

function handleFillOCR() {
  if (!ocrText.value) return
  emit('fill', { field: 'content', value: ocrText.value })
  ElMessage.success('已填充识别文字')
}

function handleFillAll() {
  let text = ''
  if (result.value?.content) text += result.value.content
  if (ocrText.value) {
    if (text) text += '\n\n'
    text += ocrText.value
  }
  if (result.value?.title) {
    emit('fill', { field: 'title', value: result.value.title })
  }
  if (text) {
    emit('fill', { field: 'content', value: text })
  }
  ElMessage.success('已填充到输入框')
  close()
}
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    title="🔗 内容提取"
    width="720px"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px">
      粘贴小红书、抖音、快手、B站等平台作品链接，自动提取标题、文案和图片文字，一键填充到输入框。
    </p>

    <!-- URL Input -->
    <ElInput
      v-model="inputUrl"
      placeholder="粘贴作品分享链接..."
      size="large"
      clearable
      @keyup.enter="handleExtract"
    >
      <template #append>
        <ElButton :icon="Search" :loading="loading" @click="handleExtract">
          {{ loading ? '提取中...' : '提取' }}
        </ElButton>
      </template>
    </ElInput>

    <!-- Results -->
    <div v-if="result" style="margin-top: 20px">
      <ElDivider>
        <span>提取结果</span>
        <ElTag v-if="result.platform" type="success" size="small" style="margin-left: 8px">{{ result.platform }}</ElTag>
      </ElDivider>

      <!-- Title -->
      <div v-if="result.title" class="extract-section">
        <div class="extract-label">
          标题
          <ElButton size="small" text @click="copyText(result.title)">复制</ElButton>
          <ElButton size="small" type="primary" text @click="handleFillTitle">填充到标题</ElButton>
        </div>
        <div class="extract-content title-text">{{ result.title }}</div>
      </div>

      <!-- Content -->
      <div v-if="result.content" class="extract-section">
        <div class="extract-label">
          文案
          <ElButton size="small" text @click="copyText(result.content)">复制</ElButton>
          <ElButton size="small" type="primary" text @click="handleFillContent">填充到内容</ElButton>
        </div>
        <div class="extract-content">{{ result.content }}</div>
      </div>

      <!-- Cover -->
      <div v-if="result.cover && !result.images.includes(result.cover)" class="extract-section">
        <div class="extract-label">封面</div>
        <div class="thumb-wrap" style="width: 120px" @click="handlePreview([result.cover], 0)">
          <ElImage :src="result.cover" fit="cover" class="thumb-img" loading="lazy" />
        </div>
      </div>

      <!-- Video -->
      <div v-if="result.videoUrl && result.type === 'video'" class="extract-section">
        <div class="extract-label">
          视频
          <ElButton size="small" text @click="copyText(result.videoUrl)">复制链接</ElButton>
        </div>
        <video :src="result.videoUrl" controls preload="metadata" style="max-width: 100%; max-height: 300px; border-radius: 8px" />
      </div>

      <!-- Images -->
      <div v-if="result.images?.length" class="extract-section">
        <div class="extract-label">
          图片（{{ result.images.length }} 张）
          <ElButton size="small" type="primary" text :loading="ocrLoading" @click="handleOCR">🔍 识别图片文字</ElButton>
        </div>
        <div class="image-grid-small">
          <div v-for="(img, i) in result.images" :key="i" class="thumb-wrap">
            <ElImage :src="img" fit="cover" class="thumb-img" loading="lazy" @click="handlePreview(result.images, i)" />
            <span class="thumb-delete" @click.stop="removeImage(i)" title="删除">✕</span>
          </div>
        </div>
      </div>

      <!-- OCR -->
      <div v-if="ocrText" class="extract-section">
        <ElDivider />
        <div class="extract-label">
          📝 图片文字识别结果
          <ElButton size="small" text @click="copyText(ocrText)">复制</ElButton>
          <ElButton size="small" type="primary" text @click="handleFillOCR">填充到内容</ElButton>
        </div>
        <ElInput v-model="ocrText" type="textarea" :autosize="{ minRows: 3, maxRows: 12 }" />
      </div>
    </div>

    <ElImageViewer
      v-if="viewerVisible"
      :url-list="viewerUrls"
      :initial-index="viewerIndex"
      :z-index="5000"
      @close="viewerVisible = false"
    />

    <template #footer>
      <ElButton @click="close">关闭</ElButton>
      <ElButton
        v-if="result"
        type="primary"
        @click="handleFillAll"
      >
        ✅ 一键填充全部
      </ElButton>
    </template>
  </ElDialog>
</template>

<style lang="scss" scoped>
.extract-section {
  margin-bottom: 16px;
}
.extract-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.extract-content {
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-all;
  padding: 10px 14px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
}
.title-text {
  font-size: 15px;
  font-weight: 600;
}
.image-grid-small {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}
.thumb-wrap {
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  cursor: zoom-in;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s;
  &:hover { transform: translateY(-2px); }
}
.thumb-img {
  width: 100%;
  height: 100%;
}
.thumb-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 1;
}
.thumb-wrap {
  position: relative;
}
.thumb-wrap:hover .thumb-delete {
  opacity: 1;
}
</style>
