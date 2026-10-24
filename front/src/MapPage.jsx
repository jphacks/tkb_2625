import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowUpRight, Compass, Crosshair, MapPin, Navigation, Pause, Play } from 'lucide-react';
import { checkpoints, checkpointStatus, demoRoute } from './data';

export default function MapPage({ state }) {
  const container = useRef(null);
  const map = useRef(null);
  const layers = useRef(null);
  const [mode, setMode] = useState('demo');
  const [recording, setRecording] = useState(false);
  const [route, setRoute] = useState([]);
  const [position, setPosition] = useState(null);
  const [message, setMessage] = useState('デモのルートと架空のチェックポイントを表示しています。');
  const [tileError, setTileError] = useState(false);
  const [heading, setHeading] = useState(null);
  const [orientationEnabled, setOrientationEnabled] = useState(false);
  const displayRoute = mode === 'demo' ? demoRoute : route;
  const displayPosition = mode === 'demo' ? demoRoute.at(-1) : position;
  useEffect(() => {
    const instance = L.map(container.current, { center: [35.6727, 139.6963], zoom: 15, scrollWheelZoom: false });
    map.current = instance;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).on('tileerror', () => setTileError(true)).addTo(instance);
    layers.current = L.layerGroup().addTo(instance);
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(container.current);
    return () => { observer.disconnect(); instance.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    if (!layers.current) return;
    layers.current.clearLayers();
    checkpoints.forEach(cp => {
      const approved = checkpointStatus(state, cp.id) === 'approved';
      const marker = L.marker([cp.lat, cp.lng], { icon: L.divIcon({ className: 'cp-pin', html: `<span class="${approved ? 'is-approved' : ''}">${approved ? '✓' : cp.id}</span>`, iconSize: [34, 40], iconAnchor: [17, 40] }) });
      const content = document.createElement('div');
      content.textContent = `CP ${cp.id} · ${cp.name} / ${cp.points}pt${approved ? ' · 達成済み' : ''}`;
      marker.bindPopup(content).addTo(layers.current);
    });
    if (displayRoute.length > 1) L.polyline(displayRoute, { color: mode === 'demo' ? '#9d7654' : '#4f6952', weight: 4, dashArray: mode === 'demo' ? '6 8' : undefined }).addTo(layers.current);
    if (displayPosition) L.circleMarker(displayPosition, { radius: 8, color: '#fff', fillColor: mode === 'demo' ? '#9d7654' : '#426c96', fillOpacity: 1, weight: 3 }).bindTooltip(mode === 'demo' ? 'デモ位置（実測ではありません）' : '現在位置（GPS）').addTo(layers.current);
  }, [state, mode, route, position]);
  useEffect(() => {
    if (!recording || mode !== 'live') return;
    if (!navigator.geolocation) { setMessage('このブラウザは位置情報に対応していません。デモ表示をお使いください。'); setRecording(false); return; }
    if (!window.isSecureContext) { setMessage('位置情報にはHTTPSまたはlocalhostが必要です。デモ表示をお使いください。'); setRecording(false); return; }
    const watch = navigator.geolocation.watchPosition(result => {
      const next = [result.coords.latitude, result.coords.longitude];
      setPosition(previous => { if (!previous) map.current?.setView(next, 16); return next; });
      setRoute(previous => [...previous, next]);
      setMessage(`GPS記録中 · 位置精度 約${Math.round(result.coords.accuracy)}m。画面を閉じると記録が停止します。`);
    }, error => {
      setRecording(false);
      setMessage(error.code === 1 ? '位置情報が許可されていません。ブラウザの設定で許可するか、デモ表示をお使いください。' : '位置情報を取得できませんでした。屋外で再試行するか、デモ表示をお使いください。');
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 });
    return () => navigator.geolocation.clearWatch(watch);
  }, [recording, mode]);
  useEffect(() => {
    if (!orientationEnabled) return;
    const update = event => {
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
      if (typeof DeviceOrientationEvent.requestPermission === 'function' && await DeviceOrientationEvent.requestPermission() !== 'granted') throw new Error();
      setOrientationEnabled(true);
      setMessage('方位情報を待っています。対応端末でもセンサー値を取得できない場合があります。地図の上側は常に北です。');
    } catch { setMessage('方位センサーの利用が許可されませんでした。地図の上側が北です。'); }
  }
  function switchMode(next) {
    setRecording(false); setMode(next);
    setMessage(next === 'demo' ? 'デモのルートと架空のチェックポイントを表示しています。' : '実測モードです。「記録開始」を押すと位置情報の利用を求めます。');
    if (next === 'demo') map.current?.setView([35.6727, 139.6963], 15);
  }
  function recenter() {
    if (displayPosition) map.current?.setView(displayPosition, 16);
    else setMessage('現在位置はまだありません。「記録開始」で位置情報を取得してください。');
  }
  return <><div className="page-heading"><span className="eyebrow">FIND YOUR OWN WAY</span><h2>街を探索する</h2><p>次の発見は、どの道の先に？</p></div><div className="map-layout"><section className="map-panel"><div className="map-toolbar"><div className="mode-switch" role="group" aria-label="地図の表示モード"><button className={mode === 'demo' ? 'active' : ''} onClick={() => switchMode('demo')}>デモ表示</button><button className={mode === 'live' ? 'active' : ''} onClick={() => switchMode('live')}>実測 GPS</button></div><span className="north-indicator"><Navigation size={16}/> N / 地図の北</span></div><div className="map-wrap"><div ref={container} className="leaflet-map" aria-label="チェックポイントと移動経路の地図"/><span className={`map-mode-badge ${mode}`}>{mode === 'demo' ? 'DEMO / 架空の経路・位置' : recording ? 'GPS / 記録中' : 'GPS / 記録停止中'}</span><button className="recenter icon-button" onClick={recenter} aria-label={mode === 'demo' ? 'デモ位置へ戻る' : '現在位置へ戻る'}><Crosshair size={22}/></button></div><div className="map-status" role="status"><span className={`live-dot ${recording ? '' : 'idle'}`}/>{message}</div>{tileError && <p className="error-panel" role="alert">背景地図を読み込めませんでした。ネットワークを確認してください。チェックポイントと経路は引き続き表示しています。</p>}<div className="map-actions"><button className="button primary" disabled={mode !== 'live'} onClick={() => { setRecording(v => !v); if (recording) setMessage('GPS記録を停止しました。記録済みの経路はこの画面内で保持します。'); }}>{recording ? <Pause size={17}/> : <Play size={17}/ >}{recording ? '記録停止' : '記録開始'}</button><button className="button" onClick={enableCompass}><Compass size={17}/>端末の方位を確認</button><span className="heading-value">{heading === null ? '端末の方位：未取得' : `端末の向き：${Math.round(heading)}°（北=0°）`}</span></div></section><aside className="map-sidebar"><span className="eyebrow">ON YOUR ROUTE</span><h3>チェックポイント</h3><p className="muted">番号を押すと地図で場所を確認できます。</p><div className="map-cp-list">{checkpoints.map(cp => <button key={cp.id} onClick={() => map.current?.setView([cp.lat, cp.lng], 17)}><span className="map-list-number">{cp.id}</span><span><strong>{cp.name}</strong><small>{cp.area}</small></span><b>{cp.points}<small>pt</small></b></button>)}</div><Link to="/cards" className="button">カードから写真を提出<ArrowUpRight size={16}/></Link></aside></div><div className="field-note"><MapPin size={20}/><p><strong>この大会の場所・名称はデモ用です。</strong><span>GPS経路はこの画面を離れると消去されます。実際の大会には正式なチェックポイント情報が必要です。</span></p></div></>;
}
