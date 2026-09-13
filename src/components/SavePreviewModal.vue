<script setup>
import { ElDialog } from 'element-plus'

defineProps({
  modelValue: Boolean,
  imageUrl: String,
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title=""
    fullscreen
    :show-close="true"
    class="save-preview-dialog"
  >
    <div class="save-preview">
      <div class="save-hint">💡 长按图片保存到相册</div>
      <img v-if="imageUrl" :src="imageUrl" class="save-preview-img" />
    </div>
  </ElDialog>
</template>

<style lang="scss" scoped>
.save-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 16px;
}
.save-hint {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-color-primary);
  margin-bottom: 16px;
  padding: 8px 20px;
  background: var(--el-color-primary-light-9);
  border-radius: 20px;
}
.save-preview-img {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  -webkit-touch-callout: default !important;
}
</style>
