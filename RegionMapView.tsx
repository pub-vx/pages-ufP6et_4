import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { JAPAN_REGIONS_DATA } from '../../lib/regions';

/**
 * 어디로(권역) 선택 — 지도 뷰. 모든 선택을 지도에서 완결.
 * - 권역 마커 탭 → 그 권역 "위에 팝업"으로 2차 권역(세부지역) 칩 노출
 * - 다른 마커 탭 → 이전 팝업 닫히고 그 권역 팝업 노출 (한 번에 하나)
 * - 팝업: 전체 / 세부지역 토글 + "이 권역 빼기"(해제)
 * - 현재 일본만 좌표 제공. 그 외 나라는 안내 문구.
 */

/** 일본 1차 권역 중심 좌표 (지도 마커 배치용) */
const REGION_CENTERS: Record<string, [number, number]> = {
  '규슈': [32.8, 130.6],
  '간토': [35.9, 139.9],
  '간사이': [34.6, 135.5],
  '주부': [36.2, 137.6],
  '홋카이도': [43.2, 142.6],
  '오키나와': [26.5, 127.9],
  '도호쿠': [39.7, 140.7],
  '시코쿠': [33.7, 133.5],
  '주고쿠': [34.9, 132.4],
};

/**
 * 권역 마커. 선택=민트, 미선택=흰. active(팝업 열림)=민트 링 강조.
 * subN>0 이면 "규슈 ·2" 처럼 선택한 세부지역 수를 뱃지로.
 */
