import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { currentDatetimeString, toDatetimeString } from '@atproto/lex'
import OrganizerShell from '../../components/OrganizerShell'
import { useAuth } from '../../auth/AuthProvider'
import { useLexClient } from '../../lib/lexClient'
import { r } from '../../lib/lex'
import { adminEventPath } from '../../lib/eventUri'
import { cn } from '../../lib/cn'
import { buttonPrimary, eyebrow } from '../../lib/ui'

const linkButton = 'text-[11px] text-[#647253] underline'
const card = 'mt-[17px] border border-line bg-[#fcfbf6] px-7 py-[25px] max-sm:px-[17px] max-sm:py-[19px]'
const cardHeading = 'mb-[22px] flex items-center justify-between'
const cardTitle = 'mt-1.5 text-lg font-medium'
const field = 'flex flex-col gap-2 text-xs'
const control = 'min-h-11 w-full border border-[#cdd3be] bg-[#faf9f3] px-3 py-2.5 text-[13px] text-ink'
const hint = 'text-[10px] font-normal text-muted'
const tag = 'w-max px-[7px] py-[3px] text-[9px]'

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
      const blob = image ? (await client.uploadBlob(image)).body.blob : undefined
      const record = r.event.$parse({ $type: r.event.$type, name: name.trim(), ...(description.trim() ? { description: description.trim() } : {}), startsAt: toDatetimeString(new Date(startsAt)), endsAt: toDatetimeString(new Date(endsAt)), approver: approver.trim(), createdAt: currentDatetimeString(), ...(blob ? { image: blob } : {}) })
      const result = await client.create(r.event, record)
      // appview への反映を待つために created を渡す (AdminEventLayout が再試行する)
      navigate(adminEventPath(result.uri), { state: { created: true } })
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'イベントを作成できませんでした') }
    finally { setBusy(false) }
  }

  return <OrganizerShell>
    <main id="main" className="mx-auto max-w-[790px] px-6 pt-[30px] pb-[60px] max-sm:px-[15px] max-sm:pt-[22px] max-sm:pb-[38px]"><Link className="mb-7 inline-block text-xs text-[#6b765e]" to="/admin">← 管理画面へ戻る</Link><p className={eyebrow}>ORGANIZER / EVENT RECORD</p><h1 className="my-2.5 text-[34px] font-medium tracking-[2px] max-sm:text-[28px]">イベントを作成</h1><p className="mt-2 mb-[26px] text-xs leading-[1.8] text-muted">イベント情報を入力し、主催者アカウントのPDSにevent recordを保存します。</p>
      <section className={card}><div className={cardHeading}><div><p className={eyebrow}>01 / PDS ACCOUNT</p><h2 className={cardTitle}>主催者アカウント</h2></div><span className="border border-[#d6d3c5] bg-[#e6ecde] px-2.5 py-1.5 text-[10px] text-olive">接続中</span></div>
        <div className="grid grid-cols-[1fr_auto] gap-[7px] text-xs"><strong className="[overflow-wrap:anywhere]">{client.assertDid}</strong><span className="col-start-1 text-[10px] text-muted">このアカウントのPDSに保存します</span><button type="button" className={linkButton} onClick={() => void signOut()}>ログアウト</button></div>
      </section>
      <form onSubmit={submit} className={cn(card, 'flex flex-col gap-4')}><div className={cardHeading}><div><p className={eyebrow}>02 / EVENT DETAILS</p><h2 className={cardTitle}>イベント情報</h2></div></div>
        <label className={field}>イベント名 <span className={cn(tag, 'bg-[#f1e7df] text-[#8c6049]')}>必須</span><input className={control} required maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="例：代々木ロゲイニング 2026" /></label>
        <label className={field}>説明<textarea className={cn(control, 'resize-y leading-[1.7]')} rows={5} maxLength={3000} value={description} onChange={e => setDescription(e.target.value)} placeholder="イベント概要や参加者への案内"/><small className={hint}>{description.length} / 3000文字</small></label>
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1"><label className={field}>開始日時<input className={control} required type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} /></label><label className={field}>終了日時<input className={control} required type="datetime-local" min={startsAt} value={endsAt} onChange={e => setEndsAt(e.target.value)} /></label></div>
        <label className={field}>承認者のDID <span className={cn(tag, 'bg-[#f1e7df] text-[#8c6049]')}>必須</span><input className={control} required pattern="did:[a-z0-9]+:[A-Za-z0-9._:%-]+" value={approver} onChange={e => setApprover(e.target.value)} placeholder="did:plc:…"/><small className={hint}>ログイン中のDIDを初期値にしています。</small></label>
        <label className={field}>イベント画像 <span className={cn(tag, 'bg-[#efefe5] text-muted')}>任意</span><input className="p-2" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setImage(e.target.files?.[0] ?? null)} /><small className={hint}>JPEG / PNG / WebP、最大1MB</small></label>
        {image && <p className="flex justify-between text-[11px] text-[#59674e]">{image.name}<button type="button" className={linkButton} onClick={() => setImage(null)}>削除</button></p>}
        {error && <p className="border-l-3 border-[#9b614b] bg-[#f2e7df] px-3.5 py-3 text-xs leading-[1.6] text-[#774b39] [overflow-wrap:anywhere]" role="alert">{error}</p>}
        <div className="mt-1.5 flex items-center justify-between gap-3.5 border-t border-line pt-[18px] max-sm:flex-col max-sm:items-stretch"><span className="text-[10px] text-muted [overflow-wrap:anywhere]">保存先: {client.assertDid}</span><button className={cn(buttonPrimary, 'whitespace-nowrap max-sm:w-full')} disabled={busy}>{busy ? '作成中…' : 'イベントレコードを作成'}</button></div>
      </form>
    </main>
  </OrganizerShell>
}
