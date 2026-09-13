<script setup>
import { ref } from 'vue'
import { ElButton, ElInput, ElMessage, ElCard } from 'element-plus'
import { CopyDocument, Picture, ArrowLeft } from '@element-plus/icons-vue'
import { useAppStore } from '../stores/appStore'

const store = useAppStore()

function copyPrompt(idx) {
  navigator.clipboard.writeText(store.prompts[idx].prompt).then(() => {
    ElMessage.success('已复制到剪贴板')
  })
}

function updatePrompt(idx, val) {
  store.prompts[idx].prompt = val
}
</script>

<template>
  <div class="card">
    <div class="section-title">📋 提示词预览 & 编辑</div>
    <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px">
      可以直接修改提示词文本，然后点击"一键生图"进入下一步。
    </p>

    <div class="prompt-list">
      <ElCard
        v-for="(p, i) in store.prompts"
        :key="i"
        shadow="never"
        class="prompt-card"
      >
        <template #header>
          <div class="prompt-header">
            <span>{{ p.type === 'cover' ? '🖼️ ' : '📄 ' }}{{ p.label }}</span>
            <ElButton :icon="CopyDocument" size="small" text @click="copyPrompt(i)">复制</ElButton>
          </div>
        </template>
        <ElInput
          type="textarea"
          :model-value="p.prompt"
          @update:model-value="updatePrompt(i, $event)"
          :autosize="{ minRows: 4, maxRows: 12 }"
        />
      </ElCard>
    </div>

    <div style="margin-top: 20px; display: flex; gap: 12px">
      <ElButton :icon="ArrowLeft" @click="store.currentStep = 1">返回修改素材</ElButton>
      <ElButton type="primary" :icon="Picture" @click="store.initResults(); store.currentStep = 3">
        🚀 一键生图
      </ElButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.prompt-card {
  :deep(.el-card__header) {
    padding: 12px 16px;
  }
}
.prompt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 14px;
}
</style>
