/**
 * Chat Search 子 Store
 *
 * 从 chat.ts 积出的搜索关键词/结果/执行逻辑
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { chatlogAPI } from '@/api'
import type { Message } from '@/types/message'
import type { SearchParams } from '@/types/api'
import { useAppStore } from './app'
import { useChatMessagesStore } from './chatMessages'

export const useChatSearchStore = defineStore('chatSearch', () => {
  const appStore = useAppStore()
  const messagesStore = useChatMessagesStore()

  // ==================== State ====================

  const searchKeyword = ref('')
  const searchResults = ref<Message[]>([])
  const searchLoading = ref(false)

  // ==================== Getters ====================

  const hasSearchResults = computed(() => searchResults.value.length > 0)

  // ==================== Actions ====================

  async function searchMessages(keyword: string, params?: Partial<SearchParams>) {
    try {
      searchLoading.value = true
      searchKeyword.value = keyword
      appStore.setLoading('search', true)

      const searchParams: SearchParams = {
        keyword,
        talker: messagesStore.currentTalker || undefined,
        limit: params?.limit || 100,
        offset: params?.offset || 0,
        ...params,
      }

      const result = await chatlogAPI.searchMessages(searchParams)
      searchResults.value = result || []

      if (appStore.isDebug) {
        console.log('🔍 Search completed', {
          keyword,
          count: searchResults.value.length,
        })
      }

      return searchResults.value
    } catch (err) {
      messagesStore.error = err as Error
      appStore.setError(err as Error)
      throw err
    } finally {
      searchLoading.value = false
      appStore.setLoading('search', false)
    }
  }

  function clearSearch() {
    searchKeyword.value = ''
    searchResults.value = []
  }

  function $reset() {
    searchKeyword.value = ''
    searchResults.value = []
    searchLoading.value = false
  }

  return {
    // State
    searchKeyword,
    searchResults,
    searchLoading,

    // Getters
    hasSearchResults,

    // Actions
    searchMessages,
    clearSearch,
    $reset,
  }
})
