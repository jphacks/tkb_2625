import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { ArrowUpRight, Compass, Crosshair, MapPin, Navigation, Pause, Play } from 'lucide-react';
import { useEventContext } from './EventLayout';
import { PageHeading } from '../../components/Status';
import { useLeafletMap } from '../../hooks/useLeafletMap';
import { cn } from '../../lib/cn';
import { eventPath } from '../../lib/eventUri';
import { button, buttonPrimary, errorPanel, eyebrow, iconButton, liveDot } from '../../lib/ui';
import { checkpointBounds, checkpointIsGoal, checkpointLocation, checkpointName, checkpointNumber, checkpointPoint, STATUSES } from '../../lib/rogaining';

// Leaflet の divIcon に渡す HTML 文字列なので、クラスは文字列のまま書く
const pin = "relative grid size-8 place-items-center border-2 border-[#87966b] bg-[#f8f5e9] text-[11px] font-bold text-[#63734e] shadow-[0_2px_4px_#0002] after:absolute after:-bottom-[7px] after:left-[9px] after:border-x-[5px] after:border-t-[6px] after:border-x-transparent after:border-t-[#87966b] after:content-['']";
const pinApproved = 'bg-[#5e704b] text-white';
const actionSize = 'max-sm:px-3 max-sm:text-[11px]';

type CompassEvent = DeviceOrientationEvent & { webkitCompassHeading?: number };
type CompassConstructor = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> };

