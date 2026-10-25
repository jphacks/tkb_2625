import { useEffect, useState } from 'react';
import L from 'leaflet';
import { Crosshair, Navigation, Pause, Play } from 'lucide-react';
import { useEventContext } from './EventLayout';
import { Status } from '../../components/Status';
import { HelpButton } from '../../components/SiteChrome';
import { useLeafletMap } from '../../hooks/useLeafletMap';
import { cn } from '../../lib/cn';
import { button, buttonPrimary, errorPanel, iconButton, liveDot } from '../../lib/ui';
import { checkpointBounds, checkpointIsGoal, checkpointLocation, checkpointName, checkpointNumber, checkpointPoint, STATUSES, type CheckpointStatus } from '../../lib/rogaining';

// Leaflet の divIcon に渡す HTML 文字列なので、クラスは文字列のまま書く
// AdminMap の pinClass と同じ形。未提出 = accent、審査中・不可 = fg、承認済み = fg/30
const pin = "relative grid size-7 place-items-center border-2 border-bg bg-accent text-[11px] font-bold text-bg after:absolute after:-bottom-[7px] after:left-[9px] after:border-x-[5px] after:border-t-6 after:border-x-transparent after:border-t-accent after:content-['']";
const pinStatus: Record<CheckpointStatus, string> = {
  unsubmitted: '',
  pending: 'bg-fg after:border-t-fg',
  rejected: 'bg-fg after:border-t-fg',
  approved: 'bg-fg/30 after:border-t-fg/30',
};
const bigButton = 'h-11 text-[14px]';

type CompassEvent = DeviceOrientationEvent & { webkitCompassHeading?: number };
type CompassConstructor = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> };

