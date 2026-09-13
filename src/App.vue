<script setup>
import { watch } from 'vue'
import { ElSteps, ElStep, ElSwitch } from 'element-plus'
import { Sunny, Moon } from '@element-plus/icons-vue'
import { useAppStore } from './stores/appStore'
import StepInput from './components/StepInput.vue'
import StepPrompts from './components/StepPrompts.vue'
import StepGenerate from './components/StepGenerate.vue'

const store = useAppStore()

// Apply dark mode
function applyTheme(dark) {
  document.documentElement.classList.toggle('dark', dark)
}
applyTheme(store.isDark)

watch(() => store.isDark, (val) => {
  applyTheme(val)
  store.persistConfig()
})
</script>

<template>
  <div class="app-container">
    <div class="app-header">
      <div class="header-left">
        <h1>🎨 AI 批量生图工具</h1>
        <p>一站式：输入素材 → AI 生成提示词 → 并发生图</p>
      </div>
      <div class="theme-switch">
        <el-icon><Sunny /></el-icon>
        <ElSwitch
          v-model="store.isDark"
          inline-prompt
          style="margin: 0 6px"
        />
        <el-icon><Moon /></el-icon>
      </div>
    </div>

    <ElSteps :active="store.currentStep - 1" finish-status="success" align-center style="margin-bottom: 28px">
      <ElStep title="输入素材" @click.native="store.currentStep = 1" style="cursor:pointer" />
      <ElStep title="生成提示词" @click.native="store.prompts.length && (store.currentStep = 2)" style="cursor:pointer" />
      <ElStep title="批量生图" @click.native="store.results.length && (store.currentStep = 3)" style="cursor:pointer" />
    </ElSteps>

    <StepInput v-if="store.currentStep === 1" />
    <StepPrompts v-else-if="store.currentStep === 2" />
    <StepGenerate v-else-if="store.currentStep === 3" />
  </div>
</template>

<style lang="scss" scoped>
.theme-switch {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 18px;
}
</style>