export default function MapPage() {
  const { uri, checkpoints, statusOf } = useEventContext();
  const { container, map, layers, tileError } = useLeafletMap();
  const [recording, setRecording] = useState(false);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [message, setMessage] = useState('「記録開始」を押すと位置情報の利用を求め、現在位置と移動経路を表示します。');
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
      const approved = status === 'approved';
      const label = approved ? '✓' : checkpointIsGoal(cp) ? 'G' : number;
      const marker = L.marker([location.lat, location.lng], { icon: L.divIcon({ className: '', html: `<span class="${cn(pin, approved && pinApproved)}">${label}</span>`, iconSize: [34, 40], iconAnchor: [17, 40] }) });
      const content = document.createElement('div');
      content.textContent = `${checkpointIsGoal(cp) ? 'GOAL' : `CP ${number}`} · ${checkpointName(cp)} / ${checkpointPoint(cp)}pt · ${STATUSES[status].label}`;
      marker.bindPopup(content).addTo(group);
    });
    if (route.length > 1) L.polyline(route, { color: '#4f6952', weight: 4 }).addTo(group);
    if (position) L.circleMarker(position, { radius: 8, color: '#fff', fillColor: '#426c96', fillOpacity: 1, weight: 3 }).bindTooltip('現在位置（GPS）').addTo(group);
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
      setMessage(`GPS記録中 · 位置精度 約${Math.round(result.coords.accuracy)}m。画面を閉じると記録が停止します。`);
    }, error => {
      if (!active) return;
      if (error.code === 1) setRecording(false);
      setMessage(error.code === 1 ? '位置情報が許可されていません。ブラウザの設定で許可してください。' : '一時的に位置情報を取得できません。記録は継続し、次の測位を待っています。');
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
    if (!window.DeviceOrientationEvent) { setMessage('端末の方位センサーは利用できません。地図の上側が北です。'); return; }
    try {
      const orientation = DeviceOrientationEvent as CompassConstructor;
      if (typeof orientation.requestPermission === 'function' && await orientation.requestPermission() !== 'granted') throw new Error();
      setOrientationEnabled(true);
      setMessage('方位情報を待っています。対応端末でもセンサー値を取得できない場合があります。地図の上側は常に北です。');
    } catch { setMessage('方位センサーの利用が許可されませんでした。地図の上側が北です。'); }
  }
  function recenter() {
    if (position) map.current?.setView(position, 16);
    else if (bounds) { map.current?.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 }); setMessage('現在位置はまだありません。「記録開始」で位置情報を取得してください。'); }
    else setMessage('現在位置はまだありません。「記録開始」で位置情報を取得してください。');
  }
  return <><PageHeading eyebrow="FIND YOUR OWN WAY" title="街を探索する" text="次の発見は、どの道の先に？"/><div className="grid grid-cols-[minmax(0,1fr)_280px] items-start gap-6 max-md:grid-cols-[minmax(0,1fr)_230px] max-md:gap-[15px] max-sm:grid-cols-1"><section className="min-w-0 border border-line bg-[#fcfbf6]"><div className="flex items-center justify-between gap-2.5 p-3 max-sm:p-[9px]"><span className={eyebrow}>LIVE GPS</span><span className="flex items-center gap-1.5 pr-[5px] text-[9px] text-muted max-sm:text-[8px]"><Navigation size={16}/> N / 地図の北</span></div><div className="relative"><div ref={container} className="z-0 h-[470px] bg-[#e5e8da] [font-family:inherit] max-sm:h-[390px]" aria-label="チェックポイントと移動経路の地図"/><span className="pointer-events-none absolute top-3 right-3 z-[400] bg-[#e5eddfed] px-[11px] py-2 text-[9px] tracking-[.4px] text-[#496840] max-sm:px-[9px] max-sm:py-[7px] max-sm:text-[8px]">{recording ? 'GPS / 記録中' : 'GPS / 記録停止中'}</span><button className={cn(iconButton, 'absolute right-3 bottom-7 z-[400] border border-line bg-[#faf9f0] shadow-[0_1px_5px_#0002]')} onClick={recenter} aria-label="現在位置へ戻る"><Crosshair size={22}/></button></div><div className="flex items-center gap-2 p-4 text-[11px] leading-[1.8] text-muted max-sm:items-start max-sm:text-[10px]" role="status"><span className={cn(liveDot, !recording && 'bg-[#b4b5a3]', 'max-sm:mt-1.5')}/>{message}</div>{tileError && <p className={errorPanel} role="alert">背景地図を読み込めませんでした。ネットワークを確認してください。チェックポイントと経路は引き続き表示しています。</p>}<div className="flex flex-wrap gap-2.5 px-4 pb-4 max-sm:px-3 max-sm:pb-[15px]"><button className={cn(buttonPrimary, actionSize)} onClick={() => { setRecording(v => !v); if (recording) setMessage('GPS記録を停止しました。記録済みの経路はこの画面内で保持します。'); }}>{recording ? <Pause size={17}/> : <Play size={17}/>}{recording ? '記録停止' : '記録開始'}</button><button className={cn(button, actionSize)} onClick={enableCompass}><Compass size={17}/>端末の方位を確認</button><span className="w-full text-[10px] text-muted max-sm:text-[9px]">{heading === null ? '端末の方位：未取得' : `端末の向き：${Math.round(heading)}°（北=0°）`}</span></div></section><aside className="border border-line bg-[#efefe5] p-[22px] max-md:p-4 max-sm:p-5"><span className={eyebrow}>ON YOUR ROUTE</span><h3 className="my-3 text-lg font-medium">チェックポイント</h3><p className="text-[10px] leading-[1.8] text-muted">番号を押すと地図で場所を確認できます。</p><div className="my-[18px] max-sm:grid max-sm:grid-cols-2 max-sm:gap-x-4 max-xs:grid-cols-1">{located.map(({ cp, number, location }) => <button key={cp.uri} className="flex w-full items-center gap-2.5 border-b border-line py-[13px] text-left hover:bg-[#e5e8d9] max-sm:gap-2" disabled={!location} onClick={() => { if (location) map.current?.setView([location.lat, location.lng], 17); }}><span className="border border-[#bfc8b0] p-[7px] text-[10px] text-olive max-sm:p-[5px] max-sm:text-[9px]">{checkpointIsGoal(cp) ? 'G' : number}</span><span><strong className="block text-[11px] font-medium max-sm:text-[10px]">{checkpointName(cp)}</strong><small className="mt-1 block text-[8px] font-normal text-muted max-sm:text-[7px]">{location ? STATUSES[statusOf(cp)].label : '位置情報なし'}</small></span><b className="ml-auto text-[15px] font-medium max-sm:text-[13px]">{checkpointPoint(cp)}<small className="ml-0.5 inline text-[8px] font-normal text-muted max-sm:text-[7px]">pt</small></b></button>)}{!located.length && <p className="text-muted">チェックポイントはまだありません。</p>}</div><Link to={eventPath(uri, 'cards')} className={cn(button, 'w-full text-[10px]')}>カードから写真を提出<ArrowUpRight size={16}/></Link></aside></div><div className="mt-[30px] flex items-center gap-3.5 border-y border-line px-[3px] py-[19px] text-[#7b866d] max-sm:mt-[23px] max-sm:items-start max-sm:gap-2.5 max-sm:px-0.5 max-sm:py-4 max-sm:[&>svg]:mt-[3px] max-sm:[&>svg]:w-[17px]"><MapPin size={20}/><p className="flex flex-col gap-1.5 text-[10px] leading-[1.7] max-sm:gap-1 max-sm:text-[9px]"><strong className="text-[11px] font-medium text-[#626f54] max-sm:text-[10px]">GPS経路はこの端末の中だけで表示します。</strong><span>経路はどこにも送信されず、この画面を離れると消去されます。</span></p></div></>;
}
