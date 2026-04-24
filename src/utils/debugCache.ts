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
 * 测试缓存功能
 */
export async function testCache(talker: string): Promise<void> {
  const cacheStore = useMessageCacheStore()
  
  console.group(`🧪 测试缓存功能: ${talker}`)
  
  // 1. 检查是否有缓存
  console.log('1️⃣ 检查缓存...')
  const cached = cacheStore.get(talker)
  console.log('结果:', cached ? `✅ 有缓存 (${cached.length} 条消息)` : '❌ 无缓存')
  
  // 2. 清理缓存
  if (cached) {
    console.log('2️⃣ 清理缓存...')
    cacheStore.remove(talker)
    console.log('结果: ✅ 已清理')
  }
  
  // 3. 保存测试数据
  console.log('3️⃣ 保存测试数据...')
  const testMessages = [{
    id: 1,
    seq: 1,
    time: new Date().toISOString(),
    createTime: Date.now() / 1000,
    talker,
    talkerName: 'Test',
    sender: 'test_sender',
    senderName: 'Test Sender',
    isSelf: false,
    isSend: 0,
    isChatRoom: false,
    type: 1,
    subType: 0,
    content: 'Test message',
  }]
  const success = cacheStore.set(talker, testMessages as Message[])
  console.log('结果:', success ? '✅ 保存成功' : '❌ 保存失败')
  
  // 4. 再次读取
  console.log('4️⃣ 读取缓存...')
  const cached2 = cacheStore.get(talker)
  console.log('结果:', cached2 ? `✅ 读取成功 (${cached2.length} 条消息)` : '❌ 读取失败')
  
  console.groupEnd()
}

/**
 * 测试自动刷新功能
 */
export async function testAutoRefresh(talker: string): Promise<void> {
  const refreshStore = useAutoRefreshStore()
  
  console.group(`🧪 测试自动刷新功能: ${talker}`)
  
  // 1. 检查配置
  console.log('1️⃣ 检查配置...')
  console.log('启用状态:', refreshStore.config.enabled ? '✅ 启用' : '❌ 禁用')
  console.log('刷新间隔:', formatDuration(refreshStore.config.interval))
  console.log('最大并发:', refreshStore.config.maxConcurrency)
  
  // 2. 启用自动刷新（如果未启用）
  if (!refreshStore.config.enabled) {
    console.log('2️⃣ 启用自动刷新...')
    refreshStore.updateConfig({ enabled: true })
    console.log('结果: ✅ 已启用')
  }
  
  // 3. 手动刷新
  console.log('3️⃣ 手动刷新会话...')
  console.time('刷新耗时')
  try {
    const result = await refreshStore.refreshOne(talker, 10, undefined)
    console.timeEnd('刷新耗时')
    console.log('结果:', result ? `✅ 成功 (${result.length} 条消息)` : '❌ 失败')
  } catch (error) {
    console.timeEnd('刷新耗时')
    console.error('结果: ❌ 错误', error)
  }
  
  // 4. 查看统计
  console.log('4️⃣ 查看统计...')
  const report = refreshStore.getReport()
  console.log('总任务:', report.stats.totalTasks)
  console.log('成功:', report.stats.successCount)
  console.log('失败:', report.stats.failedCount)
  
  console.groupEnd()
}

/**
 * 测试增量刷新功能
 * 模拟有缓存的情况下，智能填补消息缺口
 */
