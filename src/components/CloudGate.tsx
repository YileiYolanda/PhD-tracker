import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { parseData, snapshot } from '../lib/trackerData'
import { SyncEngine } from '../lib/syncEngine'
import type { Cache, SyncView } from '../lib/syncEngine'
import { useAppStore } from '../stores/appStore'
import { AccountScope } from '../lib/accountScope'

const button = 'rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50'
const initialView: SyncView = { ready: false, status: 'loading', message: '正在读取云端数据…', pending: false }

function downloadLocal() {
  downloadBackup(useAppStore.getState().exportData())
}

function downloadBackup(json: string) {
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `phd-tracker-local-${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  return <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
    <form className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 space-y-5" onSubmit={async e => {
      e.preventDefault()
      setBusy(true)
      setMessage('')
      try {
        const result = mode === 'login'
          ? await supabase!.auth.signInWithPassword({ email, password })
          : await supabase!.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
        if (result.error) throw result.error
        if (mode === 'register' && !result.data.session) setMessage('请查收验证邮件，验证邮箱后返回这里登录。')
      } catch (error) { setMessage(error instanceof Error ? error.message : '操作失败，请重试') }
      finally { setBusy(false) }
    }}>
      <h1 className="text-2xl font-bold">博士申请管理器</h1>
      <p className="text-slate-400 text-sm">登录同一账号，在不同设备上查看和更新申请进度。</p>
      <label className="block text-sm">邮箱<input className="mt-2 w-full rounded-lg bg-slate-800 p-3" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label className="block text-sm">密码<input className="mt-2 w-full rounded-lg bg-slate-800 p-3" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} value={password} onChange={e => setPassword(e.target.value)} /></label>
      <p className="text-xs text-slate-400">注册密码至少 8 位。</p>
      {message && <p role="alert" className="text-sm text-amber-300">{message}</p>}
      <button disabled={busy} className={`${button} w-full`}>{busy ? '请稍候…' : mode === 'login' ? '登录' : '注册账号'}</button>
      <button disabled={busy} type="button" className="text-sm text-indigo-300" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage('') }}>{mode === 'login' ? '还没有账号？注册' : '已有账号？登录'}</button>
    </form>
  </div>
}

function AccountWorkspace({ session, children }: { session: Session; children: React.ReactNode }) {
  const [view, setView] = useState(initialView)
  const [engine, setEngine] = useState<SyncEngine | null>(null)
  const [error, setError] = useState('')
  const [recoveryKeys, setRecoveryKeys] = useState<string[]>([])
  const [legacyAvailable, setLegacyAvailable] = useState(() => Boolean(localStorage.getItem('phd-tracker-storage')))

  useEffect(() => {
    let applying = false
    let unsubscribe = () => {}
    let worker: SyncEngine
    try {
      // Separate each tab's outbox so two open tabs cannot overwrite unsent edits.
      let tab = sessionStorage.getItem('phd-tracker-tab')
      if (!tab) { tab = crypto.randomUUID(); sessionStorage.setItem('phd-tracker-tab', tab) }
      const cacheKey = `phd-tracker-cloud:${session.user.id}:${tab}`
      const otherPending: string[] = []
      for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index)!
        if (key !== cacheKey && key.startsWith(`phd-tracker-cloud:${session.user.id}:`)) {
          try { if (JSON.parse(localStorage.getItem(key)!).pending) otherPending.push(key) }
          catch { otherPending.push(key) }
        }
      }
      setRecoveryKeys(otherPending)
      const raw = localStorage.getItem(cacheKey)
      let cache: Cache | undefined
      if (raw) {
        const parsed = JSON.parse(raw)
        if (!Number.isSafeInteger(parsed.version) || parsed.version < 0 || typeof parsed.pending !== 'boolean') throw new Error('本机同步缓存格式异常，请保留浏览器数据并联系维护者')
        cache = { ...parsed, data: parseData(parsed.data) }
      }
      worker = new SyncEngine({
        read: async () => {
          const { data, error } = await supabase!.from('tracker_snapshots').select('data, version').eq('user_id', session.user.id).abortSignal(AbortSignal.timeout(15000)).maybeSingle()
          if (error) throw new Error(error.message)
          return data
        },
        save: async (version, data) => {
          const result = await supabase!.rpc('save_tracker', { expected_version: version, payload: data }).abortSignal(AbortSignal.timeout(15000))
          if (result.error) throw new Error(result.error.message)
          return result.data?.[0] ?? null
        },
        persist: cache => localStorage.setItem(cacheKey, JSON.stringify(cache)),
        apply: data => {
          applying = true
          useAppStore.setState(data)
          applying = false
        },
        notify: setView,
      }, cache)
      unsubscribe = useAppStore.subscribe(state => { if (!applying) worker.edit(snapshot(state)) })
      setEngine(worker)
      void worker.tick()
    } catch (error) {
      setError(error instanceof Error ? error.message : '无法读取本机缓存')
      return
    }
    const refresh = () => { void worker.tick() }
    const interval = window.setInterval(refresh, 3000)
    window.addEventListener('online', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      worker.stop()
      unsubscribe()
      clearInterval(interval)
      window.removeEventListener('online', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [session.user.id])

  useEffect(() => {
    if (!view.pending) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [view.pending])

  return <div className="flex h-screen flex-col overflow-hidden">
    <div className="shrink-0 max-h-[45vh] overflow-y-auto border-b border-slate-700 bg-slate-900 px-6 py-3 space-y-2">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-slate-300">{session.user.email}</span>
        <span role="status" className={view.status === 'saved' ? 'text-emerald-300' : 'text-amber-300'}>{view.message}</span>
        <button className="text-indigo-300" onClick={() => void engine?.tick()}>立即同步</button>
        <button className="ml-auto text-slate-400" onClick={async () => {
          if (view.pending && !confirm('仍有未同步的修改。建议先导出备份；退出后可在本浏览器重新登录继续同步。确定退出吗？')) return
          const { error } = await supabase!.auth.signOut({ scope: 'local' })
          if (error) setError(error.message)
        }}>退出登录</button>
      </div>
      {error && <p role="alert" className="text-red-300 text-sm">{error}</p>}
      {recoveryKeys.length > 0 && <div className="text-sm text-amber-200">
        检测到其他窗口留下的未同步副本。若原窗口已关闭，可下载后参考备份补回修改。
        {recoveryKeys.map((key, index) => <button key={key} className="ml-3 text-indigo-300" onClick={() => {
          const raw = localStorage.getItem(key)
          if (!raw) { setError('该副本已不存在'); return }
          try { downloadBackup(JSON.stringify(parseData(JSON.parse(raw).data), null, 2)) }
          catch { downloadBackup(raw) }
        }}>下载副本 {index + 1}</button>)}
      </div>}
      {view.status === 'conflict' && <div role="alert" className="text-sm text-amber-200 space-x-3">
        <span>为避免覆盖其他设备的修改，请先保存本机副本，再载入云端；需要的改动可参考备份重新填写。</span>
        <button className={button} onClick={() => { downloadLocal(); void engine?.useCloud() }}>导出本机副本并载入云端</button>
      </div>}
      {view.ready && legacyAvailable && <div className="text-sm text-slate-300 flex flex-wrap gap-3 items-center">
        <span>发现升级前的本机数据，可导入当前账号。原始本机备份会保留。</span>
        <button className="text-indigo-300" onClick={() => {
          if (!confirm('这会用升级前的本机数据替换当前账号的数据，并同步到其他设备。建议先导出当前数据。继续吗？')) return
          try {
            const legacy = JSON.parse(localStorage.getItem('phd-tracker-storage')!)
            useAppStore.setState(parseData(legacy.state))
            setLegacyAvailable(false)
          } catch { setError('旧数据格式无法读取，请使用原有 JSON 备份导入') }
        }}>导入旧数据</button>
        <button className="text-slate-500" onClick={() => setLegacyAvailable(false)}>暂不导入</button>
      </div>}
    </div>
    {view.ready ? <AccountScope.Provider value={session.user.id}>{children}</AccountScope.Provider> : <div className="p-10 text-slate-400">登录后先读取云端数据，防止覆盖已有申请。连接失败时可点击「立即同步」重试。</div>}
  </div>
}

export default function CloudGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoaded(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])
  if (!supabase) return <div className="flex h-screen flex-col overflow-hidden"><div className="shrink-0 bg-amber-950 px-6 py-2 text-sm text-amber-200">本机模式 · 尚未配置云服务，数据仅保存在当前浏览器。请按 README 连接 Supabase。</div>{children}</div>
  if (!loaded) return <div className="p-10">正在检查登录状态…</div>
  if (!session) return <Login />
  return <AccountWorkspace key={session.user.id} session={session}>{children}</AccountWorkspace>
}
