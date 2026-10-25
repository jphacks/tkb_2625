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
import { button, buttonPrimary, empty, errorPanel, iconButton, input, notice as noticeBar, table, textarea } from '../../lib/ui';
import { HelpButton } from '../../components/SiteChrome';
import type { TeamView } from '../../lexicons/win/tomo-x/rogaining/defs';
import { atUriParts, useAdminEventContext } from './adminEventContext';

const MAX_MEMBERS = 100;

const fieldset = 'm-0 min-w-0 border-0 p-0';
const label = 'flex min-w-0 flex-col gap-1 text-[11px] font-bold text-fg/60';
const hint = 'text-[11px] font-normal text-fg/60';
const avatar = 'grid size-6 shrink-0 place-items-center bg-fg/10 object-cover text-[11px]';

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
    setNotice(`チーム「${created}」を作成しました。`);
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
    setNotice(`チーム「${nextName.trim()}」を更新しました。`);
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
    {!isAuthor && <p className={errorPanel} role="alert">閲覧のみ（チームの編集は作成者 {event.author.handle ? `@${event.author.handle}` : event.author.did} のみ）</p>}
    {notice && <div className={noticeBar} role="status">{notice}<button className={iconButton} aria-label="通知を閉じる" onClick={() => setNotice('')}><X size={16}/></button></div>}
    {error && <p className={errorPanel} role="alert">{error}</p>}
    <form className="border border-fg/10 p-3" onSubmit={create}>
      <fieldset className={cn(fieldset, 'grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto_auto] items-end gap-2 max-md:grid-cols-1')} disabled={!isAuthor || pending}>
        <label className={label}>チーム名<input className={input} required maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label>
        <label className={label}>メンバー（{splitIdentifiers(members).length} / {MAX_MEMBERS}人）<textarea className={cn(textarea, 'h-9 min-h-9 resize-y font-normal')} required value={members} onChange={e => setMembers(e.target.value)} placeholder={'alice.bsky.social\ndid:plc:…'} /></label>
        <button className={buttonPrimary}><Plus size={16}/>{pending ? '保存中…' : '追加'}</button>
        <HelpButton title="チームの作成" className="max-md:justify-self-end">
          <ul><li>チームは主催者のPDSに作成します。</li><li>メンバーはハンドル（例：alice.bsky.social）またはDIDで、改行・カンマ区切りで入力します。</li><li>他のチームに所属済みのメンバーは、先に作成されたチームの所属が優先されます。</li></ul>
        </HelpButton>
      </fieldset>
    </form>
    <div className="mt-3 mb-2 flex min-h-9 items-center gap-2 border-b border-fg pb-1"><h3 className="text-[13px] font-bold">チーム <small className="text-[11px] font-normal text-fg/60">{visible.length}件</small></h3>
      <label className="ml-auto flex h-8 w-full max-w-[280px] items-center gap-1 border border-fg/25 px-2 text-fg/60"><Search size={14}/><span className="sr-only">チーム・メンバーを検索</span><input className="h-full w-full bg-transparent text-[13px] text-fg" value={query} onChange={e => setQuery(e.target.value)} placeholder="チーム名・メンバーで検索" /></label></div>
    {filtered.length > 0 && <div className="overflow-x-auto"><table className={table}>
      <thead><tr><th>チーム</th><th>得点</th><th>メンバー</th><th>承認CP</th><th>提出</th><th><span className="sr-only">操作</span></th></tr></thead>
      <tbody>{filtered.map(team => {
        const record = teamRecord(team);
        const effective = new Set(team.members.map(m => m.did));
        const excluded = (record.members ?? []).filter(did => !effective.has(did));
        const teamSubmissions = submissions.filter(s => s.team === team.uri);
        const { points, count } = approvedPoints(checkpoints, teamSubmissions);
        if (editing === team.uri) return <tr key={team.uri}><td colSpan={6}><TeamEditor team={team} initialMembers={(record.members ?? []).map(identifierOf).join('\n')} pending={pending} onCancel={() => setEditing(null)} onSave={async (nextName, text) => { if (await save(team, nextName, text)) setEditing(null); }} /></td></tr>;
        return <tr key={team.uri}>
          <td className="font-bold [overflow-wrap:anywhere]">{teamName(team)}</td>
          <td className="whitespace-nowrap font-bold text-accent">{points}pt</td>
          <td><ul className="flex flex-wrap gap-x-3 gap-y-1">{team.members.map(m => <li key={m.did} className="flex items-center gap-1">{m.avatar ? <img className={avatar} src={m.avatar} alt="" /> : <span className={avatar}>{profileName(m).replace('@', '')[0]}</span>}<span>{profileName(m)}{m.displayName && m.handle !== 'handle.invalid' && <small className={hint}> @{m.handle}</small>}</span></li>)}</ul>
            {!team.members.length && <span className="text-fg/60">有効なメンバーがいません</span>}
            {excluded.length > 0 && <p className="text-[11px] text-fg/60">他チームに所属済みのため無効：{excluded.map(memberLabel).join('、')}</p>}</td>
          <td className="whitespace-nowrap">{count}件</td>
          <td className="whitespace-nowrap">{teamSubmissions.length}件</td>
          <td className="whitespace-nowrap text-right">
            <button type="button" className={iconButton} disabled={pending || !isAuthor} aria-label={`${teamName(team)}を編集`} title="編集" onClick={() => setEditing(team.uri)}><Pencil size={16}/></button>
            <button type="button" className={iconButton} disabled={pending || !isAuthor} aria-label={`${teamName(team)}を削除`} title="削除" onClick={() => void remove(team)}><Trash2 size={16}/></button>
          </td>
        </tr>;
      })}</tbody>
    </table></div>}
    {!visible.length && <div className={cn(empty, 'py-6')}>チームがありません。</div>}
    {visible.length > 0 && !filtered.length && <div className={cn(empty, 'py-6')}>検索に一致するチームはありません。</div>}
  </section>;
}

function TeamEditor({ team, initialMembers, pending, onCancel, onSave }: { team: TeamView; initialMembers: string; pending: boolean; onCancel: () => void; onSave: (name: string, members: string) => Promise<void> }) {
  const [name, setName] = useState(teamName(team));
  const [members, setMembers] = useState(initialMembers);
  return <form onSubmit={e => { e.preventDefault(); void onSave(name, members); }}>
    <fieldset className={cn(fieldset, 'grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto_auto] items-end gap-2 max-md:grid-cols-1')} disabled={pending}>
      <label className={label}>チーム名<input className={input} required maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label>
      <label className={label}>メンバー（ハンドルまたはDID・{splitIdentifiers(members).length} / {MAX_MEMBERS}人）<textarea className={cn(textarea, 'min-h-16 resize-y font-normal')} required value={members} onChange={e => setMembers(e.target.value)} /></label>
      <button type="button" className={button} onClick={onCancel}>キャンセル</button><button className={buttonPrimary}>{pending ? '保存中…' : '保存'}</button>
    </fieldset>
  </form>;
}
