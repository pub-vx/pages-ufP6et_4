import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { COUNTRIES } from '../lib/countries';
import { useAppState } from '../data/store';
import { mockCourses } from '../data/mockData';
import { buildOverseasCourses } from '../data/overseasCourses';
import { SectionHeader } from './SectionHeader';

/**
 * 나라 선택 그리드 — 5개국 원형 진입점 (대표 이미지 + 이름).
 * 탭 시 해당 나라를 selectedCountries에 단일 설정하고 /search 페이지로 진입.
 *
 * 디자인:
 *  - 섹션 타이틀 text-[18px] font-medium tracking-[-0.4px] (이전 14px에서 확대)
 *  - 원형 w-24 h-24 (96px) — 나라 대표 이미지 (이전 80px에서 확대)
 *  - 라벨 text-[14px] font-medium tracking-[-0.2px]
 *  - 국기 이모지 뱃지는 제거 — 대표 이미지로 식별
 */

/** 나라별 대표 더미 이미지 (Unsplash) — 풍경/랜드마크 중심으로 한눈에 식별 가능한 컷 */
const COUNTRY_IMAGES: Record<string, string> = {
  jp: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=400&q=80', // 일본 - 후지산
  vn: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400&q=80', // 베트남 - 다낭 해안
  hi: 'https://images.unsplash.com/photo-1507876466758-bc54f384809c?w=400&q=80', // 하와이 - 와이키키
  tw: 'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=400&q=80', // 대만 - 타이베이 야경
  my: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&q=80', // 말레이시아 - 페트로나스 타워
};

export function CountryGrid() {
  const navigate = useNavigate();
  const { setSelectedCountries, setSelectedRegions, setSelectedSubRegions } = useAppState();

  /**
   * 나라별 티타임 수 — 코스별 잔여 팀(remainingTeams) 합산을 "예약 가능 티타임" proxy 로 사용.
   *  - 일본: mockCourses, 그 외: buildOverseasCourses
   *  - 클릭 가능한 영역임 + 콘텐츠 풍부함을 수치로 드러내 어포던스 강화.
   */
  const teeTimeCountByCountry = useMemo(() => {
    const all = [...mockCourses.map(c => ({ ...c, country: c.country ?? 'jp' })), ...buildOverseasCourses()];
    const map: Record<string, number> = {};
    for (const c of all) {
      const cc = c.country ?? 'jp';
      map[cc] = (map[cc] || 0) + (c.remainingTeams || 0);
    }
    return map;
  }, []);

  const handleCountryClick = (code: string) => {
    setSelectedCountries([code]);
    setSelectedRegions([]);
    setSelectedSubRegions([]);
    navigate('/search', { state: { fromCountry: true } });
  };

  return (
    <div className="py-5 bg-white">
      <SectionHeader title="나라 선택" />
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5">
          {COUNTRIES.map(c => {
            const teeTimes = teeTimeCountByCountry[c.code] ?? 0;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => handleCountryClick(c.code)}
                className="flex-shrink-0 flex flex-col items-center gap-2 min-w-[80px]"
              >
                <img
                  src={COUNTRY_IMAGES[c.code]}
                  alt={c.name}
                  className="w-20 h-20 rounded-full object-cover"
                  draggable={false}
                />
                <div className="flex flex-col items-center gap-0.5">
                  <p className="text-[14px] font-medium text-ink tracking-[-0.2px]">{c.name}</p>
                  {/* 티타임 수 — 클릭 어포던스 + 인벤토리 풍부함 시그널. 0 이면 준비중 */}
                  {teeTimes > 0 ? (
                    <p className="text-[11px] font-medium text-brand tracking-[-0.2px]">
                      티타임 {teeTimes.toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-[11px] font-medium text-ink-light tracking-[-0.2px]">
                      오픈 예정
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
