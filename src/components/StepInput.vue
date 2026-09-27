<script setup>
import { watch } from 'vue'
import {
  ElForm, ElFormItem, ElInput, ElSelect, ElOption,
  ElButton, ElSwitch, ElMessage, ElRow, ElCol,
} from 'element-plus'
import { MagicStick } from '@element-plus/icons-vue'
import { useAppStore } from '../stores/appStore'
import { useDeepSeek } from '../composables/useDeepSeek'
import { ref } from 'vue'
import ExtractDialog from './ExtractDialog.vue'

const store = useAppStore()
const { generatePrompts, createAbortController, cancelGeneration } = useDeepSeek()
const loading = ref(false)
const logText = ref('')
const extractVisible = ref(false)

watch(
  () => [store.dsKey, store.dsModel, store.oaiKey, store.imageModel,
         store.watermarkEnabled, store.watermarkText, store.isDark, store.imageSize, store.showIndex, store.textAlign],
  () => store.persistConfig(),
  { deep: true }
)

async function handleGenerate() {
  if (!store.dsKey) return ElMessage.warning('请填写 DeepSeek API Key')
  if (!store.title.trim()) return ElMessage.warning('请填写主题标题')
  if (!store.rawContent.trim()) return ElMessage.warning('请填写素材内容')

  loading.value = true
  logText.value = ''
  createAbortController()

  try {
    logText.value += '📤 正在调用 DeepSeek 生成提示词...\n'
    const result = await generatePrompts()
    logText.value += `✅ 共生成 ${result.length} 张提示词\n🎉 完成！`
    store.prompts = result
    if (store.autoGenerate) {
      store.initResults()
      store.currentStep = 3
    } else {
      store.currentStep = 2
    }
  } catch (err) {
    if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') {
      logText.value += '⏹️ 已停止生成\n'
      ElMessage.info('已停止生成')
    } else {
      logText.value += `❌ 错误: ${err.response?.data?.error?.message || err.message}\n`
      ElMessage.error('生成失败，请查看日志')
    }
  } finally {
    loading.value = false
  }
}
function handleStop() {
  cancelGeneration()
  loading.value = false
}

function handleExtractFill({ field, value }) {
  if (field === 'title') store.title = value
  else if (field === 'content') store.rawContent = value
}
</script>

<template>
  <div class="card">
    <div class="section-title" style="display: flex; align-items: center; justify-content: space-between">
        <span>📝 素材输入</span>
        <ElButton size="small" type="primary" text @click="extractVisible = true">🔗 内容提取</ElButton>
      </div>

    <ElForm label-position="top">
      <ElRow :gutter="16">
        <ElCol :xs="24" :sm="12" :md="6">
          <ElFormItem label="DeepSeek API Key">
            <ElInput v-model="store.dsKey" type="password" show-password placeholder="sk-..." />
          </ElFormItem>
        </ElCol>
        <ElCol :xs="24" :sm="12" :md="6">
          <ElFormItem label="DeepSeek 模型">
            <ElSelect v-model="store.dsModel" style="width: 100%">
              <ElOption value="deepseek-v4-pro" label="deepseek-v4-pro" />
              <ElOption value="deepseek-flash" label="deepseek-flash（更快）" />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :xs="24" :sm="12" :md="6">
          <ElFormItem label="OAIREGBOX API Key">
            <ElInput v-model="store.oaiKey" type="password" show-password placeholder="sk-..." />
          </ElFormItem>
        </ElCol>
        <ElCol :xs="24" :sm="12" :md="6">
          <ElFormItem label="生图模型">
            <ElSelect v-model="store.imageModel" style="width: 100%">
              <ElOption value="gpt-image-2" label="gpt-image-2" />
              <ElOption value="gpt-image-2-2k" label="gpt-image-2-2k" />
              <ElOption value="gpt-image-2-4k" label="gpt-image-2-4k" />
              <ElOption value="gemini-image" label="gemini-image" />
              <ElOption value="gemini-image-pro" label="gemini-image-pro" />
              <ElOption value="gemini-3.1-flash-image-4k" label="gemini-3.1-flash-image-4k" />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :xs="24" :sm="12" :md="6">
          <ElFormItem label="图片尺寸">
            <ElSelect v-model="store.imageSize" filterable allow-create default-first-option style="width: 100%" placeholder="选择或输入尺寸">
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

      <ElFormItem label="主题标题">
        <ElInput v-model="store.title" placeholder="例如：千万不能犯的人生大忌有哪些" />
      </ElFormItem>

      <ElFormItem label="素材内容（每条一行，支持 &quot;1、xxx&quot; 格式）">
        <ElInput
          v-model="store.rawContent"
          type="textarea"
          :autosize="{ minRows: 8, maxRows: 20 }"
          placeholder="1、热闹不要去看，是非不要去管…&#10;2、千万不要断别人的财路…"
        />
      </ElFormItem>

      <ElRow :gutter="16">
        <ElCol :xs="12" :sm="6" :md="6">
          <ElFormItem label="每张图几个格子">
            <ElSelect v-model="store.perImage" style="width: 100%">
              <ElOption :value="2" label="2 个格子/张" />
              <ElOption :value="3" label="3 个格子/张" />
              <ElOption :value="4" label="4 个格子/张" />
              <ElOption :value="5" label="5 个格子/张" />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :xs="6" :sm="4" :md="4">
          <ElFormItem label="生成封面">
            <ElSwitch v-model="store.genCover" />
          </ElFormItem>
        </ElCol>
        <ElCol :xs="6" :sm="4" :md="4">
          <ElFormItem label="右下角水印">
            <ElSwitch v-model="store.watermarkEnabled" />
          </ElFormItem>
        </ElCol>
        <ElCol :xs="6" :sm="4" :md="4">
          <ElFormItem label="自动出图">
            <ElSwitch v-model="store.autoGenerate" />
          </ElFormItem>
        </ElCol>
        <ElCol :xs="6" :sm="4" :md="4">
          <ElFormItem label="生成序号">
            <ElSwitch v-model="store.showIndex" />
          </ElFormItem>
        </ElCol>
        <ElCol :xs="12" :sm="6" :md="6">
          <ElFormItem label="水印内容">
            <ElInput
              v-model="store.watermarkText"
              :disabled="!store.watermarkEnabled"
              placeholder="原创作者：@你的名字"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :xs="12" :sm="6" :md="6">
          <ElFormItem label="文字对齐">
            <ElSelect v-model="store.textAlign" style="width: 100%">
              <ElOption value="left" label="左对齐" />
              <ElOption value="center" label="居中对齐" />
            </ElSelect>
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElFormItem label="补充要求（可选）">
        <ElInput
          v-model="store.extraRequirement"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 5 }"
          placeholder="可以输入额外要求，如：画面风格偏暗黑、人物穿古装等..."
        />
      </ElFormItem>

      <ElButton
        v-if="!loading"
        type="primary"
        :icon="MagicStick"
        size="large"
        @click="handleGenerate"
      >
        🤖 生成提示词
      </ElButton>
      <ElButton
        v-else
        type="danger"
        size="large"
        @click="handleStop"
      >
        ⏹️ 停止生成
      </ElButton>
    </ElForm>

    <div v-if="logText" class="log-panel">{{ logText }}</div>

    <ExtractDialog v-model="extractVisible" @fill="handleExtractFill" />
  </div>
</template>
