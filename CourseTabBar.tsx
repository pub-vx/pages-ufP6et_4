export type CourseTab = 'teetime' | 'info';

interface CourseTabBarProps {
  activeTab: CourseTab;
  onTabChange: (tab: CourseTab) => void;
}

const TABS = [
  { key: 'teetime' as const, label: '티타임' },
  { key: 'info' as const, label: '골프장 정보' },
];

/**
 * 골프장 상세 페이지 탭바 — 티타임 / 골프장 정보.
 *
 * 포털(booking-portal) `/golf` 상세의 `.tab_navigation` 스타일을 그대로 차용:
 *  - 좌측 정렬 + 탭 간 gap 24px (전체폭 균등분할 아님)
 *  - 탭 텍스트 16px / 700 / letter-spacing -0.5px, 비활성 #9EABBA → 활성 #272833
 *  - 활성 탭은 "텍스트 폭만큼" 하단 2px 인디케이터(#272833)
 *  - 상단 6px 회색 구분선(#F0F2F5) + 하단 1px 보더(#E5E7EB)
 *
 * sticky: AppHeader(48/96px) 바로 아래에 고정(rt-sticky-top-12). z-40 으로 스크롤 중에도 노출.
 */
export function CourseTabBar({ activeTab, onTabChange }: CourseTabBarProps) {
  return (
    <div className="rt-sticky-top-12 z-40 bg-white">
      <div className="flex gap-6 px-5 pt-2.5 border-t-[6px] border-t-gray-10 border-b border-b-[#E5E7EB]">
        {TABS.map(tab => {
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`relative py-3.5 text-[16px] tracking-[-0.5px] whitespace-nowrap transition-colors ${
                active ? 'text-gray-1000 font-bold' : 'text-gray-300 font-medium'
              }`}
              aria-current={active ? 'true' : undefined}
            >
              {tab.label}
              {active && (
                // 텍스트 폭만큼 언더라인 — 하단 보더(1px)와 같은 베이스라인에 2px 얹힘
                <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-gray-1000" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