export default function MapPage() {
  const { checkpoints, statusOf } = useEventContext();
  const { container, map, layers, tileError } = useLeafletMap();
  const [recording, setRecording] = useState(false);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [message, setMessage] = useState('');
  const [heading, setHeading] = useState<number | null>(null);
  const [orientationEnabled, setOrientationEnabled] = useState(false);
  const located = checkpoints.map((cp, i) => ({ cp, number: checkpointNumber(i), location: checkpointLocation(cp) }));
  // 地図の初期表示はチェックポイント全体が収まる範囲にする
  const bounds = checkpointBounds(checkpoints);
  const boundsKey = bounds?.flat().join(',');
  useEffect(() => {
    if (bounds) map.current?.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
  }, [boundsKey]); // bounds は毎回作り直される配列なので、値の文字列で比較する
  useEffect(() => {
    const group = layers.current;
    if (!group) return;
    group.clearLayers();
    located.forEach(({ cp, number, location }) => {
      if (!location) return;
      const status = statusOf(cp);
      const label = status === 'approved' ? '✓' : checkpointIsGoal(cp) ? 'G' : number;
      const marker = L.marker([location.lat, location.lng], { icon: L.divIcon({ className: '', html: `<span class="${cn(pin, pinStatus[status])}">${label}</span>`, iconSize: [34, 40], iconAnchor: [17, 40] }) });
      const content = document.createElement('div');
      content.textContent = `${checkpointIsGoal(cp) ? 'GOAL' : `CP ${number}`} · ${checkpointName(cp)} / ${checkpointPoint(cp)}pt · ${STATUSES[status].label}`;
      marker.bindPopup(content).addTo(group);
    });
    if (route.length > 1) L.polyline(route, { color: '#222222', weight: 4, opacity: 0.7 }).addTo(group);
    if (position) L.circleMarker(position, { radius: 8, color: '#222222', fillColor: '#1e7b45', fillOpacity: 1, weight: 3 }).bindTooltip('現在位置（GPS）').addTo(group);
  }, [checkpoints, statusOf, route, position]);
  useEffect(() => {
    if (!recording) return;
    if (!navigator.geolocation) { setMessage('このブラウザは位置情報に対応していません。'); setRecording(false); return; }
    if (!window.isSecureContext) { setMessage('位置情報にはHTTPSまたはlocalhostが必要です。'); setRecording(false); return; }
    let active = true;
    let centered = false;
    const watch = navigator.geolocation.watchPosition(result => {
      if (!active) return;
      const next: [number, number] = [result.coords.latitude, result.coords.longitude];
      if (!centered) { map.current?.setView(next, 16); centered = true; }
      setPosition(next);
      setRoute(previous => [...previous, next]);
      setMessage(`記録中 · 精度 約${Math.round(result.coords.accuracy)}m`);
    }, error => {
      if (!active) return;
      if (error.code === 1) setRecording(false);
      setMessage(error.code === 1 ? '位置情報が許可されていません。ブラウザの設定で許可してください。' : '位置情報を一時的に取得できません。測位を待っています…');
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 });
    return () => { active = false; navigator.geolocation.clearWatch(watch); };
  }, [recording]);
  useEffect(() => {
    if (!orientationEnabled) return;
    const update = (event: CompassEvent) => {
      if (typeof event.webkitCompassHeading === 'number') setHeading(event.webkitCompassHeading);
      else if (event.absolute && typeof event.alpha === 'number') setHeading((360 - event.alpha) % 360);
    };
    window.addEventListener('deviceorientation', update);
    window.addEventListener('deviceorientationabsolute', update);
    return () => { window.removeEventListener('deviceorientation', update); window.removeEventListener('deviceorientationabsolute', update); };
  }, [orientationEnabled]);
  async function enableCompass() {
    if (!window.DeviceOrientationEvent) { setMessage('方位センサーを利用できません。'); return; }
    try {
      const orientation = DeviceOrientationEvent as CompassConstructor;
      if (typeof orientation.requestPermission === 'function' && await orientation.requestPermission() !== 'granted') throw new Error();
      setOrientationEnabled(true);
      setMessage('方位を取得中…');
    } catch { setMessage('方位センサーが許可されませんでした。'); }
  }
  function recenter() {
    if (position) map.current?.setView(position, 16);
    else if (bounds) { map.current?.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 }); setMessage('現在位置がありません。記録開始で取得します。'); }
    else setMessage('現在位置がありません。記録開始で取得します。');
  }
  function focus(location: { lat: number; lng: number }) {
    map.current?.setView([location.lat, location.lng], 17);
    container.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  return <div className="grid grid-cols-[minmax(0,1fr)_260px] items-start gap-3 max-md:grid-cols-[minmax(0,1fr)_220px] max-sm:grid-cols-1">
    <section className="min-w-0 border border-fg/25">
      <div className="relative">
        <div ref={container} className="z-0 h-[calc(100dvh-230px)] min-h-[360px] bg-fg/5 [font-family:inherit] max-sm:h-[calc(100dvh-260px)] max-sm:min-h-[300px]" role="region" aria-label="チェックポイントと移動経路の地図"/>
        <span className="pointer-events-none absolute top-2 right-2 z-[400] flex items-center gap-1.5 border border-fg/10 bg-bg px-2 py-1 text-[11px] font-bold"><span className={cn(liveDot, !recording && 'bg-fg/30')}/>{recording ? '記録中' : '停止中'}</span>
        <button className={cn(iconButton, 'absolute right-2 bottom-6 z-[400] size-11 border border-fg/25 bg-bg')} onClick={recenter} aria-label="現在位置へ戻る" title="現在位置へ戻る"><Crosshair size={22}/></button>
      </div>
      {tileError && <p className={errorPanel} role="alert">背景地図を読み込めません。CPと経路は表示しています。</p>}
      <div className="flex flex-wrap items-center gap-2 border-t border-fg/10 p-2">
        <button className={cn(recording ? button : buttonPrimary, bigButton, 'max-sm:flex-1')} onClick={() => { setRecording(v => !v); if (recording) setMessage('記録を停止しました。'); }}>{recording ? <Pause size={18}/> : <Play size={18}/>}{recording ? '記録停止' : '記録開始'}</button>
        <button className={cn(button, bigButton)} onClick={enableCompass} title="端末の方位を確認"><Navigation size={18} style={heading === null ? undefined : { transform: `rotate(${heading}deg)` }}/><span className="tabular-nums">{heading === null ? '方位' : <><span className="sr-only">端末の向き </span>{Math.round(heading)}°</>}</span></button>
        <HelpButton title="マップ" className="size-11"><ul><li>「記録開始」で位置情報の利用を許可すると、現在位置と移動経路を表示します。</li><li>経路はこの端末の中だけで表示し、どこにも送信しません。画面を離れると消去されます。</li><li>地図の上側が北です。方位ボタンで端末の向き (北=0°) を表示します。</li><li>リストの行を押すと、そのチェックポイントの場所へ移動します。</li></ul></HelpButton>
        <p className="w-full text-[12px] text-fg/60 empty:hidden" role="status">{message}</p>
      </div>
    </section>
    <aside className="min-w-0 border border-fg/25 sm:max-h-[calc(100dvh-170px)] sm:overflow-y-auto" aria-label="チェックポイント">
      {located.map(({ cp, number, location }) => <button key={cp.uri} className="flex h-10 w-full items-center gap-2 border-b border-fg/10 px-2 text-left last:border-0 hover:not-disabled:bg-fg/5 disabled:opacity-40" disabled={!location} onClick={() => { if (location) focus(location); }}>
        <span className="w-9 shrink-0 bg-fg text-center text-[11px] leading-[18px] font-bold text-bg tabular-nums">{checkpointIsGoal(cp) ? 'GOAL' : number}</span>
        <span className="min-w-0 flex-1 truncate text-[13px]">{checkpointName(cp)}</span>
        {location ? <Status value={statusOf(cp)}/> : <span className="text-[11px] text-fg/60">位置なし</span>}
        <b className="w-10 shrink-0 text-right text-[13px] font-bold tabular-nums">{checkpointPoint(cp)}<small className="text-[11px] font-normal text-fg/60">pt</small></b>
      </button>)}
      {!located.length && <p className="p-3 text-[13px] text-fg/60">チェックポイントはありません。</p>}
    </aside>
  </div>;
}