export async function testIncrementalRefresh(talker: string): Promise<void> {
  const cacheStore = useMessageCacheStore()
  const refreshStore = useAutoRefreshStore()
  
  console.group(`🧪 测试增量刷新功能: ${talker}`)
  
  // 1. 检查当前缓存
  console.log('1️⃣ 检查当前缓存...')
  const cached = cacheStore.get(talker)
  if (cached) {
    console.log(`✅ 已有缓存: ${cached.length} 条消息`)
    const latest = cached[cached.length - 1]
    const latestTime = latest.time ? new Date(latest.time).toISOString() : new Date(latest.createTime * 1000).toISOString()
    console.log(`📅 最新消息时间: ${latestTime}`)
  } else {
    console.log('❌ 无缓存，将首次获取消息')
  }
  
  // 2. 启用自动刷新
  if (!refreshStore.config.enabled) {
    console.log('2️⃣ 启用自动刷新...')
    refreshStore.updateConfig({ enabled: true })
  }
  
  // 3. 执行增量刷新
  console.log('3️⃣ 执行增量刷新...')
  console.time('增量刷新耗时')
  
  try {
    const beforeCount = cached ? cached.length : 0
    // 获取起始时间
    let startFromTime: string | undefined
    if (cached && cached.length > 0) {
      const latest = cached[cached.length - 1]
      const timestamp = latest.time ? new Date(latest.time).getTime() : latest.createTime * 1000
      const { toCST } = await import('@/utils/timezone')
      startFromTime = toCST(new Date(timestamp))
      console.log(`📅 刷新起始时间: ${startFromTime}`)
    }
    
    const result = await refreshStore.refreshOne(talker, 10, startFromTime)
    console.timeEnd('增量刷新耗时')
    
    if (result) {
      const afterCount = result.length
      const newCount = afterCount - beforeCount
      console.log(`✅ 刷新成功`)
      console.log(`   原有消息: ${beforeCount} 条`)
      console.log(`   刷新后: ${afterCount} 条`)
      console.log(`   新增消息: ${newCount} 条`)
      
      // 显示新增消息的时间范围
      if (newCount > 0 && cached) {
        const newMessages = result.slice(beforeCount)
        const firstNew = newMessages[0]
        const lastNew = newMessages[newMessages.length - 1]
        const firstTime = firstNew.time ? new Date(firstNew.time).toISOString() : new Date(firstNew.createTime * 1000).toISOString()
        const lastTime = lastNew.time ? new Date(lastNew.time).toISOString() : new Date(lastNew.createTime * 1000).toISOString()
        console.log(`   时间范围: ${firstTime} ~ ${lastTime}`)
      }
    } else {
      console.log('❌ 刷新失败')
    }
  } catch (error) {
    console.timeEnd('增量刷新耗时')
    console.error('❌ 刷新错误:', error)
  }
  
  // 4. 验证缓存
  console.log('4️⃣ 验证缓存状态...')
  const updatedCache = cacheStore.get(talker)
  if (updatedCache) {
    console.log(`✅ 缓存已更新: ${updatedCache.length} 条消息`)
    
    // 检查消息是否有重复
    const ids = new Set()
    let duplicates = 0
    updatedCache.forEach(msg => {
      const key = `${msg.id}_${msg.seq}`
      if (ids.has(key)) {
        duplicates++
      } else {
        ids.add(key)
      }
    })
    
    if (duplicates > 0) {
      console.warn(`⚠️ 发现 ${duplicates} 条重复消息`)
    } else {
      console.log('✅ 无重复消息')
    }
    
    // 检查消息是否按时间排序
    let isOrdered = true
    for (let i = 1; i < updatedCache.length; i++) {
      const prevTime = updatedCache[i - 1].time ? new Date(updatedCache[i - 1].time).getTime() : updatedCache[i - 1].createTime * 1000
      const currTime = updatedCache[i].time ? new Date(updatedCache[i].time).getTime() : updatedCache[i].createTime * 1000
      if (prevTime > currTime) {
        isOrdered = false
        break
      }
    }
    
    if (isOrdered) {
      console.log('✅ 消息按时间正确排序')
    } else {
      console.warn('⚠️ 消息排序异常')
    }
  } else {
    console.log('❌ 缓存验证失败')
  }
  
  console.groupEnd()
}

/**
 * 测试任务覆盖逻辑
 * 验证当添加新任务时，是否正确处理已存在的任务
 */
