<script setup>
import { watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElSwitch, ElMenu, ElMenuItem } from 'element-plus'
import { Sunny, Moon } from '@element-plus/icons-vue'
import { useAppStore } from './stores/appStore'

const store = useAppStore()
const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => route.name || 'batch')

function handleMenuSelect(name) {
  router.push({ name })
}

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
        <h1>🎨 图解万物创作台</h1>
        <p>批量生图 & 自由创作</p>
      </div>
      <div class="header-right">
        <ElMenu
          :default-active="activeMenu"
          mode="horizontal"
          :ellipsis="false"
          class="nav-menu"
          @select="handleMenuSelect"
        >
          <ElMenuItem index="batch">📦 分格漫画批量生成</ElMenuItem>
          <ElMenuItem index="single">📖 单张漫画批量生成</ElMenuItem>
          <ElMenuItem index="story">📚 故事漫画一键生成</ElMenuItem>
          <ElMenuItem index="free">🎨 自由生图</ElMenuItem>
        </ElMenu>
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
    </div>

    <router-view />
  </div>
</template>

<style lang="scss" scoped>
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.theme-switch {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 18px;
}
.nav-menu {
  border-bottom: none !important;
  background: transparent !important;
  :deep(.el-menu-item) {
    font-size: 14px;
    font-weight: 600;
    border-bottom: 2px solid transparent;
    &.is-active {
      border-bottom-color: var(--el-color-primary);
    }
  }
}
@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 12px;
  }
  .header-right {
    width: 100%;
    justify-content: space-between;
  }
  .nav-menu {
    :deep(.el-menu-item) {
      font-size: 13px;
      padding: 0 12px;
    }
  }
}
</style>
