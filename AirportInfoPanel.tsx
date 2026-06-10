import { Plane } from 'lucide-react';
import { airports } from '../../data/mockData';
import {
  KOREAN_DEPARTURES,
  getDirectKoreanDepartures,
  formatFlightDuration,
} from '../../data/flightDurations';
import { MapBottomCard } from './MapBottomCard';

interface Props {
  airportId: string;
  onClose: () => void;
}

/**
 * 지도 하단 공항 정보 패널 — selectedAirportId 활성 시 노출.
 * 한국 출발지별 직항 ✓/✗ + 비행시간 매트릭스를 통째로 보여준다.
 * 홈 카드는 가벼운 라벨만 가지고, 정밀 비교는 여기서 책임진다.
 */
export function AirportInfoPanel({ airportId, onClose }: Props) {
  const airport = airports.find(a => a.id === airportId);
  if (!airport) return null;

  const directs = getDirectKoreanDepartures(airportId);
  const directById = new Map(directs.map(d => [d.koreanAirport.id, d.minutes]));

  return (
    <MapBottomCard>
      {/* 헤더 — 패딩/폰트 축소, 공항명과 권역+직항수를 한 영역에 묶음 */}
      <div className="px-3 py-2.5 border-b border-gray-10 pr-9">
        <h3 className="text-[14px] font-medium text-gray-1000 tracking-[-0.3px]">
          {airport.name}
          <span className="ml-1 text-[12px] font-medium text-gray-300">({airport.code})</span>
        </h3>
        <p className="mt-0.5 text-[11px] font-medium text-gray-500 tracking-[-0.2px]">
          {airport.region} 권역
          {directs.length > 0 ? (
            <span className="ml-1.5 text-primary-700 font-medium">
              한국 {directs.length}개 직항
            </span>
          ) : (
            <span className="ml-1.5 text-[#D9651E] font-medium">
              한국 직항 없음
            </span>
          )}
        </p>
      </div>

      {/* 한국 출발지별 직항 — 2열 그리드로 컴팩트화. 환승 줄 제거 (홈 방향성과 동일: 직항만 노출). */}
      {directs.length > 0 && (
        <div className="px-3 py-2.5">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {KOREAN_DEPARTURES.filter(k => directById.has(k.id)).map(k => {
              const minutes = directById.get(k.id)!;
              return (
                <div key={k.id} className="flex items-center justify-between text-[12px] tracking-[-0.2px] min-w-0">
                  <span className="text-gray-1000 font-medium truncate">{k.short}</span>
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-gray-1000 flex-shrink-0 ml-1">
                    <Plane className="w-2.5 h-2.5 text-primary-600" strokeWidth={2.4} />
                    {formatFlightDuration(minutes, 'short')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 닫기 */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-500"
        aria-label="닫기"
      >
        ×
      </button>
    </MapBottomCard>
  );
}
