/**
 * 聊天消息状态管理 — 向后兼容入口
 *
 * @deprecated 此 store 已拆分为四个子 store，请直接使用：
 * - useChatMessagesStore: 消息加载/分页/Gap/EmptyRange/currentTalker
 * - useChatSearchStore: 搜索关键词/结果/执行
 * - useChatSelectionStore: 消息选择/批量操作
 * - useChatExportStore: 导出状态/进度/格式
 *
 * 本文件提供向后兼容的统一入口，新代码请直接使用子 store
 */
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useChatMessagesStore } from './chatMessages'
import { useChatSearchStore } from './chatSearch'
import { useChatSelectionStore } from './chatSelection'

/**
 * @deprecated 请使用 useChatMessagesStore / useChatSearchStore / useChatSelectionStore / useChatExportStore
 */
export const useChatStore = defineStore('chat', () => {
  const messagesStore = useChatMessagesStore()
  const searchStore = useChatSearchStore()
  const selectionStore = useChatSelectionStore()

  // ==================== Re-exported State ====================

  // From chatMessages
  const messages = messagesStore.messages
  const currentTalker = messagesStore.currentTalker
  const totalMessages = messagesStore.totalMessages
  const currentPage = messagesStore.currentPage
  const pageSize = messagesStore.pageSize
  const hasMore = messagesStore.hasMore
  const playingVoiceId = messagesStore.playingVoiceId
  const loading = messagesStore.loading
  const error = messagesStore.error
  const loadingHistory = messagesStore.loadingHistory
  const historyLoadMessage = messagesStore.historyLoadMessage
  const scrollTargetId = messagesStore.scrollTargetId

  // From chatSearch
  const searchKeyword = searchStore.searchKeyword
  const searchResults = searchStore.searchResults
  const searchLoading = searchStore.searchLoading

  // From chatSelection
  const selectedMessageIds = selectionStore.selectedMessageIds

  // ==================== Re-exported Getters ====================

  const currentMessages = messagesStore.currentMessages
  const messagesByDate = messagesStore.messagesByDate
  const hasSelectedMessages = selectionStore.hasSelectedMessages
  const selectedCount = selectionStore.selectedCount
  const hasSearchResults = searchStore.hasSearchResults
  const mediaMessages = messagesStore.mediaMessages
  const imageMessages = messagesStore.imageMessages
  const videoMessages = messagesStore.videoMessages
  const fileMessages = messagesStore.fileMessages

  // ==================== Re-exported Actions ====================

  // chatMessages actions
  const loadMessages = messagesStore.loadMessages
  const loadMoreMessages = messagesStore.loadMoreMessages
  const loadHistoryMessages = messagesStore.loadHistoryMessages
  const loadGapMessages = messagesStore.loadGapMessages
  const removeGapMessages = messagesStore.removeGapMessages
  const removeGapMessage = messagesStore.removeGapMessage
  const hasGapMessage = messagesStore.hasGapMessage
  const refreshMessages = messagesStore.refreshMessages
  const switchSession = messagesStore.switchSession
  const getMessageById = messagesStore.getMessageById
  const getMessageIndex = messagesStore.getMessageIndex
  const jumpToMessage = messagesStore.jumpToMessage
  const setPlayingVoice = messagesStore.setPlayingVoice
  const getMessageStats = messagesStore.getMessageStats
  const clearError = messagesStore.clearError
  const init = messagesStore.init
  const cleanup = messagesStore.cleanup

  // chatMessages cache/refresh 封装
  const getCacheMetadata = messagesStore.getCacheMetadata
  const removeCache = messagesStore.removeCache
  const getCache = messagesStore.getCache
  const isAutoRefreshEnabled = messagesStore.isAutoRefreshEnabled
  const triggerRefresh = messagesStore.triggerRefresh
  const handleCacheUpdateData = messagesStore.handleCacheUpdateData

  // chatSearch actions
  const searchMessages = searchStore.searchMessages
  const clearSearch = searchStore.clearSearch

  // chatSelection actions
  const selectMessage = selectionStore.selectMessage
  const deselectMessage = selectionStore.deselectMessage
  const toggleMessageSelection = selectionStore.toggleMessageSelection
  const selectAllMessages = selectionStore.selectAllMessages
  const clearSelection = selectionStore.clearSelection
  const getSelectedMessages = selectionStore.getSelectedMessagesList
  const deleteSelectedMessages = selectionStore.deleteSelectedMessages

  // exportSelectedMessages stub (向后兼容)
  const exportSelectedMessages = async (_format: 'json' | 'csv' | 'text' = 'json') => {
    // 此方法原为空 stub，真正的导出逻辑在 useChatExportStore
  }

  // ==================== $reset ====================

  function $reset() {
    messagesStore.$reset()
    searchStore.$reset()
    selectionStore.$reset()
  }

  return {
    // State
    messages,
    currentTalker,
    totalMessages,
    currentPage,
    pageSize,
    hasMore,
    searchKeyword,
    searchResults,
    selectedMessageIds,
    playingVoiceId,
    loading,
    searchLoading,
    error,
    loadingHistory,
    historyLoadMessage,
    scrollTargetId,

    // Cache & Refresh 封装方法
    getCacheMetadata,
    removeCache,
    getCache,
    isAutoRefreshEnabled,
    triggerRefresh,
    handleCacheUpdateData,

    // Getters
    currentMessages,
    messagesByDate,
    hasSelectedMessages,
    selectedCount,
    hasSearchResults,
    mediaMessages,
    imageMessages,
    videoMessages,
    fileMessages,

    // Actions
    init,
    loadMessages,
    loadMoreMessages,
    loadHistoryMessages,
    loadGapMessages,
    removeGapMessages,
    removeGapMessage,
    hasGapMessage,
    refreshMessages,
    switchSession,
    searchMessages,
    clearSearch,
    getMessageById,
    getMessageIndex,
    jumpToMessage,
    selectMessage,
    deselectMessage,
    toggleMessageSelection,
    selectAllMessages,
    clearSelection,
    getSelectedMessages,
    deleteSelectedMessages,
    exportSelectedMessages,
    setPlayingVoice,
    getMessageStats,
    clearError,
    $reset,
    cleanup,
  }
})
