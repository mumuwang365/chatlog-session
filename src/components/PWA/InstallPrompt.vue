<script setup lang="ts">
import { usePWAStore } from '@/stores/pwa'
import { Download, Close } from '@element-plus/icons-vue'

const pwaStore = usePWAStore()

const install = async () => {
  await pwaStore.promptInstall()
}

const dismiss = () => {
  pwaStore.isInstallable = false // Manually hide it for this session
}
</script>

<template>
  <transition name="slide-up">
    <div v-if="pwaStore.canInstall" class="pwa-install-prompt">
      <div class="content">
        <div class="icon">
          <img src="/logo.svg" alt="App Logo" />
        </div>
        <div class="info">
          <h3>安装 Chatlog Session</h3>
          <p>像原生应用一样使用，支持离线访问</p>
        </div>
      </div>
      <div class="actions">
        <el-button circle text :icon="Close" @click="dismiss" />
        <el-button type="primary" round :icon="Download" @click="install">
          安装
        </el-button>
      </div>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.pwa-install-prompt {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 400px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  box-shadow: var(--el-box-shadow-light);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 2000;
  backdrop-filter: blur(10px);

  .content {
    display: flex;
    align-items: center;
    gap: 12px;

    .icon {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    .info {
      h3 {
        font-size: 15px;
        font-weight: 600;
        margin: 0;
        color: var(--el-text-color-primary);
      }
      p {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin: 2px 0 0;
      }
    }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translate(-50%, 100%);
  opacity: 0;
}
</style>