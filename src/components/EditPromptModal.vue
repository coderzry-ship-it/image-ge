<script setup>
import { ref, watch } from 'vue'
import { ElDialog, ElInput, ElButton, ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: Boolean,
  label: String,
  prompt: String,
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const editText = ref('')

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
    />
    <template #footer>
      <ElButton @click="emit('update:modelValue', false)">取消</ElButton>
      <ElButton type="primary" @click="handleConfirm">保存并重新生成</ElButton>
    </template>
  </ElDialog>
</template>
