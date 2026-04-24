/**
 * API 基类
 * 封装通用的请求方法、响应归一化和数据转换
 */

import { request } from '@/utils/request'

/**
 * API 基类
 * @template TBackend 后端响应数据类型
 * @template TFrontend 前端使用的数据类型
 */
export abstract class BaseAPI<TBackend = any, TFrontend = any> {
  /**
   * 资源路径，如 'chatlog', 'session', 'contact'
   * 子类必须实现
   */
  protected abstract resourcePath: string

  /**
   * API 基础路径，默认 '/api/v1'
   */
  protected apiBasePath: string = '/api/v1'

  /**
   * 完整资源 URL
   */
  protected get resourceUrl(): string {
    return `${this.apiBasePath}/${this.resourcePath}`
  }

  /**
   * 数据转换：后端数据 → 前端数据
   * 子类必须实现
   */
  protected abstract transform(data: TBackend): TFrontend

  /**
   * 批量数据转换
   */
  protected transformAll(data: TBackend[]): TFrontend[] {
    return data.map(item => this.transform(item))
  }

  /**
   * 响应归一化：处理 { items: [...] } 和直接数组两种格式
   * 后端可能返回 { items: [...], total: N } 或直接返回数组
   */
  protected normalizeItems(response: unknown): TBackend[] {
    if (response && typeof response === 'object' && 'items' in (response as object)) {
      const items = (response as { items: unknown }).items
      return Array.isArray(items) ? items as TBackend[] : []
    }
    if (Array.isArray(response)) {
      return response as TBackend[]
    }
    return []
  }

  /**
   * 响应归一化（带 total）：处理 { items: [...], total: N } 和直接数组
   */
  protected normalizeItemsWithTotal(response: unknown): { items: TBackend[]; total: number } {
    if (response && typeof response === 'object' && 'items' in (response as object)) {
      const obj = response as { items: unknown; total?: number }
      const items = Array.isArray(obj.items) ? obj.items as TBackend[] : []
      return { items, total: obj.total ?? items.length }
    }
    if (Array.isArray(response)) {
      const items = response as TBackend[]
      return { items, total: items.length }
    }
    return { items: [], total: 0 }
  }

  /**
   * 通用 GET 列表请求 + 转换
   */
  protected async getList(params?: Record<string, unknown>): Promise<TFrontend[]> {
    const response = await request.get<unknown>(this.resourceUrl, params)
    const items = this.normalizeItems(response)
    return this.transformAll(items)
  }

  /**
   * 通用 GET 单个资源 + 转换
   */
  protected async getDetail(id: string, params?: Record<string, unknown>): Promise<TFrontend> {
    const response = await request.get<TBackend>(
      `${this.resourceUrl}/${encodeURIComponent(id)}`,
      params
    )
    return this.transform(response)
  }

  /**
   * 批量请求多个资源
   */
  protected async batchGet(ids: string[]): Promise<TFrontend[]> {
    const promises = ids.map(id => this.getDetail(id))
    return request.all<TFrontend>(promises)
  }
}
