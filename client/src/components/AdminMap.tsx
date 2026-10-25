import { useEffect } from 'react';
import L from 'leaflet';
import { useLeafletMap } from '../hooks/useLeafletMap';
import { errorPanel } from '../lib/ui';
import { checkpointIsGoal, checkpointLocation, checkpointName, checkpointNumber, checkpointPoint } from '../lib/rogaining';
import type { CheckpointView } from '../lexicons/win/tomo-x/rogaining/defs';

type Props = {
  checkpoints: readonly CheckpointView[];
  /** 新しく登録する CP の位置 */
  selected?: [number, number] | null;
  onPick?: (lat: number, lng: number) => void;
  focus?: [number, number] | null;
};

/** CP ピン (Leaflet の divIcon に差し込む要素のクラス) */
const pinClass = "relative grid size-7 place-items-center border-2 border-bg bg-accent text-[11px] font-bold text-bg after:absolute after:-bottom-[7px] after:left-[9px] after:border-x-[5px] after:border-t-6 after:border-x-transparent after:border-t-accent after:content-['']";

/** 管理画面の地図。CP を表示し、onPick があればクリックで位置を選べる */
export default function AdminMap({ checkpoints, selected, onPick, focus }: Props) {
  const { container, map, layers, tileError } = useLeafletMap(onPick);
  useEffect(() => {
    const group = layers.current;
    if (!group) return;
    group.clearLayers();
    const bounds: L.LatLngExpression[] = [];
    checkpoints.forEach((cp, i) => {
      const location = checkpointLocation(cp);
      if (!location) return;
      const goal = checkpointIsGoal(cp);
      const label = document.createElement('span');
      label.className = pinClass;
      label.textContent = goal ? 'G' : checkpointNumber(i);
      const popup = document.createElement('div');
      popup.textContent = `${goal ? 'GOAL' : `CP ${checkpointNumber(i)}`} · ${checkpointName(cp)} / ${checkpointPoint(cp)}pt`;
      L.marker([location.lat, location.lng], { icon: L.divIcon({ className: '', html: label, iconSize: [34, 40], iconAnchor: [17, 40] }) }).bindPopup(popup).addTo(group);
      bounds.push([location.lat, location.lng]);
    });
    if (selected) L.circleMarker(selected, { radius: 10, color: '#222222', fillOpacity: 0.6 }).bindTooltip('新しいCPの位置').addTo(group);
    if (bounds.length && !selected) map.current?.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 16 });
  }, [checkpoints, selected, layers, map]);
  useEffect(() => { if (focus) map.current?.setView(focus, 17); }, [focus, map]);
  return <div className="min-w-0 border border-fg/25">
    <div ref={container} className="z-0 h-[480px] bg-fg/5 max-sm:h-[360px]" role="region" aria-label={onPick ? 'CP登録位置を選択する地図' : 'チェックポイントの地図'} />
    {tileError && <p className={errorPanel} role="alert">背景地図を取得できません</p>}
  </div>;
}
