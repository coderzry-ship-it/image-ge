<script setup>
import { ref } from 'vue'
import {
  ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption,
  ElButton, ElMessage, ElDivider,
} from 'element-plus'
import { useAppStore } from '../stores/appStore'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const store = useAppStore()

function close() {
  emit('update:modelValue', false)
}

function handleSave() {
  store.persistConfig()
  ElMessage.success('配置已保存')
  close()
}
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    title="⚙️ 全局配置"
    width="520px"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <ElForm label-position="top">
      <ElDivider content-position="left">🤖 DeepSeek（提示词生成）</ElDivider>
      <ElFormItem label="API Key">
        <ElInput v-model="store.dsKey" type="password" show-password placeholder="sk-..." />
      </ElFormItem>
      <ElFormItem label="模型">
        <ElSelect v-model="store.dsModel" style="width: 100%">
          <ElOption value="deepseek-v4-pro" label="deepseek-v4-pro" />
          <ElOption value="deepseek-flash" label="deepseek-flash（更快）" />
        </ElSelect>
      </ElFormItem>

      <ElDivider content-position="left">🎨 OAIREGBOX（图片生成）</ElDivider>
      <ElFormItem label="API Key">
        <ElInput v-model="store.oaiKey" type="password" show-password placeholder="sk-..." />
      </ElFormItem>

      <ElDivider content-position="left">🔗 内容提取</ElDivider>
      <ElFormItem label="解析 Token">
        <ElInput v-model="store.extractToken" type="password" show-password placeholder="apicx.asia Token" />
      </ElFormItem>
      <p style="font-size: 12px; color: var(--text-muted); margin-top: -8px">
        <a href="https://apicx.asia/auth/login" target="_blank" style="color: var(--el-color-primary)">点击注册获取 Token</a>
      </p>
    </ElForm>

    <template #footer>
      <ElButton @click="close">取消</ElButton>
      <ElButton type="primary" @click="handleSave">💾 保存配置</ElButton>
    </template>
  </ElDialog>
</template>
