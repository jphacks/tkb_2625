import { useState } from 'react'
import type { FormEvent } from 'react'
import './event-create.css'

type Session = { did: string; accessJwt: string; pds: string }
const pdsDefault = 'https://bsky.social'
const localDateTime = (value: Date) => new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

export function EventCreatePage() {
  const [pds, setPds] = useState(pdsDefault)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [session, setSession] = useState<Session | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState(localDateTime(new Date()))
  const [endsAt, setEndsAt] = useState(localDateTime(new Date(Date.now() + 86400000)))
  const [approver, setApprover] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      const host = pds.trim().replace(/\/+$/, '')
      const response = await fetch(`${host}/xrpc/com.atproto.server.createSession`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ identifier: identifier.trim(), password }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'PDSへのログインに失敗しました')
      setSession({ did: result.did, accessJwt: result.accessJwt, pds: host }); setApprover(result.did); setPassword(''); setNotice(`${result.did} でログインしました`)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'ログインに失敗しました') }
    finally { setBusy(false) }
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!session) return
    setBusy(true); setError(''); setNotice('')
    try {
      let blob: unknown
      if (image) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type) || image.size > 1_000_000) throw new Error('画像はJPEG / PNG / WebP、1MB以下にしてください')
        const upload = await fetch(`${session.pds}/xrpc/com.atproto.repo.uploadBlob`, { method: 'POST', headers: { authorization: `Bearer ${session.accessJwt}`, 'content-type': image.type }, body: image })
        const result = await upload.json()
        if (!upload.ok) throw new Error(result.message || '画像をアップロードできませんでした')
        blob = result.blob
      }
      const record = { $type: 'win.tomo-x.rogaining.event', name: name.trim(), ...(description.trim() ? { description: description.trim() } : {}), startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString(), approver: approver.trim(), createdAt: new Date().toISOString(), ...(blob ? { image: blob } : {}) }
      const response = await fetch(`${session.pds}/xrpc/com.atproto.repo.createRecord`, { method: 'POST', headers: { authorization: `Bearer ${session.accessJwt}`, 'content-type': 'application/json' }, body: JSON.stringify({ repo: session.did, collection: 'win.tomo-x.rogaining.event', record }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'イベントレコードを作成できませんでした')
      setNotice(`イベントをPDSに作成しました: ${result.uri}`); setName(''); setDescription(''); setImage(null)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'イベントを作成できませんでした') }
    finally { setBusy(false) }
  }

  return <div className="organizer-shell">
    <header className="organizer-header"><a href="/admin"><strong>AtRogaining</strong><small>ORGANIZER CONSOLE</small></a><span>EVENT MANAGEMENT</span></header>
    <main className="event-create-page"><a className="back-link" href="/admin">← 管理画面へ戻る</a><p className="eyebrow">ORGANIZER / EVENT RECORD</p><h1>イベントを作成</h1><p className="intro">イベント情報を入力し、主催者アカウントのPDSにevent recordを保存します。</p>
      <section className="account-card"><div className="card-heading"><div><p className="eyebrow">01 / PDS ACCOUNT</p><h2>{session ? 'PDSに接続済み' : '主催者アカウント'}</h2></div><span className={session ? 'connection on' : 'connection'}>{session ? '接続中' : '未接続'}</span></div>
        {session ? <div className="session-info"><strong>{session.did}</strong><span>{session.pds}</span><button type="button" className="link-button" onClick={() => { setSession(null); setApprover(''); setNotice('ログアウトしました') }}>ログアウト</button></div> : <form onSubmit={login} className="account-form"><label>PDS URL<input type="url" required value={pds} onChange={e => setPds(e.target.value)} /></label><label>ハンドルまたはDID<input autoComplete="username" required value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="you.bsky.social" /></label><label>アプリパスワード<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label><button className="button" disabled={busy}>{busy ? '接続中…' : 'PDSにログイン'}</button><small>パスワードはログイン後に破棄し、ブラウザーには保存しません。</small></form>}
      </section>
      <form onSubmit={submit} className="event-form"><div className="card-heading"><div><p className="eyebrow">02 / EVENT DETAILS</p><h2>イベント情報</h2></div></div>
        <label>イベント名 <span className="required">必須</span><input required maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="例：代々木ロゲイニング 2026" /></label>
        <label>説明<textarea rows={5} maxLength={3000} value={description} onChange={e => setDescription(e.target.value)} placeholder="イベント概要や参加者への案内"/><small>{description.length} / 3000文字</small></label>
        <div className="date-fields"><label>開始日時<input required type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} /></label><label>終了日時<input required type="datetime-local" min={startsAt} value={endsAt} onChange={e => setEndsAt(e.target.value)} /></label></div>
        <label>承認者のDID <span className="required">必須</span><input required pattern="did:[a-z0-9]+:[A-Za-z0-9._:%-]+" value={approver} onChange={e => setApprover(e.target.value)} placeholder="did:plc:…"/><small>ログイン中のDIDを初期値にしています。</small></label>
        <label>イベント画像 <span className="optional">任意</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setImage(e.target.files?.[0] ?? null)} /><small>JPEG / PNG / WebP、最大1MB</small></label>
        {image && <p className="chosen-file">{image.name}<button type="button" className="link-button" onClick={() => setImage(null)}>削除</button></p>}
        {error && <p className="feedback error" role="alert">{error}</p>}{notice && <p className="feedback" role="status">{notice}</p>}
        <div className="submit-row"><span>{session ? `保存先: ${session.pds}` : '作成するにはPDSにログインしてください'}</span><button className="button primary" disabled={!session || busy}>{busy ? '作成中…' : 'イベントレコードを作成'}</button></div>
      </form>
    </main><footer className="organizer-footer">AtRogaining <span>ORGANIZER TOOLS</span></footer>
  </div>
}
