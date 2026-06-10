// 가격 표시 공용 유틸 + 컴포넌트
// JPY/KRW 듀얼 표시 패턴이 GolfCourseCard, SelectedCourseCard, CourseDetailPage,
// CheckoutPage 등에서 반복되므로 한 곳에서 관리.
import { formatJpy, formatKrw, jpyToKrw } from '../data/mockData';

/** remainingTeams 가 1팀이면 가격 끝 `~` 를 떼어 표기 */
export function priceTilde(remainingTeams: number): string {
  return remainingTeams > 1 ? '~' : '';
}

interface PriceDualProps {
  /** JPY (엔) 기준 가격 */
  jpy: number;
  /** "잔여 1팀이면 ~ 떼기" 처리용 */
  remainingTeams?: number;
  /** 보조 라인 prefix (예: "1인 ", "약 ") */
  secondaryPrefix?: string;
  /** 사이즈 변형 (엔화 메인: sm=14 / md=15 / base=16) */
  size?: 'sm' | 'md' | 'base';
}

/** 듀얼 가격 표시 (1줄: JPY 메인, 2줄: KRW 보조) */
export function PriceDual({
  jpy,
  remainingTeams = 2,
  secondaryPrefix,
  size = 'base',
}: PriceDualProps) {
  const krw = jpyToKrw(jpy);
  const tilde = priceTilde(remainingTeams);
  const jpyText = formatJpy(jpy);
  const krwText = formatKrw(krw);
  const mainSize = size === 'base' ? 'text-[16px]' : size === 'md' ? 'text-[15px]' : 'text-[14px]';
  const subSize = size === 'base' ? 'text-[11px]' : size === 'md' ? 'text-[11px]' : 'text-[10px]';

  return (
    <div>
      <div className={`${mainSize} font-medium text-[#272833] leading-tight`}>
        {jpyText}{tilde}
      </div>
      <div className={`${subSize} text-[#9EABBA] leading-tight mt-0.5`}>
        {secondaryPrefix ?? '약 '}{krwText}{tilde}
      </div>
    </div>
  );
}
