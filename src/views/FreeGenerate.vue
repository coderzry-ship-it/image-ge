<script setup>
import { ref } from 'vue'
import axios from 'axios'
import {
  ElForm, ElFormItem, ElInput, ElSelect, ElOption,
  ElButton, ElCard, ElMessage, ElRow, ElCol,
  ElImageViewer, ElTooltip,
} from 'element-plus'
import { MagicStick, Download, Cellphone, Picture } from '@element-plus/icons-vue'
import { useAppStore } from '../stores/appStore'
import { isMobile, tryShareFiles, base64ToFile } from '../utils/mobile'
import ExtractDialog from '../components/ExtractDialog.vue'

const store = useAppStore()
const mobile = isMobile()

const prompt = ref('')
const imageModel = ref(store.imageModel)
const imageSize = ref(store.imageSize)
const loading = ref(false)
const resultUrl = ref('')
const errorMsg = ref('')

// Image preview
const extractVisible = ref(false)
const viewerVisible = ref(false)

async function handleGenerate() {
  if (!store.oaiKey) return ElMessage.warning('请填写 OAIREGBOX API Key')
  if (!prompt.value.trim()) return ElMessage.warning('请输入提示词')

  loading.value = true
  resultUrl.value = ''
  errorMsg.value = ''

  try {
    const resp = await axios.post(
      'https://newapi-2.oairegbox.cc/v1/images/generations',
      {
        model: imageModel.value,
        prompt: prompt.value.trim(),
        n: 1,
        size: imageSize.value,
        response_format: 'b64_json',
      },
      { headers: { Authorization: `Bearer ${store.oaiKey}` } }
    )

    const item = resp.data.data?.[0] || {}
    const url = item.b64_json
      ? `data:image/png;base64,${item.b64_json}`
      : item.url || ''
    if (!url) throw new Error('返回数据中没有图片')

    resultUrl.value = url
    ElMessage.success('生成成功')
  } catch (err) {
    errorMsg.value = err.response?.data?.error?.message || err.message
    ElMessage.error('生成失败：' + errorMsg.value)
  } finally {
    loading.value = false
  }
}

function handleDownload() {
  if (!resultUrl.value) return
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = 'image.png'
  a.click()
}

async function handleSave() {
  if (!resultUrl.value) return
  try {
    const file = await base64ToFile(resultUrl.value, 'image.png')
    const shared = await tryShareFiles([file])
    if (!shared) {
      ElMessage.info('请长按图片保存到相册')
    }
  } catch {
    ElMessage.info('请长按图片保存到相册')
  }
}

function handleExtractFill({ field, value }) {
  if (field === 'content') prompt.value = value
}
</script>

<template>
  <div>
    <div class="card">
      <div class="section-title" style="display: flex; align-items: center; justify-content: space-between">
        <span>🎨 自由生图</span>
        <ElButton size="small" type="primary" text @click="extractVisible = true">🔗 内容提取</ElButton>
      </div>
      <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px">
        输入提示词，选择模型和尺寸，一键生图。
      </p>

      <ElForm label-position="top">
        <ElRow :gutter="16">
          <ElCol :xs="24" :sm="12" :md="8">
            <ElFormItem label="OAIREGBOX API Key">
              <ElInput v-model="store.oaiKey" type="password" show-password placeholder="sk-..." />
            </ElFormItem>
          </ElCol>
          <ElCol :xs="24" :sm="12" :md="8">
            <ElFormItem label="生图模型">
              <ElSelect v-model="imageModel" style="width: 100%">
                <ElOption value="gpt-image-2" label="gpt-image-2" />
                <ElOption value="gpt-image-2-2k" label="gpt-image-2-2k" />
                <ElOption value="gpt-image-2-4k" label="gpt-image-2-4k" />
                <ElOption value="gemini-image" label="gemini-image" />
                <ElOption value="gemini-image-pro" label="gemini-image-pro" />
                <ElOption value="gemini-3.1-flash-image-4k" label="gemini-3.1-flash-image-4k" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :xs="24" :sm="12" :md="8">
            <ElFormItem label="图片尺寸">
              <ElSelect v-model="imageSize" filterable allow-create default-first-option style="width: 100%" placeholder="选择或输入尺寸">
                <ElOption value="2880x3840" label="3:4 竖屏（gpt）" />
                <ElOption value="3:4" label="3:4 竖屏（gemini）" />
                <ElOption value="2160x3840" label="9:16 竖屏（gpt）" />
                <ElOption value="9:16" label="9:16 竖屏（gemini）" />
                <ElOption value="1:1" label="1:1 方形" />
                <ElOption value="16:9" label="16:9 横屏" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
        </ElRow>

        <ElFormItem label="提示词">
          <ElInput
            v-model="prompt"
            type="textarea"
            :autosize="{ minRows: 4, maxRows: 12 }"
            placeholder="描述你想生成的图片，如：一只戴墨镜的柴犬在海滩上冲浪..."
          />
        </ElFormItem>

        <ElButton
          type="primary"
          :icon="MagicStick"
          size="large"
          :loading="loading"
          @click="handleGenerate"
        >
          {{ loading ? '生成中...' : '🚀 生成图片' }}
        </ElButton>
      </ElForm>
    </div>

    <div v-if="resultUrl || errorMsg" class="card" style="margin-top: 20px">
      <div class="section-title">🖼️ 生成结果</div>

      <div v-if="errorMsg" style="color: var(--el-color-danger); margin-bottom: 12px">
        ❌ {{ errorMsg }}
      </div>

      <div v-if="resultUrl" class="free-result">
        <div class="free-image-wrap">
          <img
            :src="resultUrl"
            alt="生成结果"
            class="free-preview-img"
            @click="viewerVisible = true"
            style="cursor: zoom-in;"
          />
        </div>
        <div class="free-actions">
          <ElTooltip content="下载图片">
            <ElButton :icon="Download" circle @click="handleDownload" />
          </ElTooltip>
          <ElTooltip v-if="mobile" content="保存到相册">
            <ElButton :icon="Cellphone" circle type="success" @click="handleSave" />
          </ElTooltip>
        </div>
      </div>

      <ElImageViewer
        v-if="viewerVisible"
        :url-list="[resultUrl]"
        :z-index="3000"
        @close="viewerVisible = false"
      />
    </div>
  
    <ExtractDialog v-model="extractVisible" @fill="handleExtractFill" />
</div>
</template>

<style lang="scss" scoped>
.free-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.free-image-wrap {
  max-width: 600px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
}
.free-preview-img {
  width: 100%;
  display: block;
}
.free-actions {
  display: flex;
  gap: 12px;
}
@media (max-width: 768px) {
  .free-image-wrap {
    max-width: 100%;
  }
}
</style>
