<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElButton, ElProgress, ElMessage } from 'element-plus'
import { Refresh, Download, ArrowLeft } from '@element-plus/icons-vue'
import { useAppStore } from '../stores/appStore'
import { useImageGen } from '../composables/useImageGen'
import ImageCard from './ImageCard.vue'
import EditPromptModal from './EditPromptModal.vue'

const store = useAppStore()
const imageGen = useImageGen()
const logText = ref('')
const downloading = ref(false)
const downloadText = ref('')

// Edit modal
const editVisible = ref(false)
const editIdx = ref(-1)
const editLabel = ref('')
const editPrompt = ref('')

const progress = computed(() =>
  store.results.length ? Math.round((store.doneCount / store.results.length) * 100) : 0
)

imageGen.onLog((msg) => {
  logText.value += msg + '\n'
})

onMounted(() => {
  const hasPending = store.results.some(r => r.status === 'pending')
  if (hasPending) imageGen.generateAll()
})

function handleRetry(idx) {
  imageGen.retryOne(idx)
}

function handleEdit(idx) {
  const r = store.results[idx]
  editIdx.value = idx
  editLabel.value = r.label
  editPrompt.value = r.prompt
  editVisible.value = true
}

async function handleEditConfirm(newPrompt) {
  const idx = editIdx.value
  store.results[idx].prompt = newPrompt
  if (store.prompts[idx]) store.prompts[idx].prompt = newPrompt
  await imageGen.retryOne(idx)
}

function handleDownload(idx) {
  imageGen.downloadOne(idx)
}

async function handleDownloadAll() {
  downloading.value = true
  try {
    await imageGen.downloadAllZip((msg) => { downloadText.value = msg })
    ElMessage.success('ZIP 下载完成')
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    downloading.value = false
    downloadText.value = ''
  }
}

function handleRetryAll() {
  imageGen.retryAllFailed()
}
</script>

<template>
  <div class="card">
    <div class="section-title">🖼️ 生图进度</div>

    <div class="progress-bar">
      <div class="progress-info">
        <span>{{ store.doneCount }} / {{ store.results.length }}</span>
        <ElButton
          :icon="Download"
          size="small"
          :loading="downloading"
          @click="handleDownloadAll"
        >
          {{ downloadText || '📦 一键下载' }}
        </ElButton>
      </div>
      <ElProgress :percentage="progress" :stroke-width="8" :show-text="false" />
    </div>

    <div class="toolbar">
      <ElButton :icon="Refresh" size="small" @click="handleRetryAll">重试所有失败</ElButton>
      <ElButton :icon="ArrowLeft" size="small" @click="store.currentStep = 2">返回编辑提示词</ElButton>
    </div>

    <div class="image-grid">
      <ImageCard
        v-for="r in store.results"
        :key="r.index"
        :result="r"
        @retry="handleRetry(r.index)"
        @edit="handleEdit(r.index)"
        @download="handleDownload(r.index)"
      />
    </div>

    <div v-if="logText" class="log-panel">{{ logText }}</div>

    <EditPromptModal
      v-model="editVisible"
      :label="editLabel"
      :prompt="editPrompt"
      @confirm="handleEditConfirm"
    />
  </div>
</template>

<style lang="scss" scoped>
.progress-bar {
  margin-bottom: 16px;
}
.progress-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
}
.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}
</style>
