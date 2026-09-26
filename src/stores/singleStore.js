import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAppStore } from './appStore'

export const useSingleStore = defineStore('single', () => {
  const app = useAppStore()

  // Delegate config to appStore (shared)
  const dsKey = computed({ get: () => app.dsKey, set: v => { app.dsKey = v } })
  const dsModel = computed({ get: () => app.dsModel, set: v => { app.dsModel = v } })
  const oaiKey = computed({ get: () => app.oaiKey, set: v => { app.oaiKey = v } })
  const imageModel = computed({ get: () => app.imageModel, set: v => { app.imageModel = v } })
  const imageSize = computed({ get: () => app.imageSize, set: v => { app.imageSize = v } })
  const watermarkEnabled = computed({ get: () => app.watermarkEnabled, set: v => { app.watermarkEnabled = v } })
  const watermarkText = computed({ get: () => app.watermarkText, set: v => { app.watermarkText = v } })
  const showIndex = computed({ get: () => app.showIndex, set: v => { app.showIndex = v } })
  const textAlign = computed({ get: () => app.textAlign, set: v => { app.textAlign = v } })
  const isDark = computed({ get: () => app.isDark, set: v => { app.isDark = v } })
  const watermark = computed(() => app.watermark)

  const persistConfig = () => app.persistConfig()

  // Independent workflow state
  const title = ref('')
  const rawContent = ref('')
  const perImage = ref(3)
  const genCover = ref(false)
  const extraRequirement = ref('')
  const autoGenerate = ref(true)
  const currentStep = ref(1)
  const prompts = ref([])
  const results = ref([])

  const doneCount = computed(() =>
    results.value.filter(r => r.status === 'done').length
  )

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
    watermarkEnabled, watermarkText, isDark, imageSize, showIndex, textAlign,
    title, rawContent, perImage, genCover, autoGenerate, extraRequirement,
    currentStep, prompts, results, watermark,
    doneCount, persistConfig, initResults,
  }
})
