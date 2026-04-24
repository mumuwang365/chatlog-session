<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { chatlogAPI } from '@/api/chatlog'
import { downloadJSON, downloadText, downloadMarkdown } from '@/utils/download'
import { formatMessagesAsText, formatMessagesAsMarkdown } from '@/utils/message-format'
import type { Message } from '@/types'

/**
 * 导出阶段类型
 */
type ExportStage = 'config' | 'progress' | 'complete' | 'error'

/**
 * 导出格式类型
 */
type ExportFormat = 'json' | 'csv' | 'txt' | 'markdown'

/**
 * 时间范围类型
 */
type TimeRangeType = 'all' | 'last7Days' | 'last30Days' | 'custom'

/**
 * Props 接口
 */
interface Props {
  visible: boolean
  sessionId?: string
  sessionName?: string
}

/**
 * Emits 接口
 */
interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ==================== Computed ====================

/**
 * 对话框可见性（支持 v-model）
 */
const dialogVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => {
    emit('update:visible', value)
    if (!value) {
      emit('close')
      resetState()
    }
  },
})

// ==================== State ====================

/**
 * 当前阶段
 */
const stage = ref<ExportStage>('config')

/**
 * 导出格式
 */
const exportFormat = ref<ExportFormat>('json')

/**
 * 时间范围类型
 */
const timeRangeType = ref<TimeRangeType>('all')

/**
 * 自定义开始日期
 */
const customStartDate = ref('')

/**
 * 自定义结束日期
 */
const customEndDate = ref('')

/**
 * 消息类型筛选
 */
const messageTypeFilter = ref<'all' | 'text' | 'withMedia'>('all')

/**
 * 导出进度（0-100）
 */
const progress = ref(0)

/**
 * 已处理消息数
 */
const processedCount = ref(0)

/**
 * 估计总消息数
 */
const totalEstimate = ref(0)

/**
 * 预计剩余时间（秒）
 */
const estimatedTimeRemaining = ref(0)

/**
 * 错误信息
 */
const errorMessage = ref('')

/**
 * 导出的文件名
 */
const exportedFilename = ref('')

/**
 * 导出开始时间
 */
const exportStartTime = ref<Date | null>(null)

/**
 * AbortController 用于取消导出
 */
let abortController: AbortController | null = null

// ==================== Computed ====================

/**
 * 对话框标题
 */
const dialogTitle = computed(() => {
  switch (stage.value) {
    case 'config':
      return '导出聊天记录'
    case 'progress':
      return '正在导出...'
    case 'complete':
      return '导出完成'
    case 'error':
      return '导出失败'
    default:
      return '导出聊天记录'
  }
})

/**
 * 时间范围验证
 */
const isTimeRangeValid = computed(() => {
  if (timeRangeType.value !== 'custom') {
    return true
  }
  if (!customStartDate.value || !customEndDate.value) {
    return false
  }
  const start = dayjs(customStartDate.value)
  const end = dayjs(customEndDate.value)
  return start.isValid() && end.isValid() && !start.isAfter(end)
})

/**
 * 是否可以开始导出
 */
const canStartExport = computed(() => {
  return isTimeRangeValid.value && !!props.sessionId
})

/**
 * 预计剩余时间文本
 */
const estimatedTimeText = computed(() => {
  if (estimatedTimeRemaining.value <= 0) {
    return '计算中...'
  }
  if (estimatedTimeRemaining.value < 60) {
    return `${Math.ceil(estimatedTimeRemaining.value)} 秒`
  }
  const minutes = Math.ceil(estimatedTimeRemaining.value / 60)
  return `${minutes} 分钟`
})

/**
 * 当前时间范围参数
 */
const currentTimeRange = computed(() => {
  const now = dayjs()

  switch (timeRangeType.value) {
    case 'last7Days':
      return `${now.subtract(7, 'day').format('YYYY-MM-DD')}~${now.format('YYYY-MM-DD')}`
    case 'last30Days':
      return `${now.subtract(30, 'day').format('YYYY-MM-DD')}~${now.format('YYYY-MM-DD')}`
    case 'custom':
      if (customStartDate.value && customEndDate.value) {
        return `${customStartDate.value}~${customEndDate.value}`
      }
      return now.format('YYYY-MM-DD')
    case 'all':
    default:
      // 返回一个很大的时间范围（从2010-01-01到今天），覆盖所有可能的微信聊天记录
      return `2010-01-01~${now.format('YYYY-MM-DD')}`
  }
})

// ==================== Methods ====================

/**
 * 关闭对话框
 */
function handleClose() {
  if (stage.value === 'progress' && abortController) {
    // 如果在导出中，先取消
    handleCancel()
  }
  emit('update:visible', false)
  emit('close')
  resetState()
}

