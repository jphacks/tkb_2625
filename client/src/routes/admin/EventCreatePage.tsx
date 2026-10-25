import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { currentDatetimeString, toDatetimeString } from '@atproto/lex'
import OrganizerShell from '../../components/OrganizerShell'
import { useAuth } from '../../auth/AuthProvider'
import { useLexClient } from '../../lib/lexClient'
import { r } from '../../lib/lex'
import { adminEventPath } from '../../lib/eventUri'
import { resolveDid } from '../../lib/identity'
import { cn } from '../../lib/cn'
import { buttonPrimary, errorPanel, fieldLabel, input, mainContainer, textarea, textButton } from '../../lib/ui'
import { HelpButton } from '../../components/SiteChrome'

const localDateTime = (value: Date) => new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

export default function EventCreatePage() {
  const client = useLexClient()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState(localDateTime(new Date()))
  const [endsAt, setEndsAt] = useState(localDateTime(new Date(Date.now() + 86400000)))
  const [approver, setApprover] = useState<string>(client.assertDid)
  const [image, setImage] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      if (image && (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type) || image.size > 1_000_000)) throw new Error('画像はJPEG / PNG / WebP、1MB以下にしてください')
      const approverDid = await resolveDid(client, approver.trim().replace(/^@/, ''))
      const blob = image ? (await client.uploadBlob(image)).body.blob : undefined
      const record = r.event.$parse({ $type: r.event.$type, name: name.trim(), ...(description.trim() ? { description: description.trim() } : {}), startsAt: toDatetimeString(new Date(startsAt)), endsAt: toDatetimeString(new Date(endsAt)), approver: approverDid, createdAt: currentDatetimeString(), ...(blob ? { image: blob } : {}) })
      const result = await client.create(r.event, record)
      // appview への反映を待つために created を渡す (AdminEventLayout が再試行する)
      navigate(adminEventPath(result.uri), { state: { created: true } })
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'イベントを作成できませんでした') }
    finally { setBusy(false) }
  }

  return <OrganizerShell>
    <main id="main" className={cn(mainContainer, 'max-w-[640px]')}>
      <div className="mb-3 flex items-center justify-between gap-3"><h1 className="flex items-center gap-2 text-[15px] font-bold">イベントを作成<HelpButton title="イベントの作成"><p>イベント情報を、ログイン中の主催者アカウントのPDSにevent recordとして保存します。</p><p>承認者には審査botのハンドルまたはDIDを指定します。</p><p>イベント画像はJPEG / PNG / WebP、最大1MBです。</p></HelpButton></h1><Link className={textButton} to="/admin">← 一覧へ戻る</Link></div>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label><span className={fieldLabel}>イベント名 (必須)</span><input className={input} required maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="例：代々木ロゲイニング 2026" /></label>
        <label><span className={fieldLabel}>説明 <span className="font-normal">{description.length} / 3000</span></span><textarea className={cn(textarea, 'resize-y')} rows={4} maxLength={3000} value={description} onChange={e => setDescription(e.target.value)} placeholder="イベント概要や参加者への案内"/></label>
        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1"><label><span className={fieldLabel}>開始日時</span><input className={input} required type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} /></label><label><span className={fieldLabel}>終了日時</span><input className={input} required type="datetime-local" min={startsAt} value={endsAt} onChange={e => setEndsAt(e.target.value)} /></label></div>
        <label><span className={fieldLabel}>承認者 (必須)</span><input className={input} required autoCapitalize="none" spellCheck={false} value={approver} onChange={e => setApprover(e.target.value)} placeholder="alice.bsky.social / did:plc:…"/></label>
        <label><span className={fieldLabel}>イベント画像 (任意)</span><input className="block w-full text-[13px]" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setImage(e.target.files?.[0] ?? null)} /></label>
        {image && <p className="flex items-center justify-between text-xs">{image.name}<button type="button" className={textButton} onClick={() => setImage(null)}>削除</button></p>}
        {error && <p className={cn(errorPanel, '[overflow-wrap:anywhere]')} role="alert">{error}</p>}
        <div className="flex items-center justify-between gap-3 border-t border-fg/10 pt-3 max-sm:flex-col max-sm:items-stretch"><span className="text-[11px] text-fg/60 [overflow-wrap:anywhere]">保存先: {client.assertDid} <button type="button" className={textButton} onClick={() => void signOut()}>ログアウト</button></span><button className={cn(buttonPrimary, 'max-sm:w-full')} disabled={busy}>{busy ? '作成中…' : 'イベントを作成'}</button></div>
      </form>
    </main>
  </OrganizerShell>
}
