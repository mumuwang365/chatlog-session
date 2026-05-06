/**
 * 统一显示名称 composable
 * 提供 contact/chatroom/session 三种类型的 getDisplayName 方法，统一优先级链
 */

import { ref } from 'vue'
import { useContactStore } from '@/stores/contact'
import type { Contact, Chatroom } from '@/types/contact'
import type { Session } from '@/types/session'

export function useDisplayName() {
  const contactStore = useContactStore()

  // 显示名称缓存
  const displayNameCache = ref<Map<string, string>>(new Map())

  /**
   * 获取联系人显示名称
   * 优先级：remark > nickname > alias > wxid
   */
  function getContactDisplayName(contact: Contact): string {
    return contact.remark || contact.nickname || contact.alias || contact.wxid || '未知联系人'
  }

  /**
   * 获取群聊显示名称
   * 优先级：remark > nickname > chatroomId
   */
  function getChatroomDisplayName(chatroom: Chatroom): string {
    return chatroom.name || chatroom.chatroomId || '未知群聊'
  }

  /**
   * 获取会话显示名称（同步，从缓存或本地数据）
   * 优先级：session.name > session.talkerName > 缓存 > session.id
   */
  function getSessionDisplayNameSync(session: Session): string {
    if (session.name) return session.name
    if (session.talkerName) return session.talkerName
    const cached = displayNameCache.value.get(session.id)
    if (cached) return cached
    return session.id
  }

  /**
   * 获取会话显示名称（异步，尝试从 contact store 获取更准确的名称）
   * 优先级：contactStore 名称 > session.name > session.talkerName > session.id
   */
  async function getSessionDisplayName(session: Session): Promise<string> {
    // 先从缓存中获取
    if (displayNameCache.value.has(session.id)) {
      return displayNameCache.value.get(session.id)!
    }

    // 尝试从 contact store 获取
    try {
      const displayName = await contactStore.getContactDisplayName(session.id)
      if (displayName && displayName !== session.id) {
        displayNameCache.value.set(session.id, displayName)
        return displayName
      }
    } catch (err) {
      console.warn('获取会话显示名称失败:', session.id, err)
    }

    // 使用默认名称
    const defaultName = session.name || session.talkerName || session.id
    displayNameCache.value.set(session.id, defaultName)
    return defaultName
  }

  /**
   * 获取成员显示名称（异步，从 contact store 获取）
   */
  async function getMemberDisplayName(wxid: string): Promise<string> {
    try {
      const name = await contactStore.getContactDisplayName(wxid)
      return name || wxid
    } catch (err) {
      console.warn('获取成员显示名称失败:', wxid, err)
      return wxid
    }
  }

  /**
   * 获取成员显示名称（同步，从缓存或本地数据）
   * 优先级：缓存 > member.displayName > member.nickname > wxid
   */
  function getMemberDisplayNameSync(member: { wxid: string; displayName?: string; nickname?: string }): string {
    const cached = displayNameCache.value.get(member.wxid)
    if (cached) return cached
    return member.displayName || member.nickname || member.wxid
  }

  /**
   * 预加载会话显示名称（批量）
   */
  async function preloadSessionNames(sessions: Session[], batchSize = 10): Promise<void> {
    if (sessions.length === 0) return

    for (let i = 0; i < sessions.length; i += batchSize) {
      const batch = sessions.slice(i, i + batchSize)
      await Promise.allSettled(
        batch.map(session => getSessionDisplayName(session))
      )
    }
  }

  /**
   * 预加载成员显示名称（批量）
   */
  async function preloadMemberNames(members: Array<{ wxid: string }>, batchSize = 10): Promise<void> {
    if (members.length === 0) return

    for (let i = 0; i < members.length; i += batchSize) {
      const batch = members.slice(i, i + batchSize)
      await Promise.allSettled(
        batch.map(member => getMemberDisplayName(member.wxid))
      )
    }
  }

  /**
   * 清除缓存
   */
  function clearCache() {
    displayNameCache.value.clear()
  }

  return {
    // 缓存
    displayNameCache,

    // 同步方法
    getContactDisplayName,
    getChatroomDisplayName,
    getSessionDisplayNameSync,
    getMemberDisplayNameSync,

    // 异步方法
    getSessionDisplayName,
    getMemberDisplayName,

    // 批量加载
    preloadSessionNames,
    preloadMemberNames,

    // 缓存管理
    clearCache,
  }
}
