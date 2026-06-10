import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { IconSearch } from './icons';
import { SearchModal } from './SearchModal';
import { LegalFooter } from './LegalFooter';
import { AppHeader } from './AppHeader';
import { TabStrip } from './TabStrip';

interface Props {
  children: ReactNode;
}

/**
 * v3 진입 화면. v2의 큐레이션 홈을 대체한다.
 *
 * 상단 구조:
 *   1) 슬림 헤더: 뒤로 / 타이틀(해외 골프 투어) / 예약내역 아이콘
 *   2) 탭바: [실시간 예약 | 패키지] — 활성 탭 underline
 *
 * 본문은 라우트별 페이지(RealtimeSearchPage 또는 PackagesSearchPage)가 children으로 들어온다.
 */
export function ExploreTabsPage({ children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  type HomeTabKey = 'realtime' | 'packages';
  const activeKey: HomeTabKey = location.pathname.startsWith('/packages') ? 'packages' : 'realtime';

  return (
    <div className="min-h-screen bg-white">
      {/* 슬림 헤더 — 홈은 뒤로/타이틀/검색·예약내역 (홈 버튼 없음) */}
      {/* 슬림 헤더 — 우측은 공통 [홈]+[햄버거]. 검색은 아래 탭 줄로(앱웹에서 타이틀바 숨겨져도 유지) */}
      <AppHeader
        title="해외 골프 투어"
        border={false}
        showHome
      >
        {/* 상단 탭 — 공용 TabStrip 사용. h-12 명시로 타이틀 행 h-12 + 탭 행 h-12 = 96px (top-24).
            패키지 탭의 CountryTabStrip (sticky top-24) 와 픽셀 단위로 맞아 갭 제거. */}
        <TabStrip
          tabs={[
            { key: 'realtime', label: '티타임' },
            { key: 'packages', label: '패키지' },
          ]}
          activeKey={activeKey}
          onChange={(key) => navigate(`/${key}`)}
          align="start"
          rightAccessory={
            // 검색 — 두 탭(티타임/패키지) 공통 액션. 타이틀바가 아닌 탭 줄에 둬서 앱웹에서도 유지.
            <button onClick={() => setSearchModalOpen(true)} className="p-1 -mr-1" aria-label="검색">
              <IconSearch className="w-6 h-6 text-gray-1000" />
            </button>
          }
        />
      </AppHeader>

      {/* 본문 — 데스크톱(≥1120)에서 1080 센터링 (포털 #container) */}
      <div className="rt-content-wrap">{children}</div>

      <LegalFooter />
      {/* LegalFooter 아래 여백 — LegalFooter 와 동일 톤(surface-soft)으로 시각 연결.
          외곽이 흰색이라 별도 bg 지정 필요. pb-12 외곽 패딩을 이 spacer 로 대체. */}
      <div className="h-12 bg-surface-soft" />
      <SearchModal open={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </div>
  );
}
