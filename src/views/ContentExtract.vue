<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'
import {
  ElForm, ElFormItem, ElInput, ElButton, ElMessage,
  ElCard, ElRow, ElCol, ElImage, ElImageViewer, ElTag,
  ElDivider, ElTooltip, ElAlert,
} from 'element-plus'
import { Search, CopyDocument, Download, Picture, Setting } from '@element-plus/icons-vue'
import { useAppStore } from '../stores/appStore'

const store = useAppStore()

const API_URL = 'https://apicx.asia/api/video_parse_api'

const inputUrl = ref('')
const loading = ref(false)
const result = ref(null)
const rawResponse = ref(null)
const ocrLoading = ref(false)
const ocrText = ref('')
const showTokenInput = ref(!store.extractToken)

// Image preview
const viewerVisible = ref(false)
const viewerUrls = ref([])
const viewerIndex = ref(0)

function extractUrl(text) {
  const match = text.match(/https?:\/\/[^\s\u200b\u200c\u200d\ufeff]+/i)
  return match ? match[0] : text.trim()
}

function parseApiResponse(data) {
  const parsed = data?.parsed_data?.data || data?.data || {}
  const res = {
    title: parsed.title || parsed.name || '',
    content: parsed.content || parsed.desc || parsed.description || '',
    platform: parsed.platform || data?.parsed_data?.platform || '',
    cover: parsed.cover || '',
    videoUrl: parsed.url || '',
    type: parsed.type || '',
    images: [],
  }

  // Handle image list
  if (parsed.imageUrl && Array.isArray(parsed.imageUrl)) {
    res.images = parsed.imageUrl
  } else if (parsed.images && Array.isArray(parsed.images)) {
    res.images = parsed.images
  } else if (parsed.image_list && Array.isArray(parsed.image_list)) {
    res.images = parsed.image_list.map(img => typeof img === 'string' ? img : img.url || img.url_list?.[0] || '')
      .filter(Boolean)
  }

  // If no images but has cover, use cover
  if (!res.images.length && res.cover) {
    res.images = [res.cover]
  }

  return res
}

async function handleExtract() {
  if (!inputUrl.value.trim()) return ElMessage.warning('请粘贴作品链接')
  if (!store.extractToken) return ElMessage.warning('请先填写解析 Token')

  loading.value = true
  result.value = null
  rawResponse.value = null
  ocrText.value = ''

  try {
    const url = extractUrl(inputUrl.value)
    if (!url) return ElMessage.warning('未检测到有效链接')

    const resp = await axios.get(API_URL, {
      params: { url },
      headers: {
        Authorization: store.extractToken,
      },
    })

    rawResponse.value = resp.data

    if (resp.data?.code === 200 || resp.data?.success) {
      result.value = parseApiResponse(resp.data)
      if (!result.value.title && !result.value.content && !result.value.images.length) {
        ElMessage.warning('未提取到内容，可能链接格式不对或平台暂不支持')
      } else {
        ElMessage.success('提取成功')
      }
    } else {
      const msg = resp.data?.msg || resp.data?.message || '解析失败'
      ElMessage.error('提取失败：' + msg)
    }
  } catch (err) {
    const msg = err.response?.data?.msg || err.response?.data?.message || err.message
    ElMessage.error('提取失败：' + msg)
  } finally {
    loading.value = false
  }
}

function saveToken() {
  store.persistConfig()
  showTokenInput.value = false
  ElMessage.success('Token 已保存')
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  })
}

function handlePreview(images, idx) {
  viewerUrls.value = images
  viewerIndex.value = idx
  viewerVisible.value = true
}

async function handleOCR() {
  if (!store.dsKey) return ElMessage.warning('请先在批量生图页面填写 DeepSeek API Key')
  if (!result.value?.images?.length) return ElMessage.warning('没有可识别的图片')

  ocrLoading.value = true
  ocrText.value = ''

  try {
    const client = axios.create({
      baseURL: 'https://api.deepseek.com',
      headers: { Authorization: `Bearer ${store.dsKey}` },
    })

    const imageContents = result.value.images.map((url, i) => ({
      type: 'image_url',
      image_url: { url },
    }))

    const resp = await client.post('/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: [
            ...imageContents,
            {
              type: 'text',
              text: `以上共 ${result.value.images.length} 张图片，请依次识别每张图片中的所有文字内容，按原文排版输出。格式如下：\n\n【图片1】\n（该图文字内容）\n\n【图片2】\n（该图文字内容）\n\n如果某张图片中没有文字，对应位置输出"（无文字）"。不要添加任何额外解释。`,
            },
          ],
        },
      ],
      temperature: 0,
    })

    const fullText = resp.data.choices?.[0]?.message?.content?.trim() || ''

    ocrText.value = fullText

    ElMessage.success('图片文字识别完成')
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message
    ElMessage.error('OCR 失败：' + msg)
  } finally {
    ocrLoading.value = false
  }
}

function copyAllContent() {
  let text = ''
  if (result.value?.title) text += result.value.title + '\n\n'
  if (result.value?.content) text += result.value.content + '\n\n'
  if (ocrText.value) {
    text += '--- 图片文字 ---\n' + ocrText.value + '\n'
  }
  copyText(text.trim())
}

function downloadImage(url, index) {
  const a = document.createElement('a')
  a.href = url
  a.download = `image_${index + 1}.jpg`
  a.target = '_blank'
  a.click()
}

const hasContent = computed(() => {
  return result.value && (result.value.title || result.value.content || result.value.images?.length)
})
</script>

