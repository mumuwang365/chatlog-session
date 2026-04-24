/**
 * 拼音转换工具函数
 * 用于联系人姓名的拼音首字母提取和排序
 */

import { pinyin } from 'pinyin-pro'

/**
 * 获取联系人的索引字母
 * @param name 联系人姓名（优先备注，其次昵称）
 * @param isStarred 是否星标
 * @returns 索引字母：⭐ | A-Z | #
 */
export function getContactIndexKey(name: string, isStarred?: boolean): string {
  // 1. 星标联系人
  if (isStarred) {
    return '⭐'
  }

  // 2. 空名称处理
  if (!name || !name.trim()) {
    return '#'
  }

  // 3. 获取首字符
  const firstChar = name.trim().charAt(0)

  // 4. 英文字母判断
  if (/^[A-Za-z]$/.test(firstChar)) {
    return firstChar.toUpperCase()
  }

  // 5. 中文字符判断
  if (/^[\u4e00-\u9fa5]$/.test(firstChar)) {
    try {
      const pinyinResult = pinyin(firstChar, {
        pattern: 'first',
        toneType: 'none',
        type: 'string'
      })
      
      if (pinyinResult) {
        const initial = pinyinResult.charAt(0).toUpperCase()
        if (/^[A-Z]$/.test(initial)) {
          return initial
        }
      }
    } catch (error) {
      console.warn('拼音转换失败:', firstChar, error)
    }
  }

  // 6. 数字、符号等特殊字符
  return '#'
}

/**
 * 获取联系人的完整拼音排序键
 * @param name 联系人姓名
 * @returns 排序键（拼音全拼或原始字符串）
 */
export function getContactSortKey(name: string): string {
  if (!name || !name.trim()) {
    return ''
  }

  const trimmedName = name.trim()

  // 检查是否包含中文
  if (/[\u4e00-\u9fa5]/.test(trimmedName)) {
    try {
      // 转换为拼音全拼，用于排序
      const pinyinResult = pinyin(trimmedName, {
        toneType: 'none',
        type: 'array'
      })
      
      if (Array.isArray(pinyinResult) && pinyinResult.length > 0) {
        return pinyinResult.join('').toLowerCase()
      }
    } catch (error) {
      console.warn('拼音转换失败:', trimmedName, error)
    }
  }

  // 英文或其他字符，直接返回小写形式
  return trimmedName.toLowerCase()
}

/**
 * 比较两个联系人名称的排序顺序
 * @param nameA 名称A
 * @param nameB 名称B
 * @returns 负数表示A在前，正数表示B在前，0表示相等
 */
export function compareContactNames(nameA: string, nameB: string): number {
  const keyA = getContactSortKey(nameA)
  const keyB = getContactSortKey(nameB)
  return keyA.localeCompare(keyB, 'zh-CN')
}