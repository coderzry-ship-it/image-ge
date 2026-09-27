<script setup>
import { watch, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElSwitch, ElMenu, ElMenuItem, ElButton, ElDrawer, ElDivider,
} from 'element-plus'
import { Sunny, Moon, Setting, Menu as MenuIcon } from '@element-plus/icons-vue'
import SettingsDialog from './components/SettingsDialog.vue'
import { useAppStore } from './stores/appStore'

const store = useAppStore()
const route = useRoute()
const router = useRouter()

const settingsVisible = ref(false)
const drawerVisible = ref(false)

const activeMenu = computed(() => route.name || 'batch')

function handleMenuSelect(name) {
  router.push({ name })
  drawerVisible.value = false
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

const navItems = [
  { name: 'batch', label: '📦 分格漫画批量生成' },
  { name: 'single', label: '📖 单张漫画批量生成' },
  { name: 'story', label: '📚 故事漫画一键生成' },
  { name: 'free', label: '🎨 自由生图' },
]
</script>

<template>
  <div class="app-container">
    <div class="app-header">
      <div class="header-left">
        <h1>🎨 图解万物创作台</h1>
        <p class="header-subtitle">批量生图 & 自由创作</p>
      </div>
      <div class="header-right">
        <!-- PC nav -->
        <ElMenu
          :default-active="activeMenu"
          mode="horizontal"
          :ellipsis="false"
          class="nav-menu desktop-only"
          @select="handleMenuSelect"
        >
          <ElMenuItem v-for="item in navItems" :key="item.name" :index="item.name">
            {{ item.label }}
          </ElMenuItem>
        </ElMenu>
        <ElButton :icon="Setting" circle size="small" class="desktop-only" @click="settingsVisible = true" title="全局配置" />
        <div class="theme-switch desktop-only">
          <el-icon><Sunny /></el-icon>
          <ElSwitch v-model="store.isDark" inline-prompt style="margin: 0 6px" />
          <el-icon><Moon /></el-icon>
        </div>

        <!-- Mobile hamburger -->
        <ElButton :icon="MenuIcon" circle class="mobile-only" @click="drawerVisible = true" />
      </div>
    </div>

    <router-view />

    <!-- Mobile drawer -->
    <ElDrawer
      v-model="drawerVisible"
      direction="ltr"
      size="70%"
      :with-header="false"
      class="mobile-drawer"
    >
      <div class="drawer-content">
        <div class="drawer-title">🎨 图解万物创作台</div>
        <ElDivider style="margin: 12px 0" />
        <div class="drawer-nav">
          <div
            v-for="item in navItems"
            :key="item.name"
            class="drawer-nav-item"
            :class="{ active: activeMenu === item.name }"
            @click="handleMenuSelect(item.name)"
          >
            {{ item.label }}
          </div>
        </div>
        <ElDivider style="margin: 16px 0" />
        <div class="drawer-actions">
          <ElButton :icon="Setting" style="width: 100%" @click="settingsVisible = true; drawerVisible = false">
            ⚙️ 全局配置
          </ElButton>
          <div class="theme-switch" style="justify-content: center; margin-top: 16px">
            <el-icon><Sunny /></el-icon>
            <ElSwitch v-model="store.isDark" inline-prompt style="margin: 0 6px" />
            <el-icon><Moon /></el-icon>
          </div>
        </div>
      </div>
    </ElDrawer>

    <SettingsDialog v-model="settingsVisible" />
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

/* Mobile drawer */
.drawer-content {
  padding: 20px 16px;
}
.drawer-title {
  font-size: 20px;
  font-weight: 700;
}
.drawer-nav-item {
  padding: 14px 16px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  &:hover, &.active {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }
  &.active {
    font-weight: 700;
  }
}

/* Responsive visibility */
.desktop-only {
  display: flex;
}
.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none !important;
  }
  .mobile-only {
    display: flex !important;
  }
  .app-header {
    flex-direction: row !important;
    align-items: center !important;
    gap: 0 !important;
  }
  .header-subtitle {
    display: none;
  }
  .header-left h1 {
    font-size: 18px !important;
  }
}
</style>
