import { formatFileSize } from '@/utils/format'
import { getMessagePlaceholder as getPlaceholderFromConfig } from '../message-types/config'

// Re-export formatFileSize for backward compatibility
export { formatFileSize }

/**
 * 获取媒体消息的文本描述
 * 现在使用集中配置
 */
export function getMediaPlaceholder(type: number, subType?: number, fileName?: string): string {

  return getPlaceholderFromConfig(type, subType, fileName)
}