function createRegionMarker(label: string, count: number, selected: boolean, active: boolean, subN: number): L.DivIcon {
  const bg = selected ? '#F2FDF7' : '#ffffff';
  const border = selected ? '#1AB277' : '#E6EBF0';
  const fg = selected ? '#149867' : '#535D67';
  const countFg = selected ? '#1AB277' : '#9EABBA';
  const ring = active ? '0 0 0 3px #BFF0DB, ' : '';
  const countLabel = subN > 0 ? `·${subN}` : `${count}`;
  return L.divIcon({
    className: '',
    html: `<div style="
      display:inline-flex;align-items:center;gap:5px;white-space:nowrap;
      padding:5px 11px;border-radius:999px;font-size:13px;font-weight:700;letter-spacing:-0.2px;
      border:2px solid ${border};background:${bg};color:${fg};
      box-shadow:${ring}0 2px 8px rgba(15,23,42,0.15);
      transform:translate(-50%,-50%);
    ">${selected ? '✓&nbsp;' : ''}${label}<span style="font-size:11px;font-weight:600;color:${countFg}">${countLabel}</span></div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

/** 인라인 전환 직후 컨테이너 크기 재계산 (flex 영역 안에서 0 → 정상) */
function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

interface Props {
  selectedRegions: string[];
  pendingSubRegions: string[];
  /** 마커 탭 — 그 권역 선택(추가) */
  onSelectRegion: (id: string) => void;
  /** 팝업 "이 권역 빼기" — 그 권역 해제 */
  onDeselectRegion: (id: string) => void;
  /** 세부지역 토글 */
  onToggleSubRegion: (sub: string, regionId: string) => void;
  /** "전체" — 그 권역의 세부지역 모두 해제(= 권역 전체) */
  onClearSubRegions: (regionId: string) => void;
  regionCounts: Record<string, number>;
  subRegionCounts: Record<string, number>;
  countryCode: string;
}

export function RegionMapView({
  selectedRegions, pendingSubRegions,
  onSelectRegion, onDeselectRegion, onToggleSubRegion, onClearSubRegions,
  regionCounts, subRegionCounts, countryCode,
}: Props) {
  // 팝업이 열린(편집 중인) 권역 — 지도 내부 상태
  const [active, setActive] = useState<string | null>(null);

  if (countryCode !== 'jp') {
    return (
      <div className="h-full flex items-center justify-center px-8 text-center bg-[#EAF1F4]">
        <p className="text-[13px] font-medium text-gray-300 tracking-[-0.2px] leading-relaxed">
          선택하신 나라는 지도 선택을 준비 중이에요.<br />리스트에서 권역을 선택해 주세요.
        </p>
      </div>
    );
  }

  const selectedCount = JAPAN_REGIONS_DATA.filter(r => selectedRegions.includes(r.id)).length;
  const activeRegion = active ? JAPAN_REGIONS_DATA.find(r => r.id === active) ?? null : null;

  return (
    <div className="h-full relative bg-[#EAF1F4]">
      <MapContainer
        center={[37.6, 137.5]}
        zoom={4}
        minZoom={4}
        maxZoom={7}
        maxBounds={L.latLngBounds([20, 116], [51, 152])}
        maxBoundsViscosity={0.7}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <InvalidateOnMount />

        {JAPAN_REGIONS_DATA.map(r => {
          const pos = REGION_CENTERS[r.id];
          if (!pos) return null;
          const sel = selectedRegions.includes(r.id);
          const count = regionCounts[`${countryCode}:${r.id}`] || 0;
          const subList = r.displaySubRegions ?? r.subRegions;
          const subN = subList.filter(s => pendingSubRegions.includes(s)).length;
          return (
            <Marker
              key={`${r.id}-${sel}-${r.id === active}-${subN}`}
              position={pos}
              icon={createRegionMarker(r.label, count, sel, r.id === active, subN)}
              eventHandlers={{ click: () => { onSelectRegion(r.id); setActive(r.id); } }}
            />
          );
        })}

        {/* 세부지역 팝업 — active 권역 위에 1개만 노출 */}
        {activeRegion && (() => {
          const pos = REGION_CENTERS[activeRegion.id];
          const subList = activeRegion.displaySubRegions ?? activeRegion.subRegions;
          const selSub = subList.filter(s => pendingSubRegions.includes(s)).length;
          const isAllSub = selSub === 0 || selSub === subList.length;
          return (
            <Popup
              key={activeRegion.id}
              position={pos}
              closeButton={false}
              autoClose={false}
              closeOnClick={false}
              autoPan={false}   /* 탭마다 지도 패닝(덜컹) 방지 — 지도는 고정, 팝업만 노출 */
              maxWidth={300}
              minWidth={244}
              className="rt-region-popup"
            >
              <div className="w-[248px]">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[13px] font-medium text-gray-1000 tracking-[-0.2px]">
                    {activeRegion.label} <span className="text-gray-400 font-medium">세부지역</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setActive(null)}
                    className="w-6 h-6 -mr-1 flex items-center justify-center text-gray-300 hover:text-gray-600"
                    aria-label="닫기"
                  >✕</button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => onClearSubRegions(activeRegion.id)}
                    className={`inline-flex items-center px-2.5 h-7 rounded-full text-[12px] tracking-[-0.2px] border transition-colors ${
                      isAllSub ? 'bg-white border-gray-1000 text-gray-1000 font-medium' : 'bg-white border-gray-100 text-gray-300 font-medium'
                    }`}
                  >
                    전체
                  </button>
                  {subList.map(sub => {
                    const on = pendingSubRegions.includes(sub);
                    const c = subRegionCounts[`${countryCode}:${sub}`] || 0;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => onToggleSubRegion(sub, activeRegion.id)}
                        className={`inline-flex items-center gap-1 px-2.5 h-7 rounded-full text-[12px] tracking-[-0.2px] border transition-colors ${
                          on ? 'bg-white border-gray-1000 text-gray-1000 font-medium' : 'bg-white border-gray-100 text-gray-300 font-medium'
                        }`}
                      >
                        {sub}
                        {c > 0 && <span className={on ? 'text-primary-600 font-medium' : 'text-[#B7C2CC] font-medium'}>{c}</span>}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => { onDeselectRegion(activeRegion.id); setActive(null); }}
                  className="mt-2.5 text-[11px] font-medium text-gray-400 underline underline-offset-2 decoration-gray-300 hover:text-negative transition-colors"
                >
                  이 권역 빼기
                </button>
              </div>
            </Popup>
          );
        })()}
      </MapContainer>

      {/* 상단 헬퍼 칩 — 팝업(active) 열렸을 땐 겹치지 않도록 숨김 */}
      <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-[400] pointer-events-none transition-opacity ${active ? 'opacity-0' : 'opacity-100'}`}>
        <div className="px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full shadow-[0_2px_8px_rgba(15,23,42,0.10)] border border-gray-50">
          <p className="text-[12px] font-medium tracking-[-0.2px] text-gray-600">
            {selectedCount === 0
              ? '마커를 탭해 권역을 선택하세요'
              : <>마커 탭 → <span className="font-medium text-primary-600">세부지역</span> 선택</>}
          </p>
        </div>
      </div>
    </div>
  );
}
