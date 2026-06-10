import { useState } from 'react';
import { useNavigate } from 'react-router';
import { IconHome, IconMenu } from './icons';

/**
 * 타이틀바 우측 공통 클러스터 — [홈] + [햄버거 메뉴].
 * 포털 AppHeader 표준(home + menu)을 모든 페이지에서 동일하게 쓰기 위한 공용 컴포넌트.
 * 메뉴 열림 상태/내비게이션은 내부에서 자체 관리.
 */

const MENU_ITEMS: { label: string; to: string }[] = [
  { label: '홈', to: '/' },
  { label: '나의 예약', to: '/my-reservations' },
  { label: '자주 묻는 질문', to: '/faq' },
];

export function HeaderMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => navigate('/')} className="p-1" aria-label="홈">
        <IconHome className="w-6 h-6 text-gray-1000" />
      </button>
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="p-1"
          aria-label="메뉴"
          aria-expanded={open}
        >
          <IconMenu className="w-6 h-6 text-gray-1000" />
        </button>
        {open && (
          <>
            {/* 바깥 클릭 닫기용 투명 백드롭 */}
            <button
              className="fixed inset-0 z-[60] cursor-default"
              aria-label="메뉴 닫기"
              onClick={() => setOpen(false)}
            />
            {/* 드롭다운 — 포털 menu_layer 톤(흰 배경·라운드·그림자) */}
            <div className="absolute right-0 top-full mt-2 z-[61] min-w-[160px] bg-white rounded-[4px] shadow-[0_4px_20px_rgba(0,0,0,0.09)] py-3 pl-5 pr-7">
              <ul className="space-y-4">
                {MENU_ITEMS.map(item => (
                  <li key={item.to}>
                    <button
                      onClick={() => { setOpen(false); navigate(item.to); }}
                      className="text-[14px] font-medium text-gray-1000 tracking-[-0.3px] whitespace-nowrap hover:text-primary-600 transition-colors"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </>
  );
}
