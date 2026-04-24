/**
 * 缓存和自动刷新调试工具
 * 用于诊断和调试缓存、自动刷新功能
 */

import { formatFileSize as formatBytes } from './format'

import { useMessageCacheStore } from '@/stores/messageCache'
import { useAutoRefreshStore, RefreshStatus } from '@/stores/autoRefresh'
import type { Message } from '@/types/message'

/**
 * 调试信息接口
 */
interface DebugInfo {
  timestamp: string
  cache: {
    enabled: boolean
    count: number
    totalSize: number
    maxSize: number
    usagePercentage: number
    items: Array<{
      talker: string
      messageCount: number
      size: number
      age: number
      lastAccess: number
    }>
  }
  refresh: {
    enabled: boolean
    interval: number
    maxConcurrency: number
    activeCount: number
    pendingCount: number
    runningCount: number
    needsRefreshCount: number
    tasks: Array<{
      talker: string
      status: string
      priority: number
      retryCount: number
      startTime?: number
      endTime?: number
      duration?: number
      error?: string
      startFromTime?: string
    }>
    stats: {
      totalTasks: number
      successCount: number
      failedCount: number
      averageTime: number
      lastRefreshTime: number
    }
  }
}

/**
 * 获取调试信息
 */
export function getDebugInfo(): DebugInfo {
  const cacheStore = useMessageCacheStore()
  const refreshStore = useAutoRefreshStore()

  const cacheStats = cacheStore.getStats()
  const refreshReport = refreshStore.getReport()

  return {
    timestamp: new Date().toISOString(),
    cache: {
      enabled: true, // 缓存总是启用的
      count: cacheStats.count,
      totalSize: cacheStats.totalSize,
      maxSize: cacheStats.maxSize,
      usagePercentage: cacheStats.usagePercentage,
      items: cacheStats.items,
    },
    refresh: {
      enabled: refreshReport.config.enabled,
      interval: refreshReport.config.interval,
      maxConcurrency: refreshReport.config.maxConcurrency,
      activeCount: refreshReport.activeCount,
      pendingCount: refreshReport.pendingCount,
      runningCount: refreshStore.runningTasks.length,
      needsRefreshCount: refreshReport.needsRefreshCount,
      tasks: refreshReport.tasks,
      stats: refreshReport.stats,
    },
  }
}

/**
 * 打印调试信息到控制台
 */
export function printDebugInfo(): void {
  const info = getDebugInfo()
  
  console.group('🔍 缓存和自动刷新调试信息')
  
  // 缓存信息
  console.group('📦 缓存信息')
  console.log('状态:', info.cache.enabled ? '✅ 启用' : '❌ 禁用')
  console.log('缓存项数:', info.cache.count)
  console.log('总大小:', formatBytes(info.cache.totalSize))
  console.log('最大限制:', formatBytes(info.cache.maxSize))
  console.log('使用率:', info.cache.usagePercentage.toFixed(2) + '%')
  
  if (info.cache.items.length > 0) {
    console.table(info.cache.items.map(item => ({
      会话: item.talker.substring(0, 20),
      消息数: item.messageCount,
      大小: formatBytes(item.size),
      年龄: formatDuration(item.age),
      最后访问: formatDuration(item.lastAccess),
    })))
  }
  console.groupEnd()
  
  // 自动刷新信息
  console.group('🔄 自动刷新信息')
  console.log('状态:', info.refresh.enabled ? '✅ 启用' : '❌ 禁用')
  console.log('刷新间隔:', formatDuration(info.refresh.interval))
  console.log('最大并发:', info.refresh.maxConcurrency)
  console.log('活跃任务:', info.refresh.activeCount)
  console.log('等待任务:', info.refresh.pendingCount)
  console.log('运行任务:', info.refresh.runningCount)
  console.log('待刷新会话:', info.refresh.needsRefreshCount)
  
  console.group('📊 统计信息')
  console.log('总任务数:', info.refresh.stats.totalTasks)
  console.log('成功:', info.refresh.stats.successCount)
  console.log('失败:', info.refresh.stats.failedCount)
  console.log('平均耗时:', info.refresh.stats.averageTime.toFixed(0) + 'ms')
  console.log('上次刷新:', info.refresh.stats.lastRefreshTime 
    ? formatDuration(Date.now() - info.refresh.stats.lastRefreshTime) + ' 前'
    : '从未')
  console.groupEnd()
  
  if (info.refresh.tasks.length > 0) {
    console.group('📋 任务列表')
    console.table(info.refresh.tasks.map(task => ({
      会话: task.talker.substring(0, 20),
      状态: getStatusEmoji(task.status) + ' ' + task.status,
      优先级: task.priority,
      重试: task.retryCount,
      起始时间: task.startFromTime ? task.startFromTime.substring(0, 19) : '-',
      耗时: task.duration ? task.duration + 'ms' : '-',
      错误: task.error || '-',
    })))
    console.groupEnd()
  }
  console.groupEnd()
  
  console.groupEnd()
}

/**
 * 格式化时长
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return ms + 'ms'
  if (ms < 60000) return (ms / 1000).toFixed(1) + 's'
  if (ms < 3600000) return (ms / 60000).toFixed(1) + 'min'
  return (ms / 3600000).toFixed(1) + 'h'
}

/**
 * 获取状态表情
 */
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'pending': return '⏳'
    case 'running': return '🔄'
    case 'success': return '✅'
    case 'failed': return '❌'
    default: return '❓'
  }
}


/**
 * 清理所有缓存和任务
 */
export function clearAll(): void {
  const cacheStore = useMessageCacheStore()
  const refreshStore = useAutoRefreshStore()
  
  console.log('🧹 清理所有数据...')
  
  cacheStore.clear()
  console.log('✅ 缓存已清空')
  
  refreshStore.clearTasks()
  console.log('✅ 任务已清空')
  
  refreshStore.resetStats()
  console.log('✅ 统计已重置')
  
  console.log('🎉 清理完成')
}

/**
 * 启用自动刷新（快捷方法）
 */
export function enableAutoRefresh(interval = 5 * 60 * 1000): void {
  const refreshStore = useAutoRefreshStore()
  
  refreshStore.updateConfig({
    enabled: true,
    interval,
  })
  
  console.log(`✅ 自动刷新已启用，间隔: ${formatDuration(interval)}`)
}

/**
 * 禁用自动刷新（快捷方法）
 */
export function disableAutoRefresh(): void {
  const refreshStore = useAutoRefreshStore()
  
  refreshStore.updateConfig({ enabled: false })
  
  console.log('❌ 自动刷新已禁用')
}

/**
 * 在 window 对象上暴露调试工具
 */
export function installDebugTools(): void {
  if (typeof window !== 'undefined') {
    interface DebugCacheTools {
      info: () => DebugInfo
      print: () => void
      clearAll: () => void
      enableAutoRefresh: (interval?: number) => void
      disableAutoRefresh: () => void
    }
    
    (window as typeof window & { debugCache: DebugCacheTools }).debugCache = {
      info: getDebugInfo,
      print: printDebugInfo,
      clearAll,
      enableAutoRefresh,
      disableAutoRefresh,
    }
    
    console.log('🔧 缓存调试工具已安装')
    console.log('使用方法:')
    console.log('  debugCache.print()                        - 打印调试信息')
    console.log('  debugCache.enableAutoRefresh()            - 启用自动刷新')
    console.log('  debugCache.disableAutoRefresh()           - 禁用自动刷新')
    console.log('  debugCache.clearAll()                     - 清理所有数据')
  }
}

// 开发环境自动安装
if (import.meta.env.DEV) {
  installDebugTools()
}