/**
 * 重置状态
 */
function resetState() {
  stage.value = 'config'
  exportFormat.value = 'json'
  timeRangeType.value = 'all'
  customStartDate.value = ''
  customEndDate.value = ''
  messageTypeFilter.value = 'all'
  progress.value = 0
  processedCount.value = 0
  totalEstimate.value = 0
  estimatedTimeRemaining.value = 0
  errorMessage.value = ''
  exportedFilename.value = ''
  exportStartTime.value = null
  abortController = null
}

/**
 * 开始导出
 */
async function handleStartExport() {
  if (!canStartExport.value || !props.sessionId) {
    return
  }

  stage.value = 'progress'
  exportStartTime.value = new Date()
  abortController = new AbortController()

  try {
    const timeRange = currentTimeRange.value

    // 调用 API 导出数据
    const messages = await chatlogAPI.exportWithProgress(props.sessionId, timeRange, {
      signal: abortController.signal,
      onProgress: handleProgressUpdate,
    })

    // 根据消息类型筛选
    const filteredMessages = filterMessagesByType(messages)

    // 根据格式导出
    await exportMessages(filteredMessages)

    // 导出成功
    stage.value = 'complete'
    emit('success')
  } catch (error) {
    console.error('导出失败:', error)
    if (error instanceof Error && error.message === '导出已取消') {
      // 用户取消，不显示错误
      handleClose()
    } else {
      errorMessage.value = error instanceof Error ? error.message : '导出失败，请重试'
      stage.value = 'error'
    }
  }
}

/**
 * 处理进度更新
 */
function handleProgressUpdate(current: number, total: number) {
  processedCount.value = current
  totalEstimate.value = total
  progress.value = total > 0 ? Math.round((current / total) * 100) : 0

  // 计算预计剩余时间
  if (exportStartTime.value && current > 0) {
    const elapsed = (Date.now() - exportStartTime.value.getTime()) / 1000
    const rate = current / elapsed
    const remaining = (total - current) / rate
    estimatedTimeRemaining.value = Math.max(0, remaining)
  }
}

/**
 * 根据类型筛选消息
 */
function filterMessagesByType(messages: Message[]): Message[] {
  switch (messageTypeFilter.value) {
    case 'text':
      return messages.filter(msg => msg.type === 1 && msg.content)
    case 'withMedia':
      return messages.filter(msg => msg.type === 1 || msg.fileUrl)
    case 'all':
    default:
      return messages
  }
}

/**
 * 导出消息到文件
 */