<template>
  <div>
    <div class="card">
      <div class="section-title">🔗 内容提取</div>
      <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px">
        粘贴小红书、抖音、快手、B站等平台作品链接，自动提取标题、文案和图片。支持 20+ 平台。
      </p>

      <!-- Token config -->
      <div v-if="showTokenInput || !store.extractToken" class="token-config">
        <ElAlert type="info" :closable="false" style="margin-bottom: 12px">
          <template #title>
            首次使用需填写解析 Token，
            <a href="https://apicx.asia/auth/login" target="_blank" style="color: var(--el-color-primary)">点击注册获取</a>
          </template>
        </ElAlert>
        <ElFormItem label="解析 Token">
          <div style="display: flex; gap: 8px; width: 100%">
            <ElInput
              v-model="store.extractToken"
              placeholder="填写 apicx.asia 的 Token"
              show-password
              style="flex: 1"
            />
            <ElButton type="primary" @click="saveToken">保存</ElButton>
          </div>
        </ElFormItem>
      </div>
      <div v-else style="margin-bottom: 12px">
        <ElButton text size="small" :icon="Setting" @click="showTokenInput = true">
          修改 Token
        </ElButton>
      </div>

      <ElForm label-position="top" @submit.prevent="handleExtract">
        <ElFormItem label="作品链接">
          <ElInput
            v-model="inputUrl"
            placeholder="粘贴小红书、抖音、快手、B站等平台分享链接..."
            size="large"
            clearable
            @keyup.enter="handleExtract"
          >
            <template #append>
              <ElButton :icon="Search" :loading="loading" @click="handleExtract">
                {{ loading ? '提取中...' : '提取内容' }}
              </ElButton>
            </template>
          </ElInput>
        </ElFormItem>
      </ElForm>
    </div>

    <div v-if="result && hasContent" class="card" style="margin-top: 20px">
      <div class="section-title">
        📋 提取结果
        <ElTag v-if="result.platform" type="success" size="small" style="margin-left: 8px">
          {{ result.platform }}
        </ElTag>
        <ElTag v-if="result.type" type="info" size="small" style="margin-left: 4px">
          {{ result.type === 'video' ? '视频' : result.type === 'image' ? '图片' : result.type }}
        </ElTag>
      </div>

      <!-- Title -->
      <div v-if="result.title" class="extract-section">
        <div class="extract-label">
          标题
          <ElTooltip content="复制标题">
            <ElButton :icon="CopyDocument" size="small" text @click="copyText(result.title)" />
          </ElTooltip>
        </div>
        <div class="extract-content title-text">{{ result.title }}</div>
      </div>

      <!-- Content -->
      <div v-if="result.content" class="extract-section">
        <div class="extract-label">
          文案
          <ElTooltip content="复制文案">
            <ElButton :icon="CopyDocument" size="small" text @click="copyText(result.content)" />
          </ElTooltip>
        </div>
        <div class="extract-content">{{ result.content }}</div>
      </div>

      <!-- Cover -->
      <div v-if="result.cover && !result.images.includes(result.cover)" class="extract-section">
        <div class="extract-label">封面</div>
        <div class="thumb-wrap" style="width: 200px" @click="handlePreview([result.cover], 0)">
          <ElImage :src="result.cover" fit="cover" class="thumb-img" loading="lazy" />
        </div>
      </div>

      <!-- Video -->
      <div v-if="result.videoUrl && result.type === 'video'" class="extract-section">
        <div class="extract-label">
          视频
          <ElTooltip content="复制视频链接">
            <ElButton :icon="CopyDocument" size="small" text @click="copyText(result.videoUrl)" />
          </ElTooltip>
          <a :href="result.videoUrl" target="_blank" style="font-size: 12px; margin-left: 8px">
            🔗 打开视频
          </a>
        </div>
        <video
          :src="result.videoUrl"
          controls
          preload="metadata"
          style="max-width: 100%; max-height: 400px; border-radius: 8px"
        />
      </div>

      <!-- Images -->
      <div v-if="result.images?.length" class="extract-section">
        <div class="extract-label">
          图片（{{ result.images.length }} 张）
          <ElButton
            :icon="Picture"
            size="small"
            type="primary"
            text
            :loading="ocrLoading"
            @click="handleOCR"
          >
            🔍 识别图片文字
          </ElButton>
        </div>
        <div class="image-grid-small">
          <div
            v-for="(img, i) in result.images"
            :key="i"
            class="thumb-wrap"
            @click="handlePreview(result.images, i)"
          >
            <ElImage :src="img" fit="cover" class="thumb-img" loading="lazy" />
          </div>
        </div>
      </div>

      <!-- OCR results -->
      <div v-if="ocrText" class="extract-section">
        <ElDivider />
        <div class="extract-label">
          📝 图片文字识别结果
          <ElTooltip content="复制识别结果">
            <ElButton
              :icon="CopyDocument"
              size="small"
              text
              @click="copyText(ocrText)"
            />
          </ElTooltip>
        </div>
        <ElInput
          v-model="ocrText"
          type="textarea"
          :autosize="{ minRows: 4, maxRows: 20 }"
          style="width: 100%"
        />
      </div>

      <ElDivider />
      <div style="display: flex; gap: 10px">
        <ElButton :icon="CopyDocument" @click="copyAllContent">一键复制全部内容</ElButton>
      </div>

      <ElImageViewer
        v-if="viewerVisible"
        :url-list="viewerUrls"
        :initial-index="viewerIndex"
        :z-index="3000"
        @close="viewerVisible = false"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.token-config {
  margin-bottom: 16px;
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}
.extract-section {
  margin-bottom: 20px;
}
.extract-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.extract-content {
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-all;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}
.title-text {
  font-size: 16px;
  font-weight: 600;
}
.image-grid-small {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}
.thumb-wrap {
  aspect-ratio: 1;
  border-radius: 8px;
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
@media (max-width: 768px) {
  .image-grid-small {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
}
</style>
