
import L from 'leaflet';
import { useMemo } from 'react';

export const useBuildingIcon = () => {
  return useMemo(() => new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMgMjFIMjFWMTFMMTIgMkwzIDExVjIxWiIgZmlsbD0iIzMzNzNkYyIgc3Ryb2tlPSIjMmU2ZGI3IiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }), []);
};

export const useAreaIcon = () => {
  return useMemo(() => new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMgM0gyMVYyMUgzVjNaIiBmaWxsPSIjMTBiOTgxIiBzdHJva2U9IiMwNTk2NjkiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4=',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }), []);
};

export const usePinIcon = () => {
  return useMemo(() => new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTUuMzEgMiAxOCA0LjY5IDE4IDhDMTggMTMuNSAxMiAyMiAxMiAyMkM2IDEzLjUgNiA4IDYgOEM2IDQuNjkgOC42OSAyIDEyIDJaTTEyIDZDMTAuMzQgNiA5IDcuMzQgOSA5QzkgMTAuNjYgMTAuMzQgMTIgMTIgMTJDMTMuNjYgMTIgMTUgMTAuNjYgMTUgOUMxNSA3LjM0IDEzLjY2IDYgMTIgNloiIGZpbGw9IiNkYzI2MjYiIHN0cm9rZT0iI2IzMWMxYyIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPg==',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }), []);
};
