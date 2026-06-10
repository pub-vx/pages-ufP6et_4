import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { Plane, MapPin, X } from 'lucide-react';
import { TopSearchBar } from './TopSearchBar';
import { GolfCourseList } from './GolfCourseList';
import { SearchFilterControls } from './SearchFilterControls';
import { useAppState } from '../data/store';
import { CURATIONS, shortCurationLabel } from '../lib/curations';
import { DEFAULT_FILTER, DEFAULT_PRICE_RANGE } from './filterConfig';
import { LegalFooter } from './LegalFooter';

/**
 * 항공편/공항 컨텍스트 안내 바 — FaqBanner 아래에 노출되는 컴팩트 info bar.
 * 컨텍스트 해제 [×] 시 권역 필터를 전체로 복원하고 검색어/공항 컨텍스트도 비움.
 */
function AirportContextInfoBar() {
  const { arrivalContext, setArrivalContext, setSelectedRegions } = useAppState();
  if (!arrivalContext) return null;
  const isFlight = !!arrivalContext.flightCode;
  const airportShort = arrivalContext.airportName.replace(/ ?공항$/, '');
  const handleClear = () => {
    setArrivalContext(null);
    setSelectedRegions(['규슈', '간토', '간사이', '주부', '홋카이도', '오키나와', '도호쿠', '시코쿠', '주고쿠']);
  };
  return (
    <div className="px-4 py-2 bg-primary-100 border-y border-primary-200 flex items-center gap-2">
      <p className="flex-1 min-w-0 text-[13px] font-medium text-primary-700 inline-flex items-center gap-1 truncate">
        {isFlight ? (
          <>
            <Plane className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{arrivalContext.flightCode} · {airportShort} {arrivalContext.arrivalTime} 도착 기준</span>
          </>
        ) : (
          <>
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{arrivalContext.airportName} 기준</span>
          </>
        )}
      </p>
      <button
        onClick={handleClear}
        className="w-5 h-5 rounded-full bg-primary-300 flex items-center justify-center hover:bg-[#9EE0C0] transition-colors flex-shrink-0"
        aria-label="컨텍스트 지우기"
      >
        <X className="w-3 h-3 text-white" strokeWidth={2.5} />
      </button>
    </div>
  );
}

/** 활성 퀵큐레이션 상태를 알려주는 배너 — 큐레이션 진입 시 본문 슬롯에 노출 */
function ActiveCurationBanner() {
  const { quickCuration } = useAppState();
  const cur = CURATIONS.find(c => c.id === quickCuration);
  if (!cur) return null;

  return (
    <div className="px-5 py-2.5 bg-white">
      <div className="w-full flex items-center gap-[7px] bg-gray-10 rounded-[4px] px-4 py-2.5">
        <span className="flex-shrink-0" style={{ fontSize: 18, lineHeight: 1 }}>{cur.icon}</span>
        <span className="flex-1 text-left text-[14px] text-gray-1000 tracking-[-0.66px] truncate">
          <span className="font-medium">{shortCurationLabel(cur.title)}</span>
          <span className="font-medium"> {cur.title.replace(/\?$/, '')} 필터가 적용되어 있어요</span>
        </span>
      </div>
    </div>
  );
}

/**
 * 검색 결과 페이지 상단 원형 퀵필터 행.
 * - 홈 큐레이션과 동일한 항목들을 가로 스와이프로 노출
 * - 활성(`quickCuration`) 항목은 primary-600 원형 + 라벨 강조
 * - 같은 항목 다시 탭하면 해제, 다른 항목 탭하면 토글 전환
 */