export async function testTaskOverride(talker: string): Promise<void> {
  const refreshStore = useAutoRefreshStore()
  
  console.group(`🧪 测试任务覆盖逻辑: ${talker}`)
  
  // 1. 清空现有任务
  console.log('1️⃣ 清空现有任务...')
  refreshStore.clearTasks()
  console.log('✅ 任务已清空')
  
  // 2. 添加第一个任务
  console.log('2️⃣ 添加第一个任务 (priority=1, startFromTime=2025-01-20T10:00:00.000+08:00)...')
  const task1 = refreshStore.addTask(talker, 1, '2025-01-20T10:00:00.000+08:00')
  console.log(`✅ 任务已添加:`, {
    status: task1.status,
    priority: task1.priority,
    startFromTime: task1.startFromTime,
  })
  
  // 3. 再次添加相同会话的任务（状态为 PENDING，应该被覆盖）
  console.log('3️⃣ 再次添加相同会话的任务 (priority=5, startFromTime=2025-01-21T10:00:00.000+08:00)...')
  const task2 = refreshStore.addTask(talker, 5, '2025-01-21T10:00:00.000+08:00')
  console.log(`✅ 任务状态:`, {
    status: task2.status,
    priority: task2.priority,
    startFromTime: task2.startFromTime,
  })
  
  // 验证是否是新任务
  if (task2.priority === 5 && task2.startFromTime === '2025-01-21T10:00:00.000+08:00') {
    console.log('✅ 验证通过: 旧任务已被新任务覆盖')
  } else {
    console.warn('⚠️ 验证失败: 旧任务未被正确覆盖')
  }
  
  // 4. 模拟任务运行中
  console.log('4️⃣ 将任务状态设置为 RUNNING...')
  task2.status = RefreshStatus.RUNNING
  console.log('✅ 任务状态:', task2.status)
  
  // 5. 尝试添加任务（状态为 RUNNING，不应该被覆盖，只更新字段）
  console.log('5️⃣ 再次添加相同会话的任务 (priority=10, startFromTime=2025-01-22T10:00:00.000+08:00)...')
  const task3 = refreshStore.addTask(talker, 10, '2025-01-22T10:00:00.000+08:00')
  console.log(`✅ 任务状态:`, {
    status: task3.status,
    priority: task3.priority,
    startFromTime: task3.startFromTime,
    isSameObject: task3 === task2,
  })
  
  // 验证是否只更新了字段
  if (task3.status === RefreshStatus.RUNNING && task3.priority === 10 && task3.startFromTime === '2025-01-22T10:00:00.000+08:00') {
    console.log('✅ 验证通过: RUNNING 任务只更新字段，未被覆盖')
  } else {
    console.warn('⚠️ 验证失败: RUNNING 任务处理不正确')
  }
  
  // 6. 查看当前任务列表
  console.log('6️⃣ 当前任务列表...')
  const report = refreshStore.getReport()
  console.log(`任务总数: ${report.tasks.length}`)
  console.table(report.tasks.map(t => ({
    会话: t.talker.substring(0, 20),
    状态: t.status,
    优先级: t.priority,
    起始时间: t.startFromTime || '-',
  })))
  
  // 7. 清理
  console.log('7️⃣ 清理任务...')
  refreshStore.clearTasks()
  console.log('✅ 清理完成')
  
  console.groupEnd()
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
      testCache: (talker: string) => Promise<void>
      testAutoRefresh: (talker: string) => Promise<void>
      testIncrementalRefresh: (talker: string) => Promise<void>
      testTaskOverride: (talker: string) => Promise<void>
      clearAll: () => void
      enableAutoRefresh: (interval?: number) => void
      disableAutoRefresh: () => void
    }
    
    (window as typeof window & { debugCache: DebugCacheTools }).debugCache = {
      info: getDebugInfo,
      print: printDebugInfo,
      testCache,
      testAutoRefresh,
      testIncrementalRefresh,
      testTaskOverride,
      clearAll,
      enableAutoRefresh,
      disableAutoRefresh,
    }
    
    console.log('🔧 缓存调试工具已安装')
    console.log('使用方法:')
    console.log('  debugCache.print()                        - 打印调试信息')
    console.log('  debugCache.testCache(talker)              - 测试缓存功能')
    console.log('  debugCache.testAutoRefresh(talker)        - 测试自动刷新')
    console.log('  debugCache.testIncrementalRefresh(talker) - 测试增量刷新')
    console.log('  debugCache.testTaskOverride(talker)       - 测试任务覆盖逻辑')
    console.log('  debugCache.enableAutoRefresh()            - 启用自动刷新')
    console.log('  debugCache.disableAutoRefresh()           - 禁用自动刷新')
    console.log('  debugCache.clearAll()                     - 清理所有数据')
  }
}

// 开发环境自动安装
if (import.meta.env.DEV) {
  installDebugTools()
}