async function exportMessages(messages: Message[]) {
  const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss')
  const safeSessionName = (props.sessionName || '聊天记录').replace(/[\\/:*?"<>|]/g, '_')

  switch (exportFormat.value) {
    case 'json':
      exportedFilename.value = `${safeSessionName}_聊天记录_${timestamp}.json`
      downloadJSON(messages, exportedFilename.value.replace('.json', ''))
      break
    case 'txt':
      exportedFilename.value = `${safeSessionName}_聊天记录_${timestamp}.txt`
      const textContent = formatMessagesAsText(messages)
      downloadText(textContent, exportedFilename.value.replace('.txt', ''))
      break
    case 'markdown':
      exportedFilename.value = `${safeSessionName}_聊天记录_${timestamp}.md`
      const markdownContent = formatMessagesAsMarkdown(messages, safeSessionName)
      downloadMarkdown(markdownContent, exportedFilename.value.replace('.md', ''))
      break
    case 'csv':
      // CSV 格式通过后端直接下载
      exportedFilename.value = `${safeSessionName}_聊天记录_${timestamp}.csv`
      await chatlogAPI.exportCSV(
        { talker: props.sessionId!, time: currentTimeRange.value },
        exportedFilename.value
      )
      break
  }
}

/**
 * 取消导出
 */
function handleCancel() {
  if (abortController) {
    abortController.abort()
  }
}

/**
 * 重试导出
 */
function handleRetry() {
  stage.value = 'config'
  errorMessage.value = ''
}

// ==================== Watch ====================

/**
 * 监听对话框可见性
 */
watch(
  () => props.visible,
  newVal => {
    if (!newVal) {
      // 对话框关闭时重置状态
      setTimeout(resetState, 300)
    }
  }
)
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="500px"
    :close-on-click-modal="stage !== 'progress'"
    :show-close="stage !== 'progress'"
    :close-on-press-escape="stage !== 'progress'"
    @close="handleClose"
  >
    <!-- 配置阶段 -->
    <template v-if="stage === 'config'">
      <div class="export-config">
        <!-- 导出格式 -->
        <div class="config-section">
          <label class="section-label">导出格式</label>
          <el-radio-group v-model="exportFormat" class="format-group">
            <el-radio-button value="json">JSON</el-radio-button>
            <el-radio-button value="csv">CSV</el-radio-button>
            <el-radio-button value="txt">TXT</el-radio-button>
            <el-radio-button value="markdown">Markdown</el-radio-button>
          </el-radio-group>
          <p class="format-desc">
            <template v-if="exportFormat === 'json'"
              >导出为结构化 JSON 文件，包含完整消息信息</template
            >
            <template v-else-if="exportFormat === 'csv'">导出为 CSV 表格，便于 Excel 分析</template>
            <template v-else-if="exportFormat === 'markdown'"
              >导出为 Markdown 格式，适合文档编辑和笔记软件</template
            >
            <template v-else>导出为纯文本格式，便于阅读</template>
          </p>
        </div>

        <!-- 时间范围 -->
        <div class="config-section">
          <label class="section-label">时间范围</label>
          <el-select v-model="timeRangeType" class="time-range-select">
            <el-option label="全部消息" value="all" />
            <el-option label="最近7天" value="last7Days" />
            <el-option label="最近30天" value="last30Days" />
            <el-option label="自定义范围" value="custom" />
          </el-select>

          <!-- 自定义日期选择 -->
          <div v-if="timeRangeType === 'custom'" class="custom-date-range">
            <el-date-picker
              v-model="customStartDate"
              type="date"
              placeholder="开始日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              class="date-picker"
            />
            <span class="date-separator">至</span>
            <el-date-picker
              v-model="customEndDate"
              type="date"
              placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              class="date-picker"
            />
          </div>

          <p v-if="!isTimeRangeValid && timeRangeType === 'custom'" class="error-hint">
            请选择有效的日期范围
          </p>
        </div>

        <!-- 消息类型 -->
        <div class="config-section">
          <label class="section-label">消息类型</label>
          <el-radio-group v-model="messageTypeFilter">
            <el-radio value="all">全部类型</el-radio>
            <el-radio value="text">仅文本消息</el-radio>
            <el-radio value="withMedia">包含媒体引用</el-radio>
          </el-radio-group>
        </div>
      </div>
    </template>

    <!-- 进度阶段 -->
    <template v-else-if="stage === 'progress'">
      <div class="export-progress">
        <el-progress
          :percentage="progress"
          :stroke-width="12"
          :status="progress === 100 ? 'success' : ''"
        />

        <div class="progress-info">
          <p class="progress-text">已处理 {{ processedCount }} / {{ totalEstimate }} 条消息</p>
          <p class="time-remaining">预计剩余时间: {{ estimatedTimeText }}</p>
        </div>
      </div>
    </template>

    <!-- 完成阶段 -->
    <template v-else-if="stage === 'complete'">
      <div class="export-complete">
        <el-result icon="success" title="导出成功">
          <template #sub-title>
            <p>文件 "{{ exportedFilename }}" 已下载</p>
            <p class="file-info">共导出 {{ processedCount }} 条消息</p>
          </template>
        </el-result>
      </div>
    </template>

    <!-- 错误阶段 -->
    <template v-else-if="stage === 'error'">
      <div class="export-error">
        <el-result icon="error" title="导出失败">
          <template #sub-title>
            <p>{{ errorMessage }}</p>
            <p class="error-hint">请检查网络连接或尝试缩小时间范围后重试</p>
          </template>
        </el-result>
      </div>
    </template>

    <!-- 底部按钮 -->
    <template #footer>
      <!-- 配置阶段按钮 -->
      <template v-if="stage === 'config'">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :disabled="!canStartExport" @click="handleStartExport">
          开始导出
        </el-button>
      </template>

      <!-- 进度阶段按钮 -->
      <template v-else-if="stage === 'progress'">
        <el-button @click="handleCancel">取消导出</el-button>
      </template>

      <!-- 完成阶段按钮 -->
      <template v-else-if="stage === 'complete'">
        <el-button @click="handleClose">关闭</el-button>
      </template>

      <!-- 错误阶段按钮 -->
      <template v-else-if="stage === 'error'">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleRetry">重试</el-button>
      </template>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.export-config {
  padding: 10px 0;
}

.config-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-label {
  display: block;
  margin-bottom: 12px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.format-group {
  display: flex;
  gap: 8px;
}

.format-desc {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.time-range-select {
  width: 100%;
}

.custom-date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.date-picker {
  flex: 1;
}

.date-separator {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.error-hint {
  margin-top: 8px;
  color: var(--el-color-danger);
  font-size: 12px;
}

.export-progress {
  padding: 20px 0;
}

.progress-info {
  margin-top: 16px;
  text-align: center;
}

.progress-text {
  font-size: 14px;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.time-remaining {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.export-complete,
.export-error {
  padding: 20px 0;
}

.file-info {
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
