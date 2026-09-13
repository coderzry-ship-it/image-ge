<script setup>
import { ref, watch } from 'vue'
import { ElDialog, ElInput, ElButton, ElMessage } from 'element-plus'
import { MagicStick } from '@element-plus/icons-vue'
import { useDeepSeek } from '../composables/useDeepSeek'

const props = defineProps({
  modelValue: Boolean,
  label: String,
  prompt: String,
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const { optimizePrompt } = useDeepSeek()
const editText = ref('')
const optimizing = ref(false)

watch(() => props.prompt, (val) => {
  editText.value = val || ''
}, { immediate: true })

function handleConfirm() {
  if (!editText.value.trim()) {
    ElMessage.warning('提示词不能为空')
    return
  }
  emit('confirm', editText.value.trim())
  emit('update:modelValue', false)
}

async function handleOptimize() {
  if (!editText.value.trim()) {
    ElMessage.warning('提示词为空，无法优化')
    return
  }
  optimizing.value = true
  try {
    const result = await optimizePrompt(editText.value)
    editText.value = result
    ElMessage.success('AI 优化完成，请检查后保存')
  } catch (err) {
    ElMessage.error('优化失败：' + (err.response?.data?.error?.message || err.message))
  } finally {
    optimizing.value = false
  }
}
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :title="'✏️ 编辑提示词 — ' + label"
    width="680px"
    destroy-on-close
  >
    <ElInput
      v-model="editText"
      type="textarea"
      :autosize="{ minRows: 10, maxRows: 20 }"
      placeholder="输入提示词..."
      :disabled="optimizing"
    />
    <template #footer>
      <div style="display: flex; justify-content: space-between; width: 100%">
        <ElButton
          :icon="MagicStick"
          :loading="optimizing"
          @click="handleOptimize"
          type="warning"
          plain
        >
          {{ optimizing ? 'AI 优化中...' : '🤖 AI 优化提示词' }}
        </ElButton>
        <div style="display: flex; gap: 8px">
          <ElButton @click="emit('update:modelValue', false)">取消</ElButton>
          <ElButton type="primary" @click="handleConfirm" :disabled="optimizing">保存并重新生成</ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>
