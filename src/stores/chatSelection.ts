/**
 * Chat Selection 子 Store
 *
 * 合并 chat.ts 选择逻辑和 batchSelection.ts，统一 API
 * - 来自 chat.ts: selectedMessageIds (Set<number>), 基硎选择操作
 * - 来自 batchSelection.ts: isActive, selectedMessages (Map<number, Message>), 丰富选择操作
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message } from '@/types/message'
import { useChatMessagesStore } from './chatMessages'

export const useChatSelectionStore = defineStore('chatSelection', () => {
  const messagesStore = useChatMessagesStore()

  // ==================== State ====================

  /**
   * 批量选择模式是否激活
   */
  const isActive = ref<boolean>(false)

  /**
   * 已选中的消息 ID 列表
   */
  const selectedMessageIds = ref<Set<number>>(new Set())

  /**
   * 已选中的消息对象列表
   */
  const selectedMessages = ref<Map<number, Message>>(new Map())

  /**
   * 选择模式类型
   */
  const selectionMode = ref<'messages' | 'sessions'>('messages')

  // ==================== Getters ====================

  /**
   * 已选中消息数量
   */
  const selectedCount = computed(() => selectedMessageIds.value.size)

  /**
   * 是否有选中的消息
   */
  const hasSelectedMessages = computed(() => selectedMessageIds.value.size > 0)

  /**
   * 是否有选中的消息（batchSelection 兼容别名）
   */
  const hasSelection = computed(() => selectedMessageIds.value.size > 0)

  /**
   * 检查消息是否已选中
   */
  const isSelected = (messageId: number): boolean => {
    return selectedMessageIds.value.has(messageId)
  }

  /**
   * 获取所有选中的消息对象
   */
  const getSelectedMessages = computed(() => {
    return Array.from(selectedMessages.value.values())
  })

  /**
   * 获取选中消息的内容文本
   */
  const getSelectedTexts = computed(() => {
    return Array.from(selectedMessages.value.values())
      .map(msg => msg.content)
      .filter(content => content && content.trim())
  })

  /**
   * 获取选中消息的统计信息
   */
  const getStatistics = computed(() => {
    const messages = getSelectedMessages.value

    const typeCount: Record<number, number> = {}
    messages.forEach(msg => {
      typeCount[msg.type] = (typeCount[msg.type] || 0) + 1
    })

    const senderCount: Record<string, number> = {}
    messages.forEach(msg => {
      const sender = msg.senderName || msg.sender
      senderCount[sender] = (senderCount[sender] || 0) + 1
    })

    const times = messages.map(msg => new Date(msg.time).getTime())
    const minTime = times.length > 0 ? Math.min(...times) : 0
    const maxTime = times.length > 0 ? Math.max(...times) : 0

    return {
      count: messages.length,
      typeCount,
      senderCount,
      timeRange: {
        start: minTime > 0 ? new Date(minTime) : null,
        end: maxTime > 0 ? new Date(maxTime) : null,
      },
    }
  })

  // ==================== Actions ====================

  /**
   * 激活批量选择模式
   */
  function activate(mode: 'messages' | 'sessions' = 'messages') {
    isActive.value = true
    selectionMode.value = mode
    clearSelection()
  }

  /**
   * 退出批量选择模式
   */
  function deactivate() {
    isActive.value = false
    clearSelection()
  }

  /**
   * 切换批量选择模式
   */
  function toggle() {
    if (isActive.value) {
      deactivate()
    } else {
      activate()
    }
  }

  /**
   * 选中一条消息（按 ID，来自 chat.ts）
   */
  function selectMessage(id: number) {
    selectedMessageIds.value.add(id)
    // 同步到 selectedMessages Map
    const msg = messagesStore.getMessageById(id)
    if (msg) {
      selectedMessages.value.set(id, msg)
    }
  }

  /**
   * 选中一条消息（按对象，来自 batchSelection）
   */
  function selectMessageObject(message: Message) {
    selectedMessageIds.value.add(message.id)
    selectedMessages.value.set(message.id, message)
  }

  /**
   * 取消选中一条消息
   */
  function deselectMessage(id: number) {
    selectedMessageIds.value.delete(id)
    selectedMessages.value.delete(id)
  }

  /**
   * 切换消息选中状态（按 ID，来自 chat.ts）
   */
  function toggleMessageSelection(id: number) {
    if (selectedMessageIds.value.has(id)) {
      deselectMessage(id)
    } else {
      selectMessage(id)
    }
  }

  /**
   * 切换消息选中状态（按对象，来自 batchSelection）
   */
  function toggleMessage(message: Message) {
    if (isSelected(message.id)) {
      deselectMessage(message.id)
    } else {
      selectMessageObject(message)
    }
  }

  /**
   * 批量选中消息
   */
  function selectMessages(messages: Message[]) {
    messages.forEach(message => {
      selectedMessageIds.value.add(message.id)
      selectedMessages.value.set(message.id, message)
    })
  }

  /**
   * 批量取消选中
   */
  function deselectMessages(messageIds: number[]) {
    messageIds.forEach(id => {
      selectedMessageIds.value.delete(id)
      selectedMessages.value.delete(id)
    })
  }

  /**
   * 全选当前会话消息（来自 chat.ts）
   */
  function selectAllMessages() {
    messagesStore.currentMessages.forEach(msg => {
      selectedMessageIds.value.add(msg.id)
      selectedMessages.value.set(msg.id, msg)
    })
  }

  /**
   * 全选指定消息列表（来自 batchSelection）
   */
  function selectAll(messages: Message[]) {
    selectMessages(messages)
  }

  /**
   * 反选
   */
  function invertSelection(allMessages: Message[]) {
    const newSelectedIds = new Set<number>()
    const newSelectedMessages = new Map<number, Message>()

    allMessages.forEach(message => {
      if (!isSelected(message.id)) {
        newSelectedIds.add(message.id)
        newSelectedMessages.set(message.id, message)
      }
    })

    selectedMessageIds.value = newSelectedIds
    selectedMessages.value = newSelectedMessages
  }

  /**
   * 清除选择
   */
  function clearSelection() {
    selectedMessageIds.value.clear()
    selectedMessages.value.clear()
  }

  /**
   * 选择范围内的消息
   */
  function selectRange(messages: Message[], fromId: number, toId: number) {
    const fromIndex = messages.findIndex(m => m.id === fromId)
    const toIndex = messages.findIndex(m => m.id === toId)

    if (fromIndex === -1 || toIndex === -1) return

    const startIndex = Math.min(fromIndex, toIndex)
    const endIndex = Math.max(fromIndex, toIndex)

    const rangeMessages = messages.slice(startIndex, endIndex + 1)
    selectMessages(rangeMessages)
  }

  /**
   * 按条件筛选并选中消息
   */
  function selectByCondition(
    messages: Message[],
    condition: (message: Message) => boolean
  ) {
    const matchedMessages = messages.filter(condition)
    selectMessages(matchedMessages)
  }

  /**
   * 选择包含特定关键词的消息
   */
  function selectByKeyword(messages: Message[], keyword: string) {
    selectByCondition(messages, message => {
      return message.content?.toLowerCase().includes(keyword.toLowerCase())
    })
  }

  /**
   * 选择特定发送者的消息
   */
  function selectBySender(messages: Message[], sender: string) {
    selectByCondition(messages, message => message.sender === sender)
  }

  /**
   * 选择特定类型的消息
   */
  function selectByType(messages: Message[], type: number) {
    selectByCondition(messages, message => message.type === type)
  }

  /**
   * 获取选中的消息列表（来自 chat.ts，返回当前会话中选中的消息）
   */
  function getSelectedMessagesList(): Message[] {
    return messagesStore.currentMessages.filter(msg => selectedMessageIds.value.has(msg.id))
  }

  /**
   * 删除选中的消息（本地，来自 chat.ts）
   */
  function deleteSelectedMessages() {
    const selectedIds = Array.from(selectedMessageIds.value)
    messagesStore.messages = messagesStore.messages.filter(msg => !selectedIds.includes(msg.id))
    clearSelection()
  }

  /**
   * 导出选中的消息为文本
   */
  function exportAsText(): string {
    const messages = getSelectedMessages.value

    return messages
      .map(msg => {
        const time = new Date(msg.time).toLocaleString('zh-CN')
        const sender = msg.senderName || msg.sender
        const content = msg.content || '[非文本消息]'
        return `[${time}] ${sender}: ${content}`
      })
      .join('\n')
  }

  /**
   * 导出选中的消息为 JSON
   */
  function exportAsJSON(): string {
    const messages = getSelectedMessages.value
    return JSON.stringify(messages, null, 2)
  }

  /**
   * 复制选中的消息到剪贴板
   */
  async function copyToClipboard(): Promise<boolean> {
    try {
      const text = exportAsText()
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      console.error('复制到剪贴板失败:', error)
      return false
    }
  }

  function $reset() {
    isActive.value = false
    selectedMessageIds.value = new Set()
    selectedMessages.value = new Map()
    selectionMode.value = 'messages'
  }

  return {
    // State
    isActive,
    selectedMessageIds,
    selectedMessages,
    selectionMode,

    // Getters
    selectedCount,
    hasSelectedMessages,
    hasSelection,
    isSelected,
    getSelectedMessages,
    getSelectedTexts,
    getStatistics,

    // Actions
    activate,
    deactivate,
    toggle,
    selectMessage,
    selectMessageObject,
    deselectMessage,
    toggleMessageSelection,
    toggleMessage,
    selectMessages,
    deselectMessages,
    selectAllMessages,
    selectAll,
    invertSelection,
    clearSelection,
    selectRange,
    selectByCondition,
    selectByKeyword,
    selectBySender,
    selectByType,
    getSelectedMessagesList,
    deleteSelectedMessages,
    exportAsText,
    exportAsJSON,
    copyToClipboard,
    $reset,
  }
})
