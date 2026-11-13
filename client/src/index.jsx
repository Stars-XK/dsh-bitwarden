import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const NS = 'dsh-bitwarden'

const TYPE_KEY = { 1: 'type.login', 2: 'type.note', 3: 'type.card', 4: 'type.identity' }

const CSS = `
.dsh-bw { display:flex; flex-direction:column; gap:14px; }
.dsh-bw-bar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.dsh-bw-badge { display:inline-flex; align-items:center; gap:6px; font-size:12px; padding:3px 10px; border-radius:999px; border:1px solid var(--dsw-alias-border-l1); color:var(--dsw-alias-label-secondary); }
.dsh-bw-dot { width:7px; height:7px; border-radius:50%; background:var(--dsw-alias-state-idle-primary); }
.dsh-bw-dot.on { background:var(--dsw-alias-state-success-primary); }
.dsh-bw-dot.warn { background:var(--dsw-alias-state-warn-primary); }
.dsh-bw-dot.err { background:var(--dsw-alias-state-error-primary); }
.dsh-bw-spacer { flex:1; }
.dsh-bw-btn { display:inline-flex; align-items:center; gap:6px; font-size:13px; line-height:1; padding:7px 12px; border-radius:8px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); cursor:pointer; }
.dsh-bw-btn:hover { border-color:var(--dsw-alias-border-l2); }
.dsh-bw-btn:disabled { opacity:.5; cursor:default; }
.dsh-bw-btn.primary { background:var(--dsw-alias-brand-primary); border-color:var(--dsw-alias-brand-primary); color:#fff; }
.dsh-bw-btn.ghost { background:transparent; }
.dsh-bw-btn.danger { color:var(--dsw-alias-state-error-primary); }
.dsh-bw-btn.sm { padding:5px 9px; font-size:12px; }
.dsh-bw-body { display:grid; grid-template-columns:minmax(210px,264px) minmax(0,1fr); gap:12px; align-items:start; }
.dsh-bw-pane { border:1px solid var(--dsw-alias-border-l1); border-radius:10px; background:var(--dsw-alias-bg-layer-1); overflow:hidden; }
.dsh-bw-search { display:flex; gap:6px; padding:9px; border-bottom:1px solid var(--dsw-alias-border-l1); }
.dsh-bw-input { width:100%; box-sizing:border-box; font-size:13px; padding:7px 9px; border-radius:7px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-base); color:var(--dsw-alias-label-primary); outline:none; }
.dsh-bw-input:focus { border-color:var(--dsw-alias-brand-primary); }
.dsh-bw-chips { display:flex; gap:5px; padding:0 9px 8px; flex-wrap:wrap; }
.dsh-bw-chip { font-size:12px; padding:3px 8px; border-radius:999px; border:1px solid var(--dsw-alias-border-l1); color:var(--dsw-alias-label-secondary); background:transparent; cursor:pointer; }
.dsh-bw-chip.on { border-color:var(--dsw-alias-brand-primary); color:var(--dsw-alias-brand-primary); }
.dsh-bw-list { max-height:440px; overflow:auto; }
.dsh-bw-item { display:block; width:100%; text-align:left; padding:9px 11px; border:0; border-bottom:1px solid var(--dsw-alias-border-l1); background:transparent; cursor:pointer; color:var(--dsw-alias-label-primary); }
.dsh-bw-item:hover { background:var(--dsw-alias-bg-layer-2); }
.dsh-bw-item.on { background:var(--dsw-alias-bg-layer-2); box-shadow:inset 3px 0 0 var(--dsw-alias-brand-primary); }
.dsh-bw-item-name { font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.dsh-bw-item-sub { font-size:12px; color:var(--dsw-alias-label-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px; }
.dsh-bw-empty { padding:22px 12px; text-align:center; font-size:12px; color:var(--dsw-alias-label-secondary); }
.dsh-bw-detail { padding:14px; }
.dsh-bw-title { font-size:15px; font-weight:600; margin:0 0 2px; word-break:break-all; }
.dsh-bw-sub { font-size:12px; color:var(--dsw-alias-label-secondary); margin-bottom:12px; }
.dsh-bw-field { display:flex; align-items:center; gap:8px; padding:7px 0; border-bottom:1px dashed var(--dsw-alias-border-l1); }
.dsh-bw-label { width:64px; flex:none; font-size:12px; color:var(--dsw-alias-label-secondary); }
.dsh-bw-value { flex:1; min-width:0; font-size:13px; word-break:break-all; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
.dsh-bw-form { display:flex; flex-direction:column; gap:10px; padding:14px; }
.dsh-bw-form-row { display:flex; flex-direction:column; gap:4px; }
.dsh-bw-form-label { font-size:12px; color:var(--dsw-alias-label-secondary); }
.dsh-bw-notice { font-size:12px; padding:8px 10px; border-radius:8px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-2); }
.dsh-bw-notice.err { border-color:var(--dsw-alias-state-error-primary); color:var(--dsw-alias-state-error-primary); }
.dsh-bw-notice.ok { border-color:var(--dsw-alias-state-success-primary); color:var(--dsw-alias-state-success-primary); }
.dsh-bw-audit { max-height:360px; overflow:auto; font-size:12px; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
.dsh-bw-audit-row { padding:5px 10px; border-bottom:1px solid var(--dsw-alias-border-l1); display:flex; gap:8px; }
.dsh-bw-audit-at { color:var(--dsw-alias-label-secondary); flex:none; }
.dsh-bw-hint { font-size:12px; color:var(--dsw-alias-label-secondary); line-height:1.6; }
@media (max-width:640px){ .dsh-bw-body { grid-template-columns:1fr; } }
`

