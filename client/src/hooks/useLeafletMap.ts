import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export function useLeafletMap(onPick?: (lat: number, lng: number) => void) {
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
    instance.on('click', e => { const point = e.latlng.wrap(); pick.current?.(point.lat, point.lng); });
    const resize = new ResizeObserver(() => instance.invalidateSize());
    resize.observe(container.current);
    return () => { resize.disconnect(); instance.remove(); map.current = null; layers.current = null; };
  }, []);
  return { container, map, layers, tileError };
}
