import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Star } from 'lucide-react';
import { mockCourses, formatJpy, formatKrw, jpyToKrw } from '../data/mockData';
import { getParentRegion } from '../lib/regions';
import { SectionHeader } from './SectionHeader';

/** MD 추천 사유 — 시드 데이터의 모든 '추천' 태그 코스에 매핑. 누락 시 fallback 사유 사용 */
const MD_REASONS: Record<string, string> = {
  koga: '가성비 최강! 나리타 40분',
  century: '명문 코스 · 접근성 최고',
  kasumigaseki: '올림픽 개최지 · 프리미엄',
  abiko: '도심 접근성 · 초보자 추천',
  taiheiyo: '바다뷰 명문 · 프로 대회 코스',
  narita: '공항 10분 · 도착 당일 라운드',
  sakura: '벚꽃 코스 · 봄 시즌 인기',
  seve: '세베 바예스테로스 설계',
  fuji: '후지산 뷰 · 사계절 인기',
  sunrise: '규슈 대표 · 온천 료칸 연계',
  'osaka-tower': '오사카 시내 직결 · 야경 명문',
  'tokyo-bay': '도쿄 베이뷰 · 하네다 30분',
  'yokohama-royal': '요코하마 명문 · 챔피언십 코스',
  'kobe-bay': '고베 베이뷰 · 시내 직결',
  'niseko-royal': '리조트 명문 · 자작나무 코스',
};

/**
 * MD_REASONS 에 개별 사유가 없는 코스(주로 해외 코스)용 추천 사유 배리에이션 풀.
 * 유지보수: 문구를 추가/수정하기만 하면 되고, 코스 id 해시로 안정 매핑되어
 *           같은 코스는 항상 같은 사유가 노출된다(렌더마다 바뀌지 않음).
 */
const REASON_POOL: string[] = [
  '현지에서 손꼽히는 명문 코스',
  '한국인 골퍼 선호 1순위',
  '리조트 연계 · 휴양 골프',
  '시내 접근성 좋은 코스',
  '가성비 좋은 라운드',
  '바다뷰 · 시그니처 홀 보유',
  '초보자도 편안한 코스',
  '챔피언십 개최 코스',
  '공항 근처 · 당일 라운드',
  '온천·미식 연계 추천',
];

/** 코스 id → 추천 사유 (개별 사유 우선, 없으면 풀에서 결정론적 선택) */
function reasonFor(id: string): string {
  if (MD_REASONS[id]) return MD_REASONS[id];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return REASON_POOL[hash % REASON_POOL.length];
}

/**
 * 해외 골프 MD 추천 골프장 — 광고(추천) 노출 영역.
 * 타이틀 아래 나라 칩(일본/베트남/하와이/대만/말레이시아)으로 나라를 전환하면
 * 해당 나라의 추천 코스 가로 스크롤 리스트가 노출된다.
 */
export function MDPicks() {
  const navigate = useNavigate();

  // 일본 단독 제공 — MD 추천은 일본 코스 고정 (나라 탭 제거)
  const recommended = useMemo(
    () => mockCourses.filter(c => c.tags?.includes('추천')).slice(0, 10),
    [],
  );

  return (
    <div className="py-4 bg-white">
      {/* 타이틀 + 모두보기. AD 뱃지 제거 — 순수 MD 큐레이션 영역 */}
      <SectionHeader title="추천 골프장 둘러봐요" onMore={() => navigate('/search')} />

      {/* 카드 리스트 — 단일 가로 스크롤 한 줄(좌우 스와이프). 세로형 카드(이미지 상단 + 정보 하단). */}
      {recommended.length > 0 ? (
        <div className="rt-deal-grid pb-2">
          {recommended.map(course => {
            // 1차 · 2차 권역 도출
            //  - 일본 코스: course.region = 2차(현). getParentRegion 으로 1차(권역) 조회.
            //  - 해외 코스: course.region = 1차(권역), course.subRegion = 2차(도시).
            const cc = course.country ?? 'jp';
            const first = cc === 'jp' ? (getParentRegion(course.region) ?? course.region) : course.region;
            const second = cc === 'jp' ? course.region : (course.subRegion ?? '');
            const regionLine = second && second !== first ? `${first} ${second}` : first;
            return (
            <button
              key={course.id}
              onClick={() => navigate(`/course/${course.id}`)}
              className="flex-shrink-0 w-[200px] text-left"
            >
              {/* 상단 썸네일 — 가로형 이미지 */}
              <div className="rt-deal-thumb w-full h-[120px] rounded-[8px] overflow-hidden mb-2">
                <img src={course.image} alt={course.name} className="w-full h-full object-cover" />
              </div>
              {/* 그룹1: 골프장명 + 권역·평점 (tight) */}
              <h4 className="text-[15px] font-medium text-ink tracking-[-0.3px] truncate">{course.name}</h4>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[13px] font-medium text-ink-mid tracking-[-0.2px] truncate">{regionLine}</span>
                <span className="text-ink-light text-[13px] flex-shrink-0">·</span>
                <Star className="w-3 h-3 fill-yellow-400 stroke-yellow-400 flex-shrink-0" />
                <span className="text-[13px] font-medium text-ink-mid tracking-[-0.2px]">{course.rating}</span>
              </div>
              {/* 그룹2: 추천 사유 — 브랜드 그린 액센트 */}
              <p className="text-[13px] font-medium text-brand tracking-[-0.2px] mt-1 truncate">
                {reasonFor(course.id)}
              </p>
              {/* 그룹3: 가격(엔화+한화) — 내부 tight */}
              <p className="text-[15px] font-medium text-ink tracking-[-0.2px] mt-1">
                {formatJpy(course.lowestPrice)}~
              </p>
              <p className="text-[12px] font-medium text-ink-light tracking-[-0.2px]">
                약 {formatKrw(jpyToKrw(course.lowestPrice))}~
              </p>
            </button>
            );
          })}
        </div>
      ) : (
        <p className="px-5 py-8 text-center text-[13px] font-medium text-ink-light tracking-[-0.2px]">
          준비 중인 골프장이에요
        </p>
      )}
    </div>
  );
}