function Btn({ children, primary, ghost, danger, sm, ...rest }) {
  const cls = ['dsh-bw-btn', primary ? 'primary' : '', ghost ? 'ghost' : '', danger ? 'danger' : '', sm ? 'sm' : '']
    .filter(Boolean).join(' ')
  return <button type="button" className={cls} {...rest}>{children}</button>
}

function Field({ label, value, mono = true, actions }) {
  return (
    <div className="dsh-bw-field">
      <span className="dsh-bw-label">{label}</span>
      <span className="dsh-bw-value" style={mono ? undefined : { fontFamily: 'inherit' }}>{value}</span>
      {actions}
    </div>
  )
}

function VaultSection({ rpcCall, t }) {
  const [status, setStatus] = useState(null)
  const [items, setItems] = useState([])
  const [folders, setFolders] = useState([])
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const [view, setView] = useState('vault')
  const [loginForm, setLoginForm] = useState({ serverUrl: '', email: '', password: '', remember: true })
  const [unlockPassword, setUnlockPassword] = useState('')
  const [createForm, setCreateForm] = useState({ name: '', username: '', password: '', uris: '', notes: '' })
  const [prefs, setPrefs] = useState({ idleLockMinutes: 15, autoUnlock: true, auditEnabled: true })
  const [audit, setAudit] = useState([])
  const searchTimer = useRef(null)

  const call = useCallback(async (endpoint, payload) => {
    const res = await rpcCall(endpoint, payload ?? {})
    if (res && typeof res === 'object' && 'ok' in res) {
      if (res.ok) return res.value
      throw new Error(res.error?.message ?? '请求失败')
    }
    return res
  }, [rpcCall])

  const setOk = (text) => setNotice({ kind: 'ok', text })
  const setErr = (text) => setNotice({ kind: 'err', text: String(text?.message ?? text) })

  const refreshStatus = useCallback(async () => {
    try {
      const next = await call('status')
      setStatus(next)
      setPrefs({
        idleLockMinutes: next.idleLockMinutes ?? 15,
        autoUnlock: next.autoUnlock !== false,
        auditEnabled: next.auditEnabled !== false,
      })
      if (!loginForm.serverUrl && next.serverUrl) {
        setLoginForm((prev) => ({ ...prev, serverUrl: next.serverUrl }))
      }
      if (!loginForm.email && next.email) {
        setLoginForm((prev) => ({ ...prev, email: next.email }))
      }
      return next
    } catch (error) {
      setErr(error)
      return null
    }
  }, [call, loginForm.serverUrl, loginForm.email])

  const loadItems = useCallback(async (nextQuery, nextType) => {
    setBusy(true)
    try {
      const res = await call('list', { query: nextQuery, type: nextType })
      setItems(res?.items ?? [])
      setNotice(null)
    } catch (error) {
      setItems([])
      setErr(error)
    } finally {
      setBusy(false)
    }
  }, [call])

  const loadFolders = useCallback(async () => {
    try {
      const res = await call('folders')
      setFolders(Array.isArray(res) ? res : [])
    } catch {
      setFolders([])
    }
  }, [call])

  const loadAudit = useCallback(async () => {
    try {
      const res = await call('audit', { limit: 200 })
      setAudit(res?.entries ?? [])
    } catch (error) {
      setErr(error)
    }
  }, [call])

  const openDetail = useCallback(async (id) => {
    setSelectedId(id)
    setRevealed(false)
    setDetail(null)
    if (!id) return
    setBusy(true)
    try {
      setDetail(await call('reveal', { id }))
    } catch (error) {
      setErr(error)
    } finally {
      setBusy(false)
    }
  }, [call])

  useEffect(() => {
    refreshStatus().then(async (next) => {
      if (next && (next.status === 'unlocked' || next.cliStatus === 'unlocked' || next.hasMasterPassword)) {
        await loadItems('', 'all')
        loadFolders()
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!status) return
    if (status.cliStatus === 'unauthenticated') setView('login')
    else if (view === 'login') setView('vault')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.cliStatus])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      if (status && status.cliStatus !== 'unauthenticated') loadItems(query, typeFilter)
    }, 260)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [query, typeFilter, status?.cliStatus])

  const copy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value ?? '')
      setOk(t('copied', { label }))
    } catch (error) {
      setErr(error)
    }
  }

  const doLogin = async () => {
    setBusy(true)
    try {
      const next = await call('connect', loginForm)
      setStatus(next)
      setLoginForm((prev) => ({ ...prev, password: '' }))
      setView('vault')
      setOk(t('connected'))
      await loadItems('', 'all')
      loadFolders()
    } catch (error) {
      setErr(error)
    } finally {
      setBusy(false)
    }
  }

  const doUnlock = async (useSaved) => {
    setBusy(true)
    try {
      const next = await call(useSaved ? 'unlockSaved' : 'unlock', useSaved ? {} : { password: unlockPassword })
      setStatus(next)
      setUnlockPassword('')
      setOk(t('unlocked'))
      await loadItems(query, typeFilter)
    } catch (error) {
      setErr(error)
    } finally {
      setBusy(false)
    }
  }

  const doLock = async () => {
    setBusy(true)
    try {
      setStatus(await call('lock'))
      setDetail(null)
      setSelectedId(null)
      setOk(t('locked'))
    } catch (error) {
      setErr(error)
    } finally {
      setBusy(false)
    }
  }

  const doSync = async () => {
    setBusy(true)
    try {
      setStatus(await call('sync'))
      await loadItems(query, typeFilter)
      setOk(t('synced'))
    } catch (error) {
      setErr(error)
    } finally {
      setBusy(false)
    }
  }

  const doCreate = async () => {
    setBusy(true)
    try {
      await call('create', {
        name: createForm.name,
        username: createForm.username,
        password: createForm.password,
        uris: createForm.uris.split(/[\s,]+/).filter(Boolean),
        notes: createForm.notes,
      })
      setCreateForm({ name: '', username: '', password: '', uris: '', notes: '' })
      setView('vault')
      setOk(t('created'))
      await loadItems(query, typeFilter)
    } catch (error) {
      setErr(error)
    } finally {
      setBusy(false)
    }
  }

  const doDelete = async () => {
    if (!detail?.id) return
    const yes = window.confirm(t('confirmDelete', { name: detail.name }))
    if (!yes) return
    setBusy(true)
    try {
      await call('delete', { id: detail.id })
      setDetail(null)
      setSelectedId(null)
      setOk(t('deleted'))
      await loadItems(query, typeFilter)
    } catch (error) {
      setErr(error)
    } finally {
      setBusy(false)
    }
  }

  const savePrefs = async (patch) => {
    const next = { ...prefs, ...patch }
    setPrefs(next)
    try {
      await call('saveSettings', next)
    } catch (error) {
      setErr(error)
    }
  }

  const forgetMaster = async () => {
    const yes = window.confirm(t('confirmForget'))
    if (!yes) return
    try {
      await call('forgetMaster')
      await refreshStatus()
      setOk(t('forgotten'))
    } catch (error) {
      setErr(error)
    }
  }

  const statusLabel = useMemo(() => {
    if (!status) return t('status.loading')
    if (status.cliStatus === 'unauthenticated') return t('status.unauthenticated')
    if (status.status === 'unlocked') return t('status.unlocked')
    if (status.cliStatus === 'locked') return t('status.locked')
    return t('status.unknown')
  }, [status, t])

  const dotClass = useMemo(() => {
    if (!status) return 'dsh-bw-dot'
    if (status.cliStatus === 'unauthenticated') return 'dsh-bw-dot err'
    if (status.status === 'unlocked') return 'dsh-bw-dot on'
    return 'dsh-bw-dot warn'
  }, [status])

  const filtered = items
  const authed = Boolean(status && status.cliStatus !== 'unauthenticated')

  return (
    <div className="dsh-bw">
      <style>{CSS}</style>

      <div className="dsh-bw-bar">
        <span className="dsh-bw-badge"><span className={dotClass} />{statusLabel}</span>
        {status?.email ? <span className="dsh-bw-badge">{status.email}</span> : null}
        {status?.serverUrl ? <span className="dsh-bw-badge">{status.serverUrl}</span> : null}
        <span className="dsh-bw-spacer" />
        {view !== 'vault' ? <Btn sm ghost onClick={() => setView('vault')}>{t('nav.vault')}</Btn> : null}
        {view !== 'create' ? <Btn sm onClick={() => setView('create')}>{t('nav.create')}</Btn> : null}
        {view !== 'settings' ? <Btn sm onClick={() => setView('settings')}>{t('nav.settings')}</Btn> : null}
        {view !== 'audit' ? <Btn sm onClick={() => { setView('audit'); loadAudit() }}>{t('nav.audit')}</Btn> : null}
        {status && status.cliStatus !== 'unauthenticated' ? (
          <Btn sm onClick={doSync} disabled={busy}>{t('action.sync')}</Btn>
        ) : null}
        {status && status.status === 'unlocked' ? (
          <Btn sm onClick={doLock} disabled={busy}>{t('action.lock')}</Btn>
        ) : null}
      </div>

      {notice ? <div className={`dsh-bw-notice ${notice.kind}`}>{notice.text}</div> : null}

      {!authed ? (
        <div className="dsh-bw-pane">
          <div className="dsh-bw-form">
            <div className="dsh-bw-hint">{t('login.hint')}</div>
            <div className="dsh-bw-form-row">
              <span className="dsh-bw-form-label">{t('login.server')}</span>
              <input className="dsh-bw-input" value={loginForm.serverUrl} placeholder="https://vault.example.com"
                onChange={(e) => setLoginForm({ ...loginForm, serverUrl: e.target.value })} />
            </div>
            <div className="dsh-bw-form-row">
              <span className="dsh-bw-form-label">{t('login.email')}</span>
              <input className="dsh-bw-input" value={loginForm.email} autoComplete="username"
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
            </div>
            <div className="dsh-bw-form-row">
              <span className="dsh-bw-form-label">{t('login.password')}</span>
              <input className="dsh-bw-input" type="password" value={loginForm.password} autoComplete="current-password"
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') doLogin() }} />
            </div>
            <label className="dsh-bw-hint" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={loginForm.remember}
                onChange={(e) => setLoginForm({ ...loginForm, remember: e.target.checked })} />
              {t('login.remember')}
            </label>
            <div>
              <Btn primary onClick={doLogin} disabled={busy}>{t('login.submit')}</Btn>
            </div>
          </div>
        </div>
      ) : null}

      {authed && view === 'vault' && status.status !== 'unlocked' ? (
        <div className="dsh-bw-pane">
          <div className="dsh-bw-form">
            <div className="dsh-bw-hint">{t('locked.hint')}</div>
            {status.hasMasterPassword ? (
              <div><Btn primary onClick={() => doUnlock(true)} disabled={busy}>{t('locked.useSaved')}</Btn></div>
            ) : null}
            <div className="dsh-bw-form-row">
              <span className="dsh-bw-form-label">{t('locked.password')}</span>
              <input className="dsh-bw-input" type="password" value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') doUnlock(false) }} />
            </div>
            <div><Btn onClick={() => doUnlock(false)} disabled={busy}>{t('locked.submit')}</Btn></div>
          </div>
        </div>
      ) : null}

      {authed && view === 'vault' && status.status === 'unlocked' ? (
        <div className="dsh-bw-body">
          <div className="dsh-bw-pane">
            <div className="dsh-bw-search">
              <input className="dsh-bw-input" value={query} placeholder={t('search.placeholder')}
                onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="dsh-bw-chips">
              {['all', 'login', 'note', 'card', 'identity'].map((key) => (
                <button key={key} type="button"
                  className={`dsh-bw-chip ${typeFilter === key ? 'on' : ''}`}
                  onClick={() => setTypeFilter(key)}>
                  {t(key === 'all' ? 'filter.all' : `type.${key}`)}
                </button>
              ))}
            </div>
            <div className="dsh-bw-list">
              {filtered.length === 0 ? (
                <div className="dsh-bw-empty">{busy ? t('list.loading') : t('list.empty')}</div>
              ) : filtered.map((item) => (
                <button key={item.id} type="button"
                  className={`dsh-bw-item ${selectedId === item.id ? 'on' : ''}`}
                  onClick={() => openDetail(item.id)}>
                  <div className="dsh-bw-item-name">{item.name || t('list.untitled')}</div>
                  <div className="dsh-bw-item-sub">
                    {[item.username, item.uris?.[0], t(TYPE_KEY[item.type] ?? 'type.login')]
                      .filter(Boolean).join(' · ')}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="dsh-bw-pane">
            {!detail ? (
              <div className="dsh-bw-empty">{t('detail.empty')}</div>
            ) : (
              <div className="dsh-bw-detail">
                <h4 className="dsh-bw-title">{detail.name || t('list.untitled')}</h4>
                <div className="dsh-bw-sub">{t(TYPE_KEY[detail.type] ?? 'type.login')}</div>

                {detail.login?.username !== undefined ? (
                  <Field label={t('field.username')} value={detail.login.username || '—'}
                    actions={detail.login.username ? <Btn sm ghost onClick={() => copy(detail.login.username, t('field.username'))}>{t('action.copy')}</Btn> : null} />
                ) : null}

                {detail.login?.password !== undefined ? (
                  <Field label={t('field.password')} value={revealed ? (detail.login.password || '—') : '••••••••••'}
                    actions={(
                      <>
                        <Btn sm ghost onClick={() => setRevealed((prev) => !prev)}>{revealed ? t('action.hide') : t('action.show')}</Btn>
                        <Btn sm ghost onClick={() => copy(detail.login.password, t('field.password'))}>{t('action.copy')}</Btn>
                      </>
                    )} />
                ) : null}

                {Array.isArray(detail.login?.uris) && detail.login.uris.length ? detail.login.uris.map((uri, index) => (
                  <Field key={`${uri.uri}-${index}`} label={t('field.uri')} value={uri.uri || '—'}
                    actions={uri.uri ? <Btn sm ghost onClick={() => window.open(uri.uri, '_blank', 'noopener')}>{t('action.open')}</Btn> : null} />
                )) : null}

                {detail.notes ? (
                  <Field label={t('field.notes')} mono={false} value={detail.notes} />
                ) : null}

                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <Btn sm danger onClick={doDelete} disabled={busy}>{t('action.delete')}</Btn>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {authed && view === 'create' ? (
        <div className="dsh-bw-pane">
          <div className="dsh-bw-form">
            <div className="dsh-bw-hint">{t('create.hint')}</div>
            <div className="dsh-bw-form-row">
              <span className="dsh-bw-form-label">{t('create.name')}</span>
              <input className="dsh-bw-input" value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
            </div>
            <div className="dsh-bw-form-row">
              <span className="dsh-bw-form-label">{t('field.username')}</span>
              <input className="dsh-bw-input" value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })} />
            </div>
            <div className="dsh-bw-form-row">
              <span className="dsh-bw-form-label">{t('field.password')}</span>
              <input className="dsh-bw-input" value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
            </div>
            <div className="dsh-bw-form-row">
              <span className="dsh-bw-form-label">{t('field.uri')}</span>
              <input className="dsh-bw-input" value={createForm.uris} placeholder="https://..."
                onChange={(e) => setCreateForm({ ...createForm, uris: e.target.value })} />
            </div>
            <div className="dsh-bw-form-row">
              <span className="dsh-bw-form-label">{t('field.notes')}</span>
              <input className="dsh-bw-input" value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn primary onClick={doCreate} disabled={busy || !createForm.name.trim()}>{t('create.submit')}</Btn>
              <Btn ghost onClick={() => setView('vault')}>{t('action.cancel')}</Btn>
            </div>
          </div>
        </div>
      ) : null}

      {authed && view === 'settings' ? (
        <div className="dsh-bw-pane">
          <div className="dsh-bw-form">
            <div className="dsh-bw-form-row">
              <span className="dsh-bw-form-label">{t('prefs.idle')}</span>
              <input className="dsh-bw-input" type="number" min="0" max="240" value={prefs.idleLockMinutes}
                onChange={(e) => savePrefs({ idleLockMinutes: Number(e.target.value) })} />
              <span className="dsh-bw-hint">{t('prefs.idleHint')}</span>
            </div>
            <label className="dsh-bw-hint" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={prefs.autoUnlock}
                onChange={(e) => savePrefs({ autoUnlock: e.target.checked })} />
              {t('prefs.autoUnlock')}
            </label>
            <label className="dsh-bw-hint" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={prefs.auditEnabled}
                onChange={(e) => savePrefs({ auditEnabled: e.target.checked })} />
              {t('prefs.audit')}
            </label>
            <div className="dsh-bw-bar">
              <Btn danger onClick={forgetMaster}>{t('prefs.forget')}</Btn>
            </div>
            <div className="dsh-bw-hint">
              {t('prefs.dataDir')} {status?.dataDir ?? '—'}
            </div>
            <div className="dsh-bw-hint">
              {t('prefs.bw')} {status?.bwScript ?? t('prefs.bwMissing')}
            </div>
          </div>
        </div>
      ) : null}

      {authed && view === 'audit' ? (
        <div className="dsh-bw-pane">
          <div className="dsh-bw-audit">
            {audit.length === 0 ? <div className="dsh-bw-empty">{t('audit.empty')}</div> : audit.map((entry, index) => (
              <div className="dsh-bw-audit-row" key={`${entry.at}-${index}`}>
                <span className="dsh-bw-audit-at">{String(entry.at ?? '').replace('T', ' ').slice(0, 19)}</span>
                <span>{entry.action}{entry.name ? ` · ${entry.name}` : ''}{entry.result ? ` · ${entry.result}` : ''}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

const ZH = {
  section: '密码库',
  'status.loading': '读取中…',
  'status.unauthenticated': '未登录',
  'status.locked': '已锁定',
  'status.unlocked': '已解锁',
  'status.unknown': '未知',
  'nav.vault': '密码库',
  'nav.create': '新建条目',
  'nav.settings': '偏好',
  'nav.audit': '审计',
  'action.sync': '同步',
  'action.lock': '锁定',
  'action.copy': '复制',
  'action.show': '显示',
  'action.hide': '隐藏',
  'action.open': '打开',
  'action.delete': '删除条目',
  'action.cancel': '取消',
  'login.hint': '连接 Bitwarden / Vaultwarden。主密码保存在系统凭据存储中，不会写进配置文件。',
  'login.server': '服务器地址',
  'login.email': '邮箱',
  'login.password': '主密码',
  'login.remember': '保存主密码以便自动解锁',
  'login.submit': '登录并解锁',
  'locked.hint': '密码库已锁定。',
  'locked.useSaved': '用已保存的主密码解锁',
  'locked.password': '主密码',
  'locked.submit': '解锁',
  'search.placeholder': '搜索名称、用户名或网址',
  'filter.all': '全部',
  'list.loading': '加载中…',
  'list.empty': '没有匹配的条目',
  'list.untitled': '未命名',
  'detail.empty': '从左侧选择一个条目查看详情',
  'field.username': '用户名',
  'field.password': '密码',
  'field.uri': '网址',
  'field.notes': '备注',
  'create.hint': '新建一条登录条目。密码只进入密码库。',
  'create.name': '名称',
  'create.submit': '创建',
  'prefs.idle': '空闲自动锁定（分钟，0 表示不锁定）',
  'prefs.idleHint': '超过该时长没有访问时自动执行 bw lock 并丢弃会话密钥。',
  'prefs.autoUnlock': '允许 AI 在需要时用已保存的主密码自动解锁',
  'prefs.audit': '记录审计日志',
  'prefs.forget': '删除已保存的主密码',
  'prefs.dataDir': '数据目录：',
  'prefs.bw': 'bw 引擎：',
  'prefs.bwMissing': '未找到（请检查依赖安装）',
  'audit.empty': '暂无审计记录',
  'copied': '已复制{label}',
  'connected': '已连接并解锁',
  'unlocked': '已解锁',
  'locked': '已锁定',
  'synced': '已同步',
  'created': '条目已创建',
  'deleted': '条目已删除',
  'forgotten': '已删除保存的主密码',
  'confirmDelete': '确定删除「{name}」？该操作会同步到服务器。',
  'confirmForget': '删除已保存的主密码后，AI 将无法自动解锁。确定吗？',
  'type.login': '登录',
  'type.note': '笔记',
  'type.card': '银行卡',
  'type.identity': '身份',
}

const EN = {
  section: 'Vault',
  'status.loading': 'Loading…',
  'status.unauthenticated': 'Signed out',
  'status.locked': 'Locked',
  'status.unlocked': 'Unlocked',
  'status.unknown': 'Unknown',
  'nav.vault': 'Vault',
  'nav.create': 'New item',
  'nav.settings': 'Preferences',
  'nav.audit': 'Audit',
  'action.sync': 'Sync',
  'action.lock': 'Lock',
  'action.copy': 'Copy',
  'action.show': 'Show',
  'action.hide': 'Hide',
  'action.open': 'Open',
  'action.delete': 'Delete item',
  'action.cancel': 'Cancel',
  'login.hint': 'Connect Bitwarden / Vaultwarden. The master password is kept in the system credential store, never in configuration.',
  'login.server': 'Server URL',
  'login.email': 'Email',
  'login.password': 'Master password',
  'login.remember': 'Save the master password for automatic unlock',
  'login.submit': 'Sign in and unlock',
  'locked.hint': 'The vault is locked.',
  'locked.useSaved': 'Unlock with the saved master password',
  'locked.password': 'Master password',
  'locked.submit': 'Unlock',
  'search.placeholder': 'Search name, username or URL',
  'filter.all': 'All',
  'list.loading': 'Loading…',
  'list.empty': 'No matching item',
  'list.untitled': 'Untitled',
  'detail.empty': 'Pick an item on the left to see details',
  'field.username': 'Username',
  'field.password': 'Password',
  'field.uri': 'URL',
  'field.notes': 'Notes',
  'create.hint': 'Create a login item. The password goes straight into the vault.',
  'create.name': 'Name',
  'create.submit': 'Create',
  'prefs.idle': 'Idle auto-lock (minutes, 0 disables)',
  'prefs.idleHint': 'Runs bw lock and drops the session key after this much inactivity.',
  'prefs.autoUnlock': 'Let the agent auto-unlock with the saved master password',
  'prefs.audit': 'Record the audit log',
  'prefs.forget': 'Delete the saved master password',
  'prefs.dataDir': 'Data directory:',
  'prefs.bw': 'bw engine:',
  'prefs.bwMissing': 'not found (check dependencies)',
  'audit.empty': 'No audit entry yet',
  'copied': 'Copied {label}',
  'connected': 'Connected and unlocked',
  'unlocked': 'Unlocked',
  'locked': 'Locked',
  'synced': 'Synced',
  'created': 'Item created',
  'deleted': 'Item deleted',
  'forgotten': 'Saved master password deleted',
  'confirmDelete': 'Delete "{name}"? The change is synced to the server.',
  'confirmForget': 'Without the saved master password the agent cannot auto-unlock. Continue?',
  'type.login': 'Login',
  'type.note': 'Note',
  'type.card': 'Card',
  'type.identity': 'Identity',
}

export const inject = ['slots', 'locale']

async function rpcCall(endpoint, payload) {
  const response = await fetch('/dsh-bitwarden/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ endpoint, payload: payload ?? {} }),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return data
}

function apply(ctx) {
  const translate = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, { zh: ZH, en: EN }), 'dsh-bitwarden: dictionaries')
  ctx.slots.inject('settings.section', () => ctx.slots.register(
    {
      name: 'settings.section',
      id: 'dsh-bitwarden',
      order: 32,
      label: () => translate('section'),
      inject: () => ({ rpcCall, t: translate }),
    },
    VaultSection,
  ))
}

export { apply, VaultSection }
