/**
 * Chat Store 统一入口
 * 
 * ⚠️ 注意：此文件是向后兼容的 re-export 入口
 * 新代码建议直接使用子 store：
 * - useChatMessagesStore (from './chatMessages')
 * - useChatSearchStore (from './chatSearch')  
 * - useChatSelectionStore (from './chatSelection')
 * - useChatExportStore (from './chatExport')
 * 
 * @deprecated 请迁移到子 store
 */

// Re-export 主 chat store（包含所有逻辑）
export { useChatStore } from './chat'
export type { Message } from '@/types/message'
