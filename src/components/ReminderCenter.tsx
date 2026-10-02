import { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, X } from 'lucide-react'
import { AccountScope } from '../lib/accountScope'
import { getReminders, localDay, pendingReminders, readHistory } from '../lib/reminders'
import type { Reminder, ReminderHistory } from '../lib/reminders'
import { useAppStore } from '../stores/appStore'

export default function ReminderCenter() {
  const scope = useContext(AccountScope)
  const navigate = useNavigate()
  const key = `phd-tracker-reminders:v1:${scope}`
  const preferenceKey = `${key}:desktop`
  const [items, setItems] = useState<Reminder[]>([])
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [message, setMessage] = useState('')
  const [dismissed, setDismissed] = useState<string[]>([])
  const fallback = useRef<ReminderHistory>(readHistory(null, localDay()))
  const storageUnavailable = useRef(false)
  const refresh = useRef<() => void>(() => {})
  const supported = typeof Notification !== 'undefined' && window.isSecureContext

  useEffect(() => {
    let disposed = false
    let busy = false
    const notifications = new Set<Notification>()
    const read = () => {
      if (storageUnavailable.current) return readHistory(JSON.stringify(fallback.current), localDay())
      try { return readHistory(localStorage.getItem(key), localDay()) }
      catch { return readHistory(JSON.stringify(fallback.current), localDay()) }
    }
    const write = (history: ReminderHistory) => {
      fallback.current = history
      try {
        const json = JSON.stringify(history)
        if (localStorage.getItem(key) !== json) localStorage.setItem(key, json)
      }
      catch { storageUnavailable.current = true; setMessage('无法保存提醒记录，刷新后可能再次提醒。') }
    }
    const check = () => {
      if (disposed || busy) return
      busy = true
      const run = () => {
        if (disposed) return
        const next = getReminders(useAppStore.getState())
        const history = read()
        let desktop = false
        try { desktop = localStorage.getItem(preferenceKey) === 'true' } catch { /* page reminders still work */ }
        setEnabled(desktop)
        setItems(next)
        setDismissed(history.dismissed)
        // Hidden pages defer in-page alerts until visible; desktop alerts may still be delivered.
        const fresh = pendingReminders(next, history, 'shown')
        if (document.visibilityState === 'visible' && fresh.length) {
          setToast(true)
          history.shown.push(...fresh.map(item => item.id))
        }
        if (!next.some(item => !history.dismissed.includes(item.id))) setToast(false)
        const pending = pendingReminders(next, history, 'notified')
        if (desktop && supported && Notification.permission === 'granted' && pending.length) {
          try {
            const notification = new Notification(`博士申请提醒 · ${pending.length} 项待办`, {
              body: pending.slice(0, 3).map(item => `${item.title}：${item.detail}`).join('\n'),
              tag: key,
            })
            notifications.add(notification)
            notification.onclick = () => { if (!disposed) { window.focus(); setOpen(true) }; notification.close() }
            notification.onclose = () => notifications.delete(notification)
            notification.onerror = () => { if (!disposed) setMessage('系统通知未能显示，请查看页面提醒，并检查浏览器或系统通知设置。') }
            history.notified.push(...pending.map(item => item.id))
          } catch { setMessage('当前浏览器无法显示系统通知，请使用页面提醒。') }
        }
        write(history)
      }
      // Serialize read/claim/delivery across tabs when Web Locks is available.
      const task = navigator.locks ? navigator.locks.request(key, run) : Promise.resolve().then(run)
      void task.catch(() => { if (!disposed) setMessage('提醒检查失败，请刷新页面重试。') }).finally(() => { busy = false })
    }
    refresh.current = check
    check()
    const unsubscribe = useAppStore.subscribe(check)
    const timer = window.setInterval(check, 60_000)
    const onStorage = (event: StorageEvent) => { if (event.key === key || event.key === preferenceKey) check() }
    window.addEventListener('focus', check)
    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', check)
    return () => {
      disposed = true
      unsubscribe()
      clearInterval(timer)
      window.removeEventListener('focus', check)
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', check)
      notifications.forEach(notification => notification.close())
    }
  }, [key, preferenceKey, supported])

  function dismiss(ids: string[]) {
    const run = () => {
      let history = readHistory(JSON.stringify(fallback.current), localDay())
      try { if (!storageUnavailable.current) history = readHistory(localStorage.getItem(key), localDay()) } catch { /* use memory */ }
      history.dismissed = [...new Set([...history.dismissed, ...ids])]
      fallback.current = history
      try { localStorage.setItem(key, JSON.stringify(history)) } catch { storageUnavailable.current = true; setMessage('无法保存提醒记录，刷新后可能再次提醒。') }
      setDismissed(history.dismissed)
      setToast(false)
    }
    void (navigator.locks ? navigator.locks.request(key, run) : Promise.resolve().then(run)).catch(() => setMessage('暂时无法保存，请重试。'))
  }

  async function toggleDesktop() {
    try {
      if (enabled) {
        localStorage.setItem(preferenceKey, 'false')
        setEnabled(false)
        setMessage('已关闭此浏览器中当前账号的系统通知，页面提醒继续显示。')
      } else {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          setMessage(permission === 'denied' ? '通知权限被禁止，可在浏览器的网站设置中允许；页面提醒仍然可用。' : '尚未允许通知，页面提醒仍然可用。')
          return
        }
        localStorage.setItem(preferenceKey, 'true')
        setEnabled(true)
        setMessage('已开启系统通知；请保持应用打开。')
        refresh.current()
      }
    } catch { setMessage('无法开启系统通知，请使用页面提醒。') }
  }

  const active = items.filter(item => !dismissed.includes(item.id))
  return <div className="relative ml-4">
    <button type="button" className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm text-amber-200 hover:bg-slate-700" aria-expanded={open} aria-controls="reminder-panel" onClick={() => { setOpen(!open); setToast(false) }}>
      <Bell className="h-4 w-4" />提醒 {active.length > 0 && <span className="rounded-full bg-red-500 px-2 text-white">{active.length}</span>}
    </button>
    {toast && !open && active.length > 0 && <div role="status" className="fixed bottom-6 right-6 z-40 w-80 max-w-[90vw] rounded-xl border border-amber-500/40 bg-slate-900 p-4 shadow-xl">
      <button type="button" aria-label="关闭提醒提示" className="float-right text-slate-400" onClick={() => setToast(false)}><X className="h-4 w-4" /></button>
      <p className="font-semibold text-amber-200">有 {active.length} 项申请事项需要关注</p>
      <p className="mt-2 text-sm text-slate-300">{active[0].title}</p>
      <button type="button" className="mt-3 text-sm text-indigo-300" onClick={() => { setOpen(true); setToast(false) }}>查看全部提醒 →</button>
    </div>}
    {open && <section id="reminder-panel" aria-label="提醒中心" className="absolute right-0 top-12 z-40 w-[420px] max-w-[85vw] max-h-[65vh] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl" onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }}>
      <div className="flex items-center justify-between"><h2 className="font-semibold">提醒中心</h2><button aria-label="关闭提醒中心" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button></div>
      <p className="mt-2 text-xs text-slate-400">应用打开时每分钟检查；同一事项每天提醒一次。关闭应用后不推送，下次打开会补查。</p>
      <div className="my-3 flex flex-wrap gap-3 text-sm">
        <button disabled={!supported} className="text-indigo-300 disabled:text-slate-500" onClick={() => void toggleDesktop()}>{!supported ? '当前环境不支持系统通知' : enabled ? '关闭系统通知' : '开启系统通知'}</button>
        {active.length > 0 && <button className="text-slate-300" onClick={() => dismiss(active.map(item => item.id))}>全部今天不再提醒</button>}
      </div>
      {message && <p role="status" className="mb-3 text-xs text-amber-200">{message}</p>}
      {!items.length && <p className="py-8 text-center text-sm text-slate-400">目前没有到期提醒</p>}
      <ul className="space-y-2">{items.map(item => <li key={item.id} className="rounded-lg bg-slate-800 p-3">
        <p className="text-sm font-medium text-slate-100">{item.title}</p>
        <p className="mt-1 text-xs text-amber-200">{item.detail}</p>
        <p className="mt-1 text-xs text-slate-400">提醒日期：{item.date}</p>
        <div className="mt-2 flex gap-4 text-xs"><button className="text-indigo-300" onClick={() => { navigate(item.to); setOpen(false) }}>前往处理</button>
          {dismissed.includes(item.id) ? <span className="text-slate-500">今天已忽略</span> : <button className="text-slate-400" onClick={() => dismiss([item.id])}>今天不再提醒</button>}
        </div>
      </li>)}</ul>
      <p className="mt-3 text-xs text-slate-500">提醒偏好与忽略记录仅保存在当前浏览器，按账号区分。导师跟进完成后，请清空或更新跟进日期。</p>
    </section>}
  </div>
}
