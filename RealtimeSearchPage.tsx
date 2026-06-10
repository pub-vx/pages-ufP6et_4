import { ExploreTabsPage } from './ExploreTabsPage';
import { SearchInputCard } from './SearchInputCard';
import { HomeReservationEntry } from './HomeReservationEntry';
import { ArrivalAirportFinder } from './ArrivalAirportFinder';
import { MDPicks } from './MDPicks';
// MVP에서는 제거할 예정 — "이런 골프장은 어때요?" 큐레이션 영역
// import { CurationGradientCards } from './CurationGradientCards';

/**
 * v3 실시간 탭 홈 — 탐색(discovery) 페이지.
 *
 * 영역 구성 (분리선 없이 연속):
 *  1) 검색 입력 카드 + 검색 CTA
 *  2) MD 추천 상품
 *  3) 공항 기준으로 일본 티타임 탐색 (출발 공항 선택 → 도착 공항 카드 → /map?airport=)
 *  4) 이런 골프장은 어때요? (큐레이션 카드)
 *
 * 일본 단독 제공 — 나라 선택 그리드/나라 탭은 제거됨.
 */
export function RealtimeSearchPage() {
  return (
    <ExploreTabsPage>
      <SearchInputCard showSearchButton />
      {/* 검색 CTA 바로 아래 — 다가오는 라운드 요약 배너(C-2) 또는 "내 예약 보기" 링크(D) */}
      <HomeReservationEntry />
      <MDPicks />
      <ArrivalAirportFinder />
      {/* MVP에서는 제거할 예정 — "이런 골프장은 어때요?" 큐레이션 카드 영역 */}
      {/* <CurationGradientCards /> */}
      <div className="h-6 bg-white" />
    </ExploreTabsPage>
  );
}
