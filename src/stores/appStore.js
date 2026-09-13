import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'imageGenConfig'

function loadConfig() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch { return {} }
}

function saveConfig(cfg) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
}

export const useAppStore = defineStore('app', () => {
  const saved = loadConfig()

  // Config
  const dsKey = ref(saved.dsKey || '')
  const dsModel = ref(saved.dsModel || 'deepseek-v4-pro')
  const oaiKey = ref(saved.oaiKey || '')
  const imageModel = ref(saved.imageModel || 'gpt-image-2-1k')
  const watermarkEnabled = ref(saved.watermarkEnabled ?? true)
  const watermarkText = ref(saved.watermarkText || '原创作者：@图解万物')
  const isDark = ref(saved.isDark ?? false)

  // Input
  const title = ref('')
  const rawContent = ref('')
  const perImage = ref(3)
  const genCover = ref(false)

  // Options
  const autoGenerate = ref(true)

  // Steps
  const currentStep = ref(1)

  // Prompts
  const prompts = ref([])

  // Results
  const results = ref([])

  const watermark = computed(() =>
    watermarkEnabled.value ? watermarkText.value : ''
  )

  const doneCount = computed(() =>
    results.value.filter(r => r.status === 'done').length
  )

  function persistConfig() {
    saveConfig({
      dsKey: dsKey.value,
      dsModel: dsModel.value,
      oaiKey: oaiKey.value,
      imageModel: imageModel.value,
      watermarkEnabled: watermarkEnabled.value,
      watermarkText: watermarkText.value,
      isDark: isDark.value,
    })
  }

  function initResults() {
    results.value = prompts.value.map((p, i) => ({
      index: i,
      label: p.label,
      type: p.type,
      prompt: p.prompt,
      status: 'pending',
      url: null,
      error: null,
    }))
  }

  return {
    dsKey, dsModel, oaiKey, imageModel,
    watermarkEnabled, watermarkText, isDark,
    title, rawContent, perImage, genCover, autoGenerate,
    currentStep, prompts, results, watermark,
    doneCount, persistConfig, initResults,
  }
})
