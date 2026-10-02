import { emptyData, parseData, sameData } from './trackerData.ts'
import type { TrackerData } from './trackerData.ts'

export interface RemoteSnapshot { data: TrackerData; version: number }
export interface Cache extends RemoteSnapshot { pending: boolean }
export interface SyncView {
  ready: boolean
  status: 'loading' | 'saved' | 'pending' | 'syncing' | 'error' | 'conflict'
  message: string
  pending: boolean
}
export interface SyncIO {
  read: () => Promise<RemoteSnapshot | null>
  save: (version: number, data: TrackerData) => Promise<RemoteSnapshot | null>
  persist: (cache: Cache) => void
  apply: (data: TrackerData) => void
  notify: (view: SyncView) => void
}

// One serialized worker per tab. Cache the edit before attempting the network write.
export class SyncEngine {
  private cache: Cache
  private io: SyncIO
  private busy = false
  private stopped = false
  private ready = false
  private conflict = false
  private hasCache: boolean

  constructor(io: SyncIO, cached?: Cache) {
    this.io = io
    this.hasCache = Boolean(cached)
    this.cache = cached ?? { data: emptyData(), version: 0, pending: false }
  }

  private show(status: SyncView['status'], message: string) {
    if (!this.stopped) this.io.notify({ ready: this.ready, status, message, pending: this.cache.pending })
  }

  edit(data: TrackerData) {
    if (!this.ready || this.stopped || sameData(data, this.cache.data)) return
    this.cache = { ...this.cache, data, pending: true }
    try {
      this.io.persist(this.cache)
      this.show(this.conflict ? 'conflict' : 'pending', this.conflict ? '其他设备也修改了数据，请先处理冲突' : '有更改待同步')
    } catch {
      this.show(this.conflict ? 'conflict' : 'error', '本机缓存写入失败，请保持页面打开并立即导出备份')
    }
  }

  async tick() {
    if (this.busy || this.stopped || this.conflict) return
    this.busy = true
    this.show(this.ready ? 'syncing' : 'loading', '正在同步…')
    try {
      // Also retry cache writes after a quota/storage error.
      if (this.cache.pending) this.io.persist(this.cache)
      const remote = await this.io.read()
      if (this.stopped) return
      const current = remote ?? { data: emptyData(), version: 0 }
      current.data = parseData(current.data)
      if (this.cache.pending && current.version !== this.cache.version) {
        if (sameData(current.data, this.cache.data)) {
          this.cache = { ...current, pending: false } // Handles a successful write whose response was lost.
        } else {
          this.ready = true
          this.conflict = true
          this.io.apply(this.cache.data)
          this.show('conflict', '其他设备也修改了数据，已暂停上传以保护两份内容')
          return
        }
      } else if (!this.cache.pending) {
        this.cache = { ...current, pending: false }
      }
      this.ready = true
      this.io.apply(this.cache.data)
      this.io.persist(this.cache)
      this.hasCache = true
      if (this.cache.pending) {
        const sent = this.cache.data
        const saved = await this.io.save(this.cache.version, sent)
        if (this.stopped) return
        if (!saved) {
          this.conflict = true
          this.show('conflict', '同步期间其他设备提交了修改，已暂停上传')
          return
        }
        this.cache = { data: this.cache.data, version: saved.version, pending: !sameData(sent, this.cache.data) }
        this.io.persist(this.cache)
      }
      this.show(this.cache.pending ? 'pending' : 'saved', this.cache.pending ? '有更改待同步' : '已与云端同步')
    } catch (error) {
      if (this.stopped) return
      if (!this.ready && this.hasCache) {
        this.ready = true
        this.io.apply(this.cache.data)
      }
      this.show('error', `同步失败，保留本机数据：${error instanceof Error ? error.message : '请检查网络后重试'}`)
    } finally {
      this.busy = false
    }
  }

  // Explicitly discard the pending local copy only after the user has downloaded it.
  async useCloud() {
    if (this.busy || this.stopped) return
    this.busy = true
    try {
      const remote = await this.io.read()
      if (this.stopped) return
      const next = { ...(remote ?? { data: emptyData(), version: 0 }), pending: false }
      next.data = parseData(next.data)
      this.io.persist(next)
      this.cache = next
      this.conflict = false
      this.ready = true
      this.io.apply(this.cache.data)
      this.show('saved', '已载入云端版本；本机修改已导出，请按需补回')
    } catch (error) {
      this.show('conflict', `读取云端失败：${error instanceof Error ? error.message : '请重试'}`)
    } finally {
      this.busy = false
    }
  }

  stop() { this.stopped = true }
}
