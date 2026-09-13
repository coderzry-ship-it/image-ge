<script setup>
import { ElCard, ElTag, ElButton, ElTooltip } from 'element-plus'
import { Refresh, Edit, Download, Picture, Cellphone } from '@element-plus/icons-vue'
import { isMobile } from '../utils/mobile'

defineProps({
  result: Object,
})

const emit = defineEmits(['retry', 'edit', 'download', 'save'])
const mobile = isMobile()
</script>

<template>
  <ElCard class="image-card" shadow="hover" :body-style="{ padding: 0 }">
    <div class="img-wrap">
      <!-- Overlay -->
      <div v-if="result.status !== 'done'" class="overlay">
        <div v-if="result.status === 'running'" class="overlay-content">
          <el-icon class="spin"><Refresh /></el-icon>
          <span>生成中...</span>
        </div>
        <div v-else-if="result.status === 'error'" class="overlay-content error-content">
          <span>❌ {{ result.error || '生成失败' }}</span>
        </div>
        <div v-else class="overlay-content">
          <span>⏳ 等待中</span>
        </div>
      </div>
      <!-- Image -->
      <img v-if="result.url" :src="result.url" :alt="result.label" class="preview-img" />
      <div v-else class="placeholder">
        <el-icon :size="48" color="#ddd"><Picture /></el-icon>
      </div>
    </div>

    <div class="card-footer">
      <div class="card-label">
        <span>{{ result.type === 'cover' ? '🖼️' : '📄' }} {{ result.label }}</span>
        <ElTag
          :type="result.status === 'done' ? 'success' : result.status === 'error' ? 'danger' : result.status === 'running' ? '' : 'info'"
          size="small"
          effect="light"
        >
          {{ result.status === 'done' ? '完成' : result.status === 'error' ? '失败' : result.status === 'running' ? '生成中' : '等待' }}
        </ElTag>
      </div>
      <div class="card-actions">
        <ElTooltip content="重新生成">
          <ElButton :icon="Refresh" circle size="small" @click="emit('retry')" />
        </ElTooltip>
        <ElTooltip content="编辑提示词">
          <ElButton :icon="Edit" circle size="small" @click="emit('edit')" />
        </ElTooltip>
        <ElTooltip v-if="result.url" content="下载">
          <ElButton :icon="Download" circle size="small" @click="emit('download')" />
        </ElTooltip>
        <ElTooltip v-if="result.url && mobile" content="保存到相册">
          <ElButton :icon="Cellphone" circle size="small" type="success" @click="emit('save')" />
        </ElTooltip>
      </div>
    </div>
  </ElCard>
</template>

<style lang="scss" scoped>
.image-card {
  overflow: hidden;
  transition: transform 0.2s;
  &:hover { transform: translateY(-2px); }
}
.img-wrap {
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: var(--el-fill-color-lighter);
}
.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.85);
  z-index: 1;

  :root.dark & {
    background: rgba(0, 0, 0, 0.7);
  }
}
.overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  padding: 16px;
  text-align: center;
}
.error-content {
  color: var(--el-color-danger);
  font-size: 12px;
  word-break: break-all;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.card-footer {
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  min-width: 0;
  span:first-child {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
.card-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
@media (max-width: 768px) {
  .card-footer {
    padding: 10px 10px;
    flex-wrap: wrap;
    gap: 6px;
  }
  .card-label {
    font-size: 12px;
  }
}
</style>
