/**
 * Stores 统一导出
 * 统一管理所有状态管理模块
 */

export { useAppStore } from './app'
export { useChatStore } from './chat'
export { useSessionStore } from './session'
export { useContactStore } from './contact'
export { useOnboardingStore } from './onboarding'
export { useSearchStore } from './search'
export { useChatroomStore } from './chatroom'
export { useMessageCacheStore } from './messageCache'
export { useAutoRefreshStore } from './autoRefresh'
export { useNotificationStore } from './notification'
export { usePWAStore } from './pwa'
export { useBatchSelectionStore } from './batchSelection'
export { useSessionSearch } from './sessionSearch'

import { useAppStore } from './app'
import { useChatStore } from './chat'
import { useSessionStore } from './session'
import { useContactStore } from './contact'
import { useOnboardingStore } from './onboarding'
import { useSearchStore } from './search'
import { useChatroomStore } from './chatroom'
import { useMessageCacheStore } from './messageCache'
import { useAutoRefreshStore } from './autoRefresh'
import { useNotificationStore } from './notification'
import { usePWAStore } from './pwa'
import { useBatchSelectionStore } from './batchSelection'

/**
 * 重置所有 store
 */
export function resetAllStores() {
  const appStore = useAppStore()
  const chatStore = useChatStore()
  const sessionStore = useSessionStore()
  const contactStore = useContactStore()
  const onboardingStore = useOnboardingStore()
  const searchStore = useSearchStore()
  const chatroomStore = useChatroomStore()
  const messageCacheStore = useMessageCacheStore()
  const autoRefreshStore = useAutoRefreshStore()
  const notificationStore = useNotificationStore()
  const pwaStore = usePWAStore()
  const batchSelectionStore = useBatchSelectionStore()

  appStore.$reset()
  chatStore.$reset()
  sessionStore.$reset()
  contactStore.$reset()
  onboardingStore.$reset()
  searchStore.$reset()
  chatroomStore.$reset()
  messageCacheStore.$reset()
  autoRefreshStore.$reset()
  notificationStore.$reset()
  pwaStore.$reset()
  batchSelectionStore.$reset()
}