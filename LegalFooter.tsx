import { useLocation } from 'react-router';

/**
 * 회사 정보 푸터 — 포털(booking-portal) AppFooter 구조 차용.
 *
 *  1) 법적고지 (gray-10 밴드)
 *  2) 하단 영역 (gray-5 밴드): 회사정보·고객센터 / 약관 링크 / 사업자 등록정보 / 저작권
 *
 * ※ 노출 위치: 메인(홈 탐색 탭 = /realtime · /packages) 에서만.
 *    그 외 페이지(검색결과·상세·체크아웃 등)에서는 렌더링하지 않는다(null).
 */

/** 푸터를 노출할 메인 경로 */
const FOOTER_PATHS = ['/', '/realtime', '/packages'];

/** 약관·정책 링크 (포털 원본 href) */
const TERM_LINKS: { label: string; href: string; bold?: boolean }[] = [
  { label: '통합 이용약관', href: 'http://www.kakaovx.com/agreement.php?type=terms' },
  { label: '위치기반 서비스 이용약관', href: 'http://kakaovx.com/agreement.php?type=location', bold: true },
  { label: '개인정보처리방침', href: 'http://www.kakaovx.com/agreement.php?type=privacy', bold: true },
  { label: '예약매니저 서비스 이용약관', href: 'https://cf-images.kakao.golf/reservationManager/terms/manager_terms_terms_2023_04.html' },
  { label: '골프예약 멤버십 이용약관', href: 'https://cf-images.kakao.golf/appText/terms_membership.html' },
];

export function LegalFooter() {
  const { pathname } = useLocation();
  // 메인(홈 탐색 탭)에서만 노출
  if (!FOOTER_PATHS.includes(pathname)) return null;

  return (
    <footer className="rt-full-bleed mt-auto">
      {/* 1) 법적고지 — gray-10 밴드 */}
      <div className="bg-surface-soft py-5">
        <div className="rt-content-wrap rt-section-pad px-5">
          <p className="text-[12px] font-medium text-gray-500 tracking-[-0.2px] leading-relaxed break-keep">
            <span className="font-medium text-gray-600">법적고지</span>
            <br />
            (주)카카오VX는 통신판매중개시스템의 제공자로서, 통신판매의 당사자가 아니며 상품의 예약 및 결제, 환불 등과 관련한 의무는 각 판매자(골프장)에 있습니다.
          </p>
        </div>
      </div>

      {/* 2) 하단 영역(회사정보/고객센터/약관/사업자정보/저작권) — MVP에서는 제거.
          법적고지(밴드1)만 노출. 복구 시 아래 주석 해제.
      <div className="bg-gray-5 px-5 pt-10 pb-10">
        <div className="rt-content-wrap rt-section-pad">
          <h4 className="text-[14px] font-medium text-gray-1000 tracking-[-0.3px] mb-3.5">(주)카카오 VX</h4>
          <div className="mb-4">
            <p className="text-[13px] tracking-[-0.2px]">
              <span className="font-medium text-gray-1000 mr-2">고객센터</span>
              <span className="font-medium text-gray-500">1668-3819</span>
            </p>
            <p className="text-[12px] font-medium text-gray-500 tracking-[-0.2px] mt-1">
              주중: 10시 ~ 18시 (점심시간: 12시~13시)
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-4">
            {TERM_LINKS.map(t => (
              <a
                key={t.label}
                href={t.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-[12px] tracking-[-0.2px] text-gray-500 hover:text-gray-1000 transition-colors ${t.bold ? 'font-medium' : 'font-medium'}`}
              >
                {t.label}
              </a>
            ))}
          </div>
          <p className="text-[12px] font-medium text-gray-500 tracking-[-0.2px] leading-relaxed break-keep mb-1">
            공동대표: 문태식, 김창준
            <span className="mx-1.5 text-gray-300">|</span>
            사업자등록번호 : 144-81-03460
            <span className="mx-1.5 text-gray-300">|</span>
            통신판매업신고번호: 2012-경기성남-1139
          </p>
          <p className="text-[12px] font-medium text-gray-500 tracking-[-0.2px] mb-3">
            경기도 성남시 분당구 판교로255번길 68(삼평동) 유비쿼스빌딩 4F
          </p>
          <p className="text-[11px] font-medium text-gray-400 tracking-[-0.1px]">
            Copyright © Kakao VX Corp. All rights reserved
          </p>
        </div>
      </div>
      */}
    </footer>
  );
}
