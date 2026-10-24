import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Checkpoint, TeamView } from './types';

type Props = {
  checkpoints: Checkpoint[];
  teams?: TeamView[];
  selected?: [number, number] | null;
  onPick?: (lat: number, lng: number) => void;
  focus?: [number, number] | null;
};
const EMPTY_TEAMS: TeamView[] = [];

export default function AdminMap({ checkpoints, teams = EMPTY_TEAMS, selected, onPick, focus }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map>(null);
  const layers = useRef<L.LayerGroup>(null);
  const pick = useRef(onPick);
  pick.current = onPick;
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    const instance = L.map(container.current, { center: [35.6727, 139.6963], zoom: 15, scrollWheelZoom: false });
    map.current = instance;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).on('tileerror', () => setTileError(true)).addTo(instance);
    layers.current = L.layerGroup().addTo(instance);
    instance.on('click', e => pick.current?.(e.latlng.lat, e.latlng.lng));
    const resize = new ResizeObserver(() => instance.invalidateSize());
    resize.observe(container.current);
    return () => { resize.disconnect(); instance.remove(); map.current = null; layers.current = null; };
  }, []);
  useEffect(() => {
    const group = layers.current;
    if (!group) return;
    group.clearLayers();
    const bounds: L.LatLngExpression[] = [];
    for (const cp of checkpoints) {
      const label = document.createElement('span');
      label.textContent = cp.id;
      const popup = document.createElement('div');
      popup.textContent = `CP ${cp.id} · ${cp.name} / ${cp.points}pt`;
      L.marker([cp.lat, cp.lng], { icon: L.divIcon({ className: 'cp-pin', html: label, iconSize: [34, 40], iconAnchor: [17, 40] }) }).bindPopup(popup).addTo(group);
      bounds.push([cp.lat, cp.lng]);
    }
    for (const team of teams) {
      if (!team.position) continue;
      const label = document.createElement('span');
      label.textContent = `T${team.number}`;
      const popup = document.createElement('div');
      popup.textContent = `${team.name} · ${team.points}pt / モック位置 · ${new Date(team.position.updatedAt).toLocaleString('ja-JP')}`;
      L.marker([team.position.lat, team.position.lng], { icon: L.divIcon({ className: 'team-pin', html: label, iconSize: [58, 32], iconAnchor: [29, 16] }) }).bindPopup(popup).addTo(group);
      bounds.push([team.position.lat, team.position.lng]);
    }
    if (selected) L.circleMarker(selected, { radius: 10, color: '#a1533b', fillOpacity: 0.6 }).bindTooltip('新しいCPの位置').addTo(group);
    if (bounds.length && !selected) map.current?.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 16 });
  }, [checkpoints, teams, selected]);
  useEffect(() => { if (focus) map.current?.setView(focus, 17); }, [focus]);
  return <div className="admin-map-frame">
    <div ref={container} className="leaflet-map" role="region" aria-label={onPick ? 'CP登録位置を選択する地図' : 'チームのモック位置とチェックポイントの地図'} />
    {tileError && <p className="error-panel" role="alert">背景地図を取得できません。緯度・経度は入力欄からも指定できます。</p>}
  </div>;
}
