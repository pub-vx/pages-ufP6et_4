import type { ReactNode } from 'react';

/**
 * 지도 하단 카드(골프장/공항) 공용 셸.
 * - 중앙 정렬. 같은 바닥선(bottom-20) 우하단의 줌 컨트롤과 겹치지 않도록 폭을
 *   `calc(100%-128px)`로 자동 축소(우측 컨트롤 자리 64px + 중앙 대칭 64px), 최대 440px.
 * - 넓은 화면에선 max-width로 중앙 정렬, 좁아지면 자동으로 줄어 컨트롤을 비킴.
 * - data-map-card: 레이아웃 측정/테스트 훅.
 * 포지셔닝·박스 스타일을 한 곳에서 관리해 두 카드가 항상 동일하게 동작.
 */
export function MapBottomCard({ children }: { children: ReactNode }) {
  return (
    <div
      data-map-card
      className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-128px)] max-w-[440px] z-[450] bg-white rounded-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.10)] border border-gray-100 overflow-hidden"
    >
      {children}
    </div>
  );
}
