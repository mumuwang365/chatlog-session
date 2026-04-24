/**
 * Stores 统一导出
 * 统一管理所有状态管理模块
 */

export { useAppStore } from './app'
export { useChatMessagesStore } from './chatMessages'
export { useChatSearchStore } from './chatSearch'
export { useChatSelectionStore } from './chatSelection'
export { useChatExportStore } from './chatExport'
export { useSettingsStore } from './settings'
export { useSessionStore } from './session'
export { useContactStore } from './contact'
export { useOnboardingStore } from './onboarding'
export { useSearchStore } from './search'
export { useChatroomStore } from './chatroom'
export { useMessageCacheStore } from './messageCache'
export { useAutoRefreshStore } from './autoRefresh'
export { useNotificationStore } from './notification'
export { usePWAStore } from './pwa'
export { useSessionSearch } from './sessionSearch'

import { useAppStore } from './app'
import { useChatMessagesStore } from './chatMessages'
import { useChatSearchStore } from './chatSearch'
import { useChatSelectionStore } from './chatSelection'
import { useChatExportStore } from './chatExport'
import { useSettingsStore } from './settings'
import { useSessionStore } from './session'
import { useContactStore } from './contact'
import { useOnboardingStore } from './onboarding'
import { useSearchStore } from './search'
import { useChatroomStore } from './chatroom'
import { useMessageCacheStore } from './messageCache'
import { useAutoRefreshStore } from './autoRefresh'
import { useNotificationStore } from './notification'
import { usePWAStore } from './pwa'

/**
 * 重置所有 store
 */
export function resetAllStores() {
  const appStore = useAppStore()
  const chatMessagesStore = useChatMessagesStore()
  const chatSearchStore = useChatSearchStore()
  const chatSelectionStore = useChatSelectionStore()
  const chatExportStore = useChatExportStore()
  const settingsStore = useSettingsStore()
  const sessionStore = useSessionStore()
  const contactStore = useContactStore()
  const onboardingStore = useOnboardingStore()
  const searchStore = useSearchStore()
  const chatroomStore = useChatroomStore()
  const messageCacheStore = useMessageCacheStore()
  const autoRefreshStore = useAutoRefreshStore()
  const notificationStore = useNotificationStore()
  const pwaStore = usePWAStore()

  appStore.$reset()
  chatMessagesStore.$reset()
  chatSearchStore.$reset()
  chatSelectionStore.$reset()
  chatExportStore.$reset()
  settingsStore.$reset()
  sessionStore.$reset()
  contactStore.$reset()
  onboardingStore.$reset()
  searchStore.$reset()
  chatroomStore.$reset()
  messageCacheStore.$reset()
  autoRefreshStore.$reset()
  notificationStore.$reset()
  pwaStore.$reset()
}
