import { useState } from 'react';
import type { FormEvent } from 'react';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { currentDatetimeString, type DidString } from '@atproto/lex';
import { useAction } from '../../hooks/useAction';
import { cn } from '../../lib/cn';
import { resolveDids, splitIdentifiers } from '../../lib/identity';
import { r } from '../../lib/lex';
import { useLexClient } from '../../lib/lexClient';
import { approvedPoints, profileName, teamName, teamRecord } from '../../lib/rogaining';
import { button, buttonPrimary, empty, errorPanel, eyebrow, iconButton, notice as noticeBar } from '../../lib/ui';
import type { TeamView } from '../../lexicons/win/tomo-x/rogaining/defs';
import { atUriParts, useAdminEventContext } from './adminEventContext';

const MAX_MEMBERS = 100;

const form = 'border border-line bg-[#efefe5] p-6 max-sm:p-[18px]';
const fieldset = 'm-0 min-w-0 border-0 p-0';
const fieldLabel = 'flex min-w-0 flex-col gap-2 text-[11px] leading-[1.6]';
const input = 'min-h-11 w-full border border-[#cdd3be] bg-[#faf9f3] px-3 py-2.5 text-xs text-ink';
const hint = 'text-[9px] font-normal text-muted';
const teamCard = 'min-w-0 border border-line bg-[#fcfbf6] px-6 py-5 max-sm:px-5 max-sm:py-[15px]';
const avatar = 'grid size-[35px] shrink-0 place-items-center bg-[#e1e4d5] object-cover text-xs';
const danger = 'text-[#9b614b] hover:not-disabled:bg-[#efe0d5]';

