/**
 * 포털(booking-portal) 헤더 아이콘 — 마스터 코드 public/images/*.svg 의 path 를 그대로 인라인.
 *  - stroke 는 currentColor 로 받아 text-* 유틸로 색 제어 (포털 원본은 #272833)
 *  - 마스터: icon_prev_main.svg(뒤로) / icon_home.svg(홈) / icon_search.svg(검색) / icon_menu_main.svg(메뉴)
 */

interface IconProps {
  className?: string;
}

/** 뒤로가기 — 포털 icon_prev_main.svg (chevron) */
export function IconBack({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16.5 21l-9-9 9-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 홈 — 포털 icon_home.svg */
export function IconHome({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 25 25" fill="none" aria-hidden="true">
      <path
        d="M22.085 9.533l-8.962-6.698a1.028 1.028 0 00-1.246 0L2.915 9.533a1.05 1.05 0 00-.415.83v9.928c0 1.142.935 2.077 2.077 2.077h5.742v-6.293a2.18 2.18 0 114.362 0v6.293h5.742a2.083 2.083 0 002.077-2.077v-9.927c0-.333-.156-.634-.415-.83z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 검색 — 포털 icon_search.svg */
export function IconSearch({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.7053 18.5847C15.0131 18.5847 18.5053 15.0567 18.5053 10.7047C18.5053 6.3527 15.0131 2.82471 10.7053 2.82471C6.39745 2.82471 2.90527 6.3527 2.90527 10.7047C2.90527 15.0567 6.39745 18.5847 10.7053 18.5847Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M16.5352 16.5747L21.0952 21.1747" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 메뉴(햄버거) — 다른 헤더 아이콘과 동일 기준(24×24 · strokeWidth 1.6)으로 정규화 */
export function IconMenu({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
