import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronDown, ChevronUp, Info, MapPin, Map } from 'lucide-react';
import { DateStrip } from './DateStrip';
import { SearchModal } from './SearchModal';
import { RegionPickerA } from './region-picker/RegionPickerA';
import { AppHeader } from './AppHeader';
import { useAppState } from '../data/store';
import { getCountriesIn } from '../lib/countries';

export function TopSearchBar() {
  const navigate = useNavigate();
  const {
    selectedCountries,
    selectedRegions,
    selectedSubRegions,
    arrivalContext,
  } = useAppState();
  const currentCountry = getCountriesIn(selectedCountries)[0];
  const countryLabel = currentCountry?.name ?? '일본';

  /**
   * 권역 상태 라벨 — 세부지역(2차) 선택이 있으면 그것을 우선 노출, 없으면 1차 권역.
   *  · 세부 선택: "후쿠오카, 오이타" / "후쿠오카, 오이타 외 1"
   *  · 1차만: "전체" / "규슈" / "규슈, 간토 외 1"
   *  (최대 2개 이름 + 나머지 "외 N")
   */
  const formatPicked = (arr: string[]): string => {
    const shown = arr.slice(0, 2).join(', ');
    const rest = arr.length - 2;
    return rest > 0 ? `${shown} 외 ${rest}` : shown;
  };
  const allRegionIds = currentCountry?.regions.map(r => r.id) ?? [];
  const selInCountry = selectedRegions.filter(r => allRegionIds.includes(r));
  // 현재 나라의 유효 세부지역 라벨 집합 (표시 라벨 기준)
  const allSubs = new Set(
    currentCountry?.regions.flatMap(r => r.displaySubRegions ?? r.subRegions) ?? []
  );
  const selSubsInCountry = selectedSubRegions.filter(s => allSubs.has(s));

  let regionLabel: string;
  if (selSubsInCountry.length > 0) {
    // 세부지역 선택 시 — 세부지역명을 우선 노출
    regionLabel = formatPicked(selSubsInCountry);
  } else if (selInCountry.length === 0 || selInCountry.length === allRegionIds.length) {
    regionLabel = '전체';
  } else if (selInCountry.length === 1) {
    regionLabel = selInCountry[0];
  } else {
    regionLabel = formatPicked(selInCountry);
  }
  // 최종 타이틀 라벨 — 예: "일본 전체", "일본 규슈"
  const titleLabel = `${countryLabel} ${regionLabel}`;

  const [showCalcInfo, setShowCalcInfo] = useState(false);
  const [regionSheetOpen, setRegionSheetOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  // 항공편 컨텍스트 여부 (도착 시각 계산 안내 노출 조건)
  const isFlight = !!arrivalContext?.flightCode;

  return (
    <>
      {/* 타이틀 바 — 좌 뒤로 / 중앙 타이틀(고정) / 우 홈·메뉴(포털 AppHeader 동일).
          검색은 타이틀 바에서 빼고, 아래 지역 셀렉터 행 우측으로 이동(아래 children). */}
      <AppHeader
        onBack={handleBack}
        border={false}
        title="실시간 골프장 목록"
        showHome
      >
        {/* 헤더 서브 영역(지역 셀렉터 + 날짜) — 데스크톱(≥1120)에서 1080 센터 (포털 header_inner) */}
        <div className="rt-header-inner">
        {/* 지역 셀렉터 행 — 좌측 권역 선택(어디로 바텀시트) / 우측 검색.
            하단 구분선(border-b) 제거 — 앞 위치 아이콘(MapPin)으로 "지역 선택" 의미 전달. */}
        <div className="flex items-center justify-between pl-4 pr-2 py-2">
          <button
            onClick={() => setRegionSheetOpen(true)}
            className="flex items-center gap-1.5 min-w-0"
          >
            <MapPin className="w-4 h-4 flex-shrink-0 text-primary-600" strokeWidth={2.2} />
            <span className="text-[15px] font-medium text-gray-1000 tracking-[-0.3px] truncate">{titleLabel}</span>
            <ChevronDown
              className={`w-4 h-4 flex-shrink-0 text-gray-600 transition-transform ${regionSheetOpen ? 'rotate-180' : ''}`}
              strokeWidth={2.2}
            />
          </button>
          {/* 지도보기 — 현재 권역·날짜·예약가능 필터를 그대로 물고 지도(/map)로 전환.
              (필터·날짜·권역은 전역 store라 별도 전달 없이 유지됨. 공항 컨텍스트는 없음) */}
          <button
            onClick={() => navigate('/map')}
            className="flex-shrink-0 inline-flex items-center gap-1 pl-2.5 pr-3 h-8 rounded-full border border-gray-100 text-[13px] font-medium text-gray-700 tracking-[-0.2px] hover:bg-gray-5 transition-colors"
            aria-label="지도보기"
          >
            <Map className="w-4 h-4 text-primary-600" strokeWidth={2.2} />
            지도보기
          </button>
        </div>

        {/* 항공편 모드일 때 도착 시각 계산 안내 */}
        {isFlight && (
          <div className="px-4 py-1.5 bg-gray-5 border-b border-gray-10">
            <button
              onClick={() => setShowCalcInfo(s => !s)}
              className="w-full flex items-center gap-1 text-left"
            >
              <Info className="w-3 h-3 text-gray-300 flex-shrink-0" />
              <span className="text-[11px] text-gray-500 flex-1">
                골프장 도착 시각은 <span className="font-medium">입국 60분 + 평균 60km/h</span> 기준 추정값
              </span>
              {showCalcInfo ? <ChevronUp className="w-3 h-3 text-gray-300" /> : <ChevronDown className="w-3 h-3 text-gray-300" />}
            </button>
            {showCalcInfo && (
              <div className="mt-2 p-2.5 bg-white rounded-[8px] border border-gray-50 text-[11px] text-gray-500 leading-relaxed">
                <p className="font-medium text-gray-1000 mb-1">계산 공식</p>
                <p>골프장 도착 = <span className="text-gray-1000 font-medium">항공편 도착시각 + 60분(입국수속) + 이동시간</span></p>
                <p className="mt-1">이동시간 = 직선거리(km) ÷ 60km/h</p>
                <p className="mt-2 text-gray-300">
                  ※ 실제 도로 굴곡, 입국 혼잡도, 시내 정체 등에 따라 달라질 수 있어요. 여유 있게 일정을 잡아주세요.
                </p>
              </div>
            )}
          </div>
        )}

        <DateStrip />
        </div>
      </AppHeader>

      <SearchModal open={searchModalOpen} onClose={() => setSearchModalOpen(false)} />

      {/* 타이틀(나라·권역) 클릭 → 어디로 바텀시트 (나라 + 1·2차 권역 + 지도) */}
      <RegionPickerA open={regionSheetOpen} onOpenChange={setRegionSheetOpen} />
    </>
  );
}