function QuickCurationFilters() {
  const { quickCuration, setQuickCuration, setFilterState, setSortBy } = useAppState();

  const handleClick = (id: string) => {
    const cur = CURATIONS.find(c => c.id === id);
    if (!cur) return;
    if (quickCuration === id) {
      // 동일 항목 토글 → 해제. 큐레이션이 정렬을 덮어쓴 경우엔 추천순으로 복귀하여 "필터 적용 전" 상태가 보이게 함
      setQuickCuration(null);
      setFilterState(DEFAULT_FILTER);
      if (cur.sortBy) setSortBy('recommended');
      return;
    }
    setFilterState({
      timeSlots: [],
      playStyles: cur.playStyles ?? [],
      inclusions: cur.inclusions ?? [],
      priceRange: DEFAULT_PRICE_RANGE,
    });
    // 정렬 처리:
    //  - 새 큐레이션이 명시적 sortBy를 가지면 그걸 적용
    //  - 이전 큐레이션이 sortBy로 정렬을 덮어쓴 상태였다면 새 큐레이션엔 sortBy가 없더라도 추천순으로 리셋
    //    (e.g. 공항 인근 → 2인 라운드 전환 시 'airport' 정렬이 잔존하는 버그 방지)
    const prevCur = quickCuration ? CURATIONS.find(c => c.id === quickCuration) : null;
    if (cur.sortBy) {
      setSortBy(cur.sortBy);
    } else if (prevCur?.sortBy) {
      setSortBy('recommended');
    }
    setQuickCuration(id);
  };

  return (
    <div className="bg-white border-b border-gray-10">
      <div className="relative">
        <div className="flex gap-0.5 overflow-x-auto px-3 py-2 scrollbar-hide">
          {CURATIONS.map(cur => {
            const active = quickCuration === cur.id;
            return (
              <button
                key={cur.id}
                onClick={() => handleClick(cur.id)}
                className="flex-shrink-0 flex flex-col items-center gap-1 px-2 min-w-[60px]"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center bg-gray-10 transition-colors ${
                    active ? 'ring-2 ring-primary-600' : ''
                  }`}
                >
                  <span style={{ fontSize: 20 }}>{cur.icon}</span>
                </div>
                <p className={`text-center leading-tight whitespace-nowrap text-[11px] font-medium tracking-[-0.2px] ${
                  active ? 'text-primary-600' : 'text-gray-1000'
                }`}>
                  {shortCurationLabel(cur.title)}
                </p>
              </button>
            );
          })}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

export function MainPage() {
  const location = useLocation();
  const {
    arrivalContext, setArrivalContext,
    setSortBy,
    quickCuration, setQuickCuration,
    setFilterState,
    selectedCountries,
  } = useAppState();
  // 퀵필터(초보 추천 / 2인 라운드 등)는 일본 전용 — 다른 나라 선택 시 미노출
  const countryCode = selectedCountries[0] ?? 'jp';
  const isJapanContext = countryCode === 'jp';

  // 나라 변경 시 스크롤 최상단 — 이전 나라의 스크롤 위치가 남아 새 결과가 잘려보이는 현상 방지
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [countryCode]);

  // 항공편(Tab A) 또는 지도 → 목록 전환 외 다른 진입에서는 컨텍스트 자동 정리
  // 공항 컨텍스트로 진입한 경우 자동으로 "공항으로부터 가까운순" 정렬
  // 큐레이션 진입의 경우 quickCuration / filterState 는 유지
  useEffect(() => {
    const state = location.state as
      | { fromFlight?: boolean; fromMap?: boolean; fromCuration?: boolean }
      | null;
    const fromAirportContext = state?.fromFlight || state?.fromMap;
    const fromCuration = !!state?.fromCuration;

    // 공항 컨텍스트(항공편/지도)로 진입한 경우만 공항 기준 정렬 자동 적용
    if (fromAirportContext && arrivalContext) {
      setSortBy('airport');
    }
    if (!fromAirportContext && arrivalContext) {
      setArrivalContext(null);
    }
    // 큐레이션 진입이 아니면 활성 퀵큐레이션은 정리
    if (!fromCuration && quickCuration) {
      setQuickCuration(null);
      setFilterState(DEFAULT_FILTER);
    }
    // 페이지 진입 시 스크롤 최상단 (홈에서 큐레이션 카드 누르면 그 위치 그대로 전환되는 현상 방지)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // 퀵큐레이션 활성 시에만 ActiveCurationBanner 노출, 그 외엔 슬롯 비워둠
  const slot = !arrivalContext && quickCuration ? <ActiveCurationBanner /> : null;

  return (
    // 리스트 영역 바탕 흰색 — 골프장 카드(흰색 + 하단 보더)가 흰 바탕 위 구분선 리스트로 보임 (포털 golf_list 톤)
    <div className="bg-white">
      <TopSearchBar />
      {/* 본문 — 데스크톱(≥1120)에서 1080 센터링 (포털 #container) */}
      <div className="rt-content-wrap">
        {/* 페이지 컨텍스트 슬롯: 공항 진입 시엔 AirportContextInfoBar 노출.
            퀵필터(QuickCurationFilters) 행은 MVP에서는 제거할 예정 — 복구 시 아래 주석 해제:
            {arrivalContext ? <AirportContextInfoBar /> : (isJapanContext ? <QuickCurationFilters /> : null)} */}
        {arrivalContext ? <AirportContextInfoBar /> : null}
        <SearchFilterControls />
        {slot}
        <GolfCourseList />
      </div>
      <LegalFooter />
    </div>
  );
}
