import { useState } from 'react'
import type { FormEvent } from 'react'
import { currentDatetimeString, toDatetimeString } from '@atproto/lex'
import { useAuth } from './auth/AuthProvider'
import { useLexClient } from './lexClient'
import { r } from './lex'
import './event-create.css'

const localDateTime = (value: Date) => new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

export function EventCreatePage() {
  const client = useLexClient()
  const { signOut } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState(localDateTime(new Date()))
  const [endsAt, setEndsAt] = useState(localDateTime(new Date(Date.now() + 86400000)))
  const [approver, setApprover] = useState<string>(client.assertDid)
  const [image, setImage] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true); setError(''); setNotice('')
    try {
      if (image && (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type) || image.size > 1_000_000)) throw new Error('画像はJPEG / PNG / WebP、1MB以下にしてください')
      const blob = image ? (await client.uploadBlob(image)).body.blob : undefined
      const record = r.event.$parse({ $type: r.event.$type, name: name.trim(), ...(description.trim() ? { description: description.trim() } : {}), startsAt: toDatetimeString(new Date(startsAt)), endsAt: toDatetimeString(new Date(endsAt)), approver: approver.trim(), createdAt: currentDatetimeString(), ...(blob ? { image: blob } : {}) })
      const result = await client.create(r.event, record)
      setNotice(`イベントをPDSに作成しました: ${result.uri}`); setName(''); setDescription(''); setImage(null)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'イベントを作成できませんでした') }
    finally { setBusy(false) }
  }

  return <div className="organizer-shell">
    <header className="organizer-header"><a href="/admin"><strong>AtRogaining</strong><small>ORGANIZER CONSOLE</small></a><span>EVENT MANAGEMENT</span></header>
    <main className="event-create-page"><a className="back-link" href="/admin">← 管理画面へ戻る</a><p className="eyebrow">ORGANIZER / EVENT RECORD</p><h1>イベントを作成</h1><p className="intro">イベント情報を入力し、主催者アカウントのPDSにevent recordを保存します。</p>
      <section className="account-card"><div className="card-heading"><div><p className="eyebrow">01 / PDS ACCOUNT</p><h2>主催者アカウント</h2></div><span className="connection on">接続中</span></div>
        <div className="session-info"><strong>{client.assertDid}</strong><span>このアカウントのPDSに保存します</span><button type="button" className="link-button" onClick={() => void signOut()}>ログアウト</button></div>
      </section>
      <form onSubmit={submit} className="event-form"><div className="card-heading"><div><p className="eyebrow">02 / EVENT DETAILS</p><h2>イベント情報</h2></div></div>
        <label>イベント名 <span className="required">必須</span><input required maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="例：代々木ロゲイニング 2026" /></label>
        <label>説明<textarea rows={5} maxLength={3000} value={description} onChange={e => setDescription(e.target.value)} placeholder="イベント概要や参加者への案内"/><small>{description.length} / 3000文字</small></label>
        <div className="date-fields"><label>開始日時<input required type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} /></label><label>終了日時<input required type="datetime-local" min={startsAt} value={endsAt} onChange={e => setEndsAt(e.target.value)} /></label></div>
        <label>承認者のDID <span className="required">必須</span><input required pattern="did:[a-z0-9]+:[A-Za-z0-9._:%-]+" value={approver} onChange={e => setApprover(e.target.value)} placeholder="did:plc:…"/><small>ログイン中のDIDを初期値にしています。</small></label>
        <label>イベント画像 <span className="optional">任意</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setImage(e.target.files?.[0] ?? null)} /><small>JPEG / PNG / WebP、最大1MB</small></label>
        {image && <p className="chosen-file">{image.name}<button type="button" className="link-button" onClick={() => setImage(null)}>削除</button></p>}
        {error && <p className="feedback error" role="alert">{error}</p>}{notice && <p className="feedback" role="status">{notice}</p>}
        <div className="submit-row"><span>保存先: {client.assertDid}</span><button className="button primary" disabled={busy}>{busy ? '作成中…' : 'イベントレコードを作成'}</button></div>
      </form>
    </main><footer className="organizer-footer">AtRogaining <span>ORGANIZER TOOLS</span></footer>
  </div>
}
