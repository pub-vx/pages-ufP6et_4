/**
 * 맞춤 골프장 검색(FilterSheet) 의 타입·상수·헬퍼.
 *
 * ⚠️ FilterSheet.tsx(컴포넌트)에서 분리한 이유:
 *  Vite React Fast Refresh 는 "모듈이 컴포넌트만 export" 할 때만 HMR 이 동작한다.
 *  컴포넌트 + 비컴포넌트(상수/타입/함수)를 한 파일에 섞으면 매 수정마다 전체 리로드로 떨어지고
 *  store ↔ FilterSheet 순환 import 와 겹쳐 흰 화면이 발생했다.
 *  → 비컴포넌트는 이 파일로, FilterSheet.tsx 는 컴포넌트만 export 하도록 분리.
 *  (이 파일은 store 를 import 하지 않으므로 순환도 끊긴다)
 */

export interface FilterState {
  timeSlots: string[];
  /** QuickCuration 호환 유지 — FilterSheet UI 에는 노출하지 않고 통과/초기화만 한다 */
  playStyles: string[];
  inclusions: string[];
  priceRange: [number, number];
}

/** 1인 라운드 가격 슬라이더 범위 (JPY) — 시드 데이터 분포에 맞춘 기본 구간 */
export const PRICE_RANGE_MIN = 5000;
export const PRICE_RANGE_MAX = 25000;
export const DEFAULT_PRICE_RANGE: [number, number] = [PRICE_RANGE_MIN, PRICE_RANGE_MAX];

/** 시간대 옵션 — 디폴트는 전체 선택(아래에서 일부 해제하는 식으로 좁힘) */
export const ALL_TIME_SLOTS = ['새벽', '오전', '오후'];

export const DEFAULT_FILTER: FilterState = {
  timeSlots: [...ALL_TIME_SLOTS],   // 전체 선택이 디폴트
  playStyles: [],
  inclusions: [],
  priceRange: DEFAULT_PRICE_RANGE,
};

export function getActiveFilterCount(state: FilterState): number {
  // 시간대는 "좁혔을 때(부분 선택)"만 활성으로 카운트 — 전체(3)/전체해제(0)는 미적용과 동일
  const timeActive = state.timeSlots.length > 0 && state.timeSlots.length < ALL_TIME_SLOTS.length
    ? state.timeSlots.length
    : 0;
  return timeActive
    + state.playStyles.length
    + state.inclusions.length
    + (state.priceRange[0] !== PRICE_RANGE_MIN || state.priceRange[1] !== PRICE_RANGE_MAX ? 1 : 0);
}