export default function TeamsPage() {
  const { event, teams, checkpoints, submissions, isAuthor, me, refresh } = useAdminEventContext();
  const client = useLexClient();
  const { run, error, pending } = useAction();
  const [name, setName] = useState('');
  const [members, setMembers] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<string[]>([]);
  const visible = teams.filter(team => !deleted.includes(team.uri));

  // DID → 表示用プロフィール。チームの実効メンバーから集める
  const profiles = new Map(teams.flatMap(team => team.members.map(m => [m.did, m] as const)));
  const memberLabel = (did: string) => { const profile = profiles.get(did as DidString); return profile ? profileName(profile) : did; };
  const identifierOf = (did: string) => { const handle = profiles.get(did as DidString)?.handle; return handle && handle !== 'handle.invalid' ? handle : did; };

  /** 入力を DID に解決し、他チームとの重複を確認する */
  async function resolveMembers(text: string, self?: TeamView) {
    const identifiers = splitIdentifiers(text);
    if (!identifiers.length) throw new Error('メンバーを1人以上入力してください。');
    if (identifiers.length > MAX_MEMBERS) throw new Error(`メンバーは${MAX_MEMBERS}人までです。`);
    const dids = [...new Set(await resolveDids(client, identifiers))];
    const taken = dids.map(did => ({ did, team: visible.find(team => team !== self && team.members.some(m => m.did === did)) })).filter(entry => entry.team);
    if (taken.length && !window.confirm(`${taken.map(({ did, team }) => `${memberLabel(did)}（${teamName(team!)}）`).join('、')} は既に他のチームに所属しています。先に作成されたチームの所属が優先されますが、保存しますか？`)) return null;
    return dids;
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    setNotice('');
    let created = '';
    const ok = await run(async () => {
      const dids = await resolveMembers(members);
      if (!dids) return;
      const record = r.team.$parse({ $type: r.team.$type, event: { uri: event.uri, cid: event.cid }, name: name.trim(), members: dids, createdAt: currentDatetimeString() });
      await client.create(r.team, record);
      created = record.name;
    });
    if (!ok || !created) return;
    setNotice(`チーム「${created}」を作成しました。一覧への反映まで数秒かかることがあります。`);
    setName(''); setMembers('');
    refresh('event');
  }

  async function save(team: TeamView, nextName: string, text: string) {
    const { repo, rkey } = atUriParts(team.uri);
    if (repo !== me) { window.alert('このチームはログイン中のアカウントのPDSにないため編集できません。'); return false; }
    let saved = false;
    const ok = await run(async () => {
      const dids = await resolveMembers(text, team);
      if (!dids) return;
      const current = teamRecord(team);
      // createdAt は所属の優先順位に使われるので変えない
      const record = r.team.$parse({ $type: r.team.$type, event: current.event, name: nextName.trim(), members: dids, createdAt: current.createdAt });
      await client.put(r.team, record, { rkey });
      saved = true;
    });
    if (!ok || !saved) return false;
    setNotice(`チーム「${nextName.trim()}」を更新しました。反映まで数秒かかることがあります。`);
    refresh('event', 'submissions');
    return true;
  }

  async function remove(team: TeamView) {
    const { repo, rkey } = atUriParts(team.uri);
    if (repo !== me) { window.alert('このチームはログイン中のアカウントのPDSにないため削除できません。'); return; }
    if (!window.confirm(`${teamName(team)}を削除しますか？ メンバーの提出は無効になり、ランキングからも外れます。`)) return;
    if (!await run(() => client.delete(r.team, { rkey }))) return;
    setDeleted(previous => [...previous, team.uri]);
    setNotice(`${teamName(team)}を削除しました。`);
    refresh('event', 'submissions');
  }

  const keyword = query.trim().toLowerCase();
  const filtered = visible.filter(team => !keyword || [teamName(team), ...team.members.flatMap(m => [m.handle, m.displayName ?? '', m.did])].join(' ').toLowerCase().includes(keyword));

  return <section>
    <div className="mt-7 mb-5"><h3 className="text-xl font-medium tracking-[1px] max-sm:text-lg">チームと参加者</h3><p className="mt-[9px] text-[11px] leading-[1.9] text-muted max-sm:text-[10px]">チームは主催者のPDSに作成します。メンバーはハンドル（例：alice.bsky.social）またはDIDで、改行・カンマ区切りで入力してください。</p></div>
    {!isAuthor && <p className={errorPanel} role="alert">チームを作成・編集できるのはイベントの作成者（{event.author.handle ? `@${event.author.handle}` : event.author.did}）だけです。他のアカウントが作成したチームは無効になります。</p>}
    {notice && <div className={noticeBar} role="status">{notice}<button className={iconButton} aria-label="通知を閉じる" onClick={() => setNotice('')}><X size={18}/></button></div>}
    {error && <p className={errorPanel} role="alert">{error}</p>}
    <form className={cn(form, 'mb-2')} onSubmit={create}>
      <fieldset className={cn(fieldset, 'grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] items-end gap-[18px] max-sm:grid-cols-1')} disabled={!isAuthor || pending}>
        <label className={fieldLabel}>チーム名<input className={input} required maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="新しいチームの名前" /></label>
        <label className={fieldLabel}>メンバー<textarea className={cn(input, 'resize-y')} required value={members} onChange={e => setMembers(e.target.value)} placeholder={'alice.bsky.social\ndid:plc:…'} /><small className={hint}>{splitIdentifiers(members).length} / {MAX_MEMBERS}人</small></label>
        <button className={buttonPrimary}><Plus size={17}/>{pending ? '保存中…' : 'チームを追加'}</button>
      </fieldset>
    </form>
    <label className="my-[18px] flex max-w-[420px] items-center gap-2.5 border border-line bg-[#faf9f3] px-3.5 text-[#758266]"><Search size={17}/><span className="sr-only">チーム・メンバーを検索</span><input className="min-h-11 w-full bg-transparent text-xs text-black" value={query} onChange={e => setQuery(e.target.value)} placeholder="チーム名・メンバーで検索" /></label>
    <div className="my-6 grid grid-cols-3 gap-5 max-[62.5rem]:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-[15px]">{filtered.map(team => {
      const record = teamRecord(team);
      const effective = new Set(team.members.map(m => m.did));
      const excluded = (record.members ?? []).filter(did => !effective.has(did));
      const teamSubmissions = submissions.filter(s => s.team === team.uri);
      const { points, count } = approvedPoints(checkpoints, teamSubmissions);
      if (editing === team.uri) return <TeamEditor key={team.uri} team={team} initialMembers={(record.members ?? []).map(identifierOf).join('\n')} pending={pending} onCancel={() => setEditing(null)} onSave={async (nextName, text) => { if (await save(team, nextName, text)) setEditing(null); }} />;
      return <article key={team.uri} className={teamCard}>
        <div className="flex items-center justify-between"><span className={eyebrow}>TEAM</span><span className="flex">
          <button type="button" className={iconButton} disabled={pending || !isAuthor} aria-label={`${teamName(team)}を編集`} onClick={() => setEditing(team.uri)}><Pencil size={16}/></button>
          <button type="button" className={cn(iconButton, danger)} disabled={pending || !isAuthor} aria-label={`${teamName(team)}を削除`} onClick={() => void remove(team)}><Trash2 size={17}/></button>
        </span></div>
        <h4 className="my-2 text-[19px] leading-[1.7] font-medium [overflow-wrap:anywhere]">{teamName(team)}</h4>
        <strong className="mt-2.5 mb-5 block text-[32px] font-medium text-olive max-sm:text-[29px]">{points}<small className="ml-[5px] text-xs font-normal">pt</small></strong>
        <ul className="min-h-10 max-sm:flex max-sm:flex-wrap max-sm:gap-[15px]">{team.members.map(m => <li key={m.did} className="flex items-center gap-3 py-2 text-xs max-sm:text-[11px]">{m.avatar ? <img className={avatar} src={m.avatar} alt="" /> : <span className={avatar}>{profileName(m).replace('@', '')[0]}</span>}<span>{profileName(m)}{m.displayName && m.handle !== 'handle.invalid' && <small className="font-normal text-muted"> @{m.handle}</small>}</span></li>)}</ul>
        {!team.members.length && <p className="py-4 text-xs text-muted">有効なメンバーがいません</p>}
        {excluded.length > 0 && <p className="py-4 text-xs text-muted">他チームに所属済みのため無効：{excluded.map(memberLabel).join('、')}</p>}
        <span className="mt-[18px] block border-t border-line pt-[15px] text-[10px] text-muted">{team.members.length}名 · 承認済みCP {count}件 · 提出 {teamSubmissions.length}件</span>
      </article>;
    })}</div>
    {!visible.length && <div className={empty}>チームがありません。上のフォームから作成できます。</div>}
    {visible.length > 0 && !filtered.length && <div className={empty}>検索に一致するチームはありません。</div>}
  </section>;
}

function TeamEditor({ team, initialMembers, pending, onCancel, onSave }: { team: TeamView; initialMembers: string; pending: boolean; onCancel: () => void; onSave: (name: string, members: string) => Promise<void> }) {
  const [name, setName] = useState(teamName(team));
  const [members, setMembers] = useState(initialMembers);
  return <form className={teamCard} onSubmit={e => { e.preventDefault(); void onSave(name, members); }}>
    <fieldset className={cn(fieldset, 'flex flex-col gap-[18px]')} disabled={pending}>
      <span className={eyebrow}>EDIT TEAM</span>
      <label className={fieldLabel}>チーム名<input className={input} required maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label>
      <label className={fieldLabel}>メンバー（ハンドルまたはDID）<textarea className={cn(input, 'min-h-20 resize-y')} required value={members} onChange={e => setMembers(e.target.value)} /><small className={hint}>{splitIdentifiers(members).length} / {MAX_MEMBERS}人</small></label>
      <div className="mt-3.5 flex justify-end gap-2.5"><button type="button" className={button} onClick={onCancel}>キャンセル</button><button className={buttonPrimary}>{pending ? '保存中…' : '保存する'}</button></div>
    </fieldset>
  </form>;
}
