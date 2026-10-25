import { useEffect } from 'react';
import L from 'leaflet';
import { useLeafletMap } from './useLeafletMap';
import { formatDate } from './utils';
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
  const { container, map, layers, tileError } = useLeafletMap(onPick);
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
      popup.textContent = `${team.name} · ${team.points}pt / モック位置 · ${formatDate(team.position.updatedAt)}`;
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
