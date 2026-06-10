import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { airports } from '../data/mockData';
import { SectionHeader } from './SectionHeader';
import {
  getDirectKoreanDepartures,
  formatDirectLabel,
} from '../data/flightDurations';
import { useAppState } from '../data/store';
import { SubtleCard } from './SubtleCard';

/**
 * 도착 공항 기준으로 골프장 찾기. 도착지(일본) 관점이 1차축.
 *
 * UX:
 *  - 1차: 나라 탭 (jp/vn/hi/tw/my) — 현재는 jp 만 활성
 *  - 본문: 한국 직항이 있는 일본 공항 카드만 노출, 직항 노선 수 많은 순 → ICN 비행시간 짧은 순
 *  - 카드 라벨: "ICN 직항" / "ICN 외 N 직항"
 *  - 카드 탭 → /map?airport={id} 공항 포커스 진입 (지도 하단에서 한국 출발지별 직항 매트릭스 확인 가능)
 *
 * 환승 노선은 노출하지 않음 — 공공데이터 노선 정보로 직항 매트릭스만 정확히 보장 가능하기 때문.
 * 직항이 없는 공항/지역은 /map 에서 인근 직항 공항을 통해 탐색하는 것을 가정.
 */
export function ArrivalAirportFinder() {
  const navigate = useNavigate();
  const { setSelectedCountries, setSelectedRegions, setSelectedSubRegions } = useAppState();

  /**
   * 한국에서 직항이 있는 일본 공항 목록.
   * 정렬: 1차 — 직항 노선 수 desc / 2차 — ICN 비행시간 asc (가까운 공항 우선)
   */
  const directAirports = useMemo(() => {
    return airports
      .map(a => ({ airport: a, directs: getDirectKoreanDepartures(a.id) }))
      .filter(x => x.directs.length > 0)
      .sort((a, b) => {
        if (b.directs.length !== a.directs.length) return b.directs.length - a.directs.length;
        return a.directs[0].minutes - b.directs[0].minutes;
      });
  }, []);

  const handleCardClick = (airportId: string) => {
    setSelectedCountries(['jp']);
    setSelectedRegions([]);
    setSelectedSubRegions([]);
    navigate(`/map?airport=${airportId}`);
  };

  /** "모두보기" — 일본 전 권역 지도로 진입 (공항 포커스 없음) */
  const handleViewAll = () => {
    setSelectedCountries(['jp']);
    setSelectedRegions([]);
    setSelectedSubRegions([]);
    navigate('/map');
  };

  return (
    <div className="bg-white py-4">
      {/* 타이틀 + 모두보기 (일본 단독 — 나라 탭 제거) */}
      <SectionHeader title="공항 근처 골프장, 지도로 찾아봐요" onMore={handleViewAll} />

      {/* 두 상태(직항 공항 strip / 준비중 placeholder) 공통 컨테이너 셸 —
          min-h-[100px] 로 카드 높이(~88px) + 패딩을 흡수해 들썩임 방지. */}
      <div className="min-h-[100px] overflow-x-auto scrollbar-hide rt-section-pad">
        {directAirports.length === 0 ? (
          <div className="min-h-[100px] flex items-center justify-center">
            <p className="text-[13px] text-ink-light tracking-[-0.2px]">
              직항 공항 정보가 아직 준비 중이에요.
            </p>
          </div>
        ) : (
          <div className="flex gap-2 w-max">
            {directAirports.map(({ airport }) => {
              return (
                <SubtleCard
                  key={airport.id}
                  as="button"
                  onClick={() => handleCardClick(airport.id)}
                  className="flex-shrink-0 w-[160px] p-3 text-left hover:border-ink transition-colors"
                >
                  {/* 1순위: 지역명(현·도) — 사용자는 "어디로 가는지(지역)" 를 먼저 인지.
                      검정 계열(text-ink) + extrabold. 14px 로 -1 (섹션 타이틀 16과 위계 분리). */}
                  <p className="text-[14px] font-bold text-ink tracking-[-0.3px] leading-snug truncate">
                    {airport.prefecture}
                  </p>
                  {/* 2순위: 공항명 (+ 코드) — 보조 정보로 회색 톤. 13px (MD 카드 권역 라인과 동일) */}
                  <p className="mt-0.5 text-[13px] font-medium text-ink-mid tracking-[-0.2px] truncate">
                    {airport.name}
                    <span className="ml-1 text-ink-light">({airport.code})</span>
                  </p>
                  {/* 직항 라벨 — medium 체. 13px */}
                  <p className="mt-2 text-[13px] font-medium text-ink tracking-[-0.2px]">
                    {formatDirectLabel(airport.id)}
                  </p>
                </SubtleCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
