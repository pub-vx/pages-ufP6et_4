import { useState, useEffect, useMemo, useRef } from 'react';
import { Check, Map, List, ChevronDown, RotateCcw } from 'lucide-react';
import { COUNTRIES } from '../../lib/countries';
import { RegionMapView } from './RegionMapView';
import { toggleInArray } from '../../lib/selection';
import { useAppState } from '../../data/store';
import { mockCourses } from '../../data/mockData';
import { buildOverseasCourses } from '../../data/overseasCourses';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 어디로(권역) 선택 바텀시트.
 *
 * UX 규칙:
 *  - 나라 추가: 그 나라의 모든 권역을 자동 선택 (사용자가 명시적으로 해제 가능)
 *  - 나라 해제: 그 나라의 권역/하위지역 자동 정리
 *  - 나라 추가 시 본문 스크롤이 해당 나라 섹션으로 자동 이동 (가시성 확보)
 *  - 2차 권역(현·도시) 필터는 본 시트에서 분리되어 FilterSheet "지역 선택" 탭에서 제공
 *
 * 레이아웃: DateSheet와 동일한 ui/Sheet 패턴 (X 자동 우상단, 좌측 타이틀, 풋터 CTA)
 */
export function RegionPickerA({ open, onOpenChange }: Props) {
  const {
    selectedCountries, setSelectedCountries,
    selectedRegions, setSelectedRegions,
    selectedSubRegions, setSelectedSubRegions,
  } = useAppState();

  const [pendingCountries, setPendingCountries] = useState<string[]>(selectedCountries);
  const [pendingRegions, setPendingRegions] = useState<string[]>(selectedRegions);
  const [pendingSubRegions, setPendingSubRegions] = useState<string[]>(selectedSubRegions);
  // 본문 보기 모드 — 리스트 ⇄ 지도 (같은 시트 안에서 전환)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  // 권역별 세부지역 펼침 상태 — 선택과 독립적으로 토글 가능 (체크박스 클릭 시 자동 펼침/접힘)
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) => {
    setExpandedRegions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 스크롤 컨테이너 + 각 나라 섹션 ref (나라 추가 시 자동 스크롤용)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const countrySectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 시트 열릴 때마다 외부 store 값으로 동기화 (DateSheet 패턴)
  // selectedRegions 가 빈 배열이면 "필터 없음(전체)" 의미 — 시각화 시에는
  // 그 나라의 모든 권역을 체크된 상태로 노출해야 사용자가 현재 상태를 이해할 수 있음
  useEffect(() => {
    if (open) {
      setViewMode('list'); // 열 때마다 리스트 모드로 시작
      setPendingCountries(selectedCountries);
      if (selectedRegions.length === 0) {
        const country = COUNTRIES.find(c => c.code === (selectedCountries[0] ?? 'jp'));
        setPendingRegions(country ? country.regions.map(r => r.id) : []);
      } else {
        setPendingRegions(selectedRegions);
      }
      setPendingSubRegions(selectedSubRegions);
    }
  }, [open, selectedCountries, selectedRegions, selectedSubRegions]);

  // 지도 좌표는 일본만 제공 — 다른 나라 선택 시 리스트 모드로 강제 복귀
  useEffect(() => {
    if (pendingCountries[0] !== 'jp') setViewMode('list');
  }, [pendingCountries]);

  // (국가, 권역) → 플랜 수 집계.
  //  - "골프장 수" 는 단위가 애매(개=골프장? 티타임?)해서, 예약 단위인 플랜(상품) 수로 환산.
  //  - regionCounts: 1차 권역별 플랜 합 / subRegionCounts: 2차 세부지역별 플랜 합
  //  - 일본(mockCourses): c.region = prefecture / 해외(overseasCourses): c.region = 1차 권역 id
  const { regionCounts, subRegionCounts } = useMemo(() => {
    const all = [...mockCourses, ...buildOverseasCourses()];
    const rMap: Record<string, number> = {};
    const sMap: Record<string, number> = {};
    for (const c of all) {
      const courseCountry = c.country ?? 'jp';
      const country = COUNTRIES.find(cc => cc.code === courseCountry);
      if (!country) continue;
      const planCount = c.plans?.length ?? 0;
      for (const r of country.regions) {
        // 1차 권역 매칭 — 해외는 region 직접 비교, 일본은 subRegions 포함 검사
        const matched = c.region === r.id
          || r.subRegions.some(sub =>
            (c.region && c.region.includes(sub))
            || (c.subRegion && c.subRegion.includes(sub))
            || (c.address && c.address.includes(sub))
          );
        if (matched) {
          const key = `${country.code}:${r.id}`;
          rMap[key] = (rMap[key] || 0) + planCount;
        }
        // 2차 세부지역 매칭 — 표시 라벨(displaySubRegions ?? subRegions) 기준으로 카운트
        for (const sub of (r.displaySubRegions ?? r.subRegions)) {
          const subMatched =
            (c.region && c.region.includes(sub))
            || (c.subRegion && c.subRegion.includes(sub))
            || (c.address && c.address.includes(sub));
          if (subMatched) {
            const sKey = `${country.code}:${sub}`;
            sMap[sKey] = (sMap[sKey] || 0) + planCount;
          }
        }
      }
    }
    return { regionCounts: rMap, subRegionCounts: sMap };
  }, []);

  // 단일 선택 — 칩 탭 시 그 나라로 교체. 동일 칩 재탭은 무시 (해제 없음 — 최소 1개 유지)
  //  · 나라 변경 시 그 나라의 모든 권역 자동 선택 + 2차 권역 초기화
  const selectCountry = (code: string) => {
    if (pendingCountries[0] === code) return;
    const country = COUNTRIES.find(c => c.code === code);
    if (!country) return;
    setPendingCountries([code]);
    setPendingRegions(country.regions.map(r => r.id)); // 그 나라의 모든 권역 자동 선택
    setPendingSubRegions([]); // 2차 권역 초기화
    // 다음 페인트 후 해당 나라 섹션으로 스크롤
    requestAnimationFrame(() => {
      const section = countrySectionRefs.current[code];
      const container = scrollContainerRef.current;
      if (section && container) {
        const sectionTop = section.offsetTop - container.offsetTop;
        container.scrollTo({ top: sectionTop - 12, behavior: 'smooth' });
      }
    });
  };

  const toggleRegion = (id: string) => {
    setPendingRegions(prev => {
      const next = toggleInArray(prev, id);
      const willSelect = next.includes(id);
      // 권역 해제 시 그 권역에 속한 2차 권역도 선택 해제
      if (!willSelect) {
        const region = COUNTRIES.flatMap(c => c.regions).find(r => r.id === id);
        if (region) {
          const subs = new Set<string>([...region.subRegions, ...(region.displaySubRegions ?? [])]);
          setPendingSubRegions(p => p.filter(s => !subs.has(s)));
        }
      }
      // 선택 시 자동 펼침, 해제 시 자동 접힘 (사용자가 chevron 으로 별도 제어 가능)
      setExpandedRegions(prevExp => {
        const nextExp = new Set(prevExp);
        if (willSelect) nextExp.add(id);
        else nextExp.delete(id);
        return nextExp;
      });
      return next;
    });
  };

  /**
   * 세부지역(2차 권역) 토글.
   *  - 1차 권역이 미선택 상태에서도 chevron 으로 펼쳐서 sub 선택 가능
   *  - sub 를 "추가" 할 때 부모 1차 권역이 미선택이면 자동 체크 (handleConfirm 에서
   *    미선택 부모의 sub 는 필터링되어 사라지기 때문에 정합성 확보 필요)
   *  - sub 를 "제거" 할 때는 부모 상태에 손대지 않음 (사용자 의도 보존)
   */
  const toggleSubRegion = (sub: string, parentRegionId?: string) => {
    const willAdd = !pendingSubRegions.includes(sub);
    setPendingSubRegions(prev => toggleInArray(prev, sub));
    if (willAdd && parentRegionId && !pendingRegions.includes(parentRegionId)) {
      setPendingRegions(prev => (prev.includes(parentRegionId) ? prev : [...prev, parentRegionId]));
    }
  };

  /**
   * 전체 권역 토글 — 한 나라의 모든 1차 권역을 한 번에 체크/해제.
   *  - 모두 선택된 상태 → 전체 해제 (그 나라 권역 + 하위 sub 모두 제거)
   *  - 일부/미선택 상태 → 전체 선택
   */
  const isAllRegionsSelected = (country: typeof COUNTRIES[number]): boolean => {
    const ids = country.regions.map(r => r.id);
    return ids.length > 0 && ids.every(id => pendingRegions.includes(id));
  };
  const toggleAllRegions = (country: typeof COUNTRIES[number]) => {
    const ids = country.regions.map(r => r.id);
    if (isAllRegionsSelected(country)) {
      // 전체 해제 — 그 나라의 권역 + 그 권역들에 속한 sub 모두 제거
      const idSet = new Set(ids);
      const subs = new Set(
        country.regions.flatMap(r => [...r.subRegions, ...(r.displaySubRegions ?? [])])
      );
      setPendingRegions(prev => prev.filter(id => !idSet.has(id)));
      setPendingSubRegions(prev => prev.filter(s => !subs.has(s)));
    } else {
      // 전체 선택
      setPendingRegions(ids);
    }
  };

  // 초기화 — 기본 나라(일본) + 그 나라 전체 권역 (디폴트 상태로 복귀)
  const resetAll = () => {
    const jp = COUNTRIES.find(c => c.code === 'jp');
    setPendingCountries(['jp']);
    setPendingRegions(jp ? jp.regions.map(r => r.id) : []);
    setPendingSubRegions([]);
  };

  // 현재 pending 상태가 default (JP 단독 + JP 전체 권역 + sub 0개) 와 동일한지 — 초기화 버튼 활성/비활성 판단
  const isDefaultState = useMemo(() => {
    const jp = COUNTRIES.find(c => c.code === 'jp');
    if (!jp) return false;
    const allJpRegionIds = jp.regions.map(r => r.id);
    return (
      pendingCountries.length === 1 &&
      pendingCountries[0] === 'jp' &&
      pendingRegions.length === allJpRegionIds.length &&
      allJpRegionIds.every(id => pendingRegions.includes(id)) &&
      pendingSubRegions.length === 0
    );
  }, [pendingCountries, pendingRegions, pendingSubRegions]);

  const handleConfirm = () => {
    setSelectedCountries(pendingCountries);
    setSelectedRegions(pendingRegions);
    // 선택된 2차 권역 중, 현재 선택된 1차 권역에 속하는 것만 유지
    if (pendingRegions.length === 0) {
      setSelectedSubRegions([]);
    } else {
      const allowedSubs = new Set(
        COUNTRIES.flatMap(c => c.regions.filter(r => pendingRegions.includes(r.id))
          .flatMap(r => [...r.subRegions, ...(r.displaySubRegions ?? [])]))
      );
      setSelectedSubRegions(pendingSubRegions.filter(s => allowedSubs.has(s)));
    }
    onOpenChange(false);
  };

  const selectedCountryData = COUNTRIES.filter(c => pendingCountries.includes(c.code));
  // 일본 단독 제공 — 2개국 이상일 때만 '나라 선택' 칩 노출
  const availableCountries = COUNTRIES.filter(c => c.available);

  // CTA 라벨 — 단일 나라 모델
  let ctaLabel: string;
  if (selectedCountryData.length === 0) {
    ctaLabel = '나라를 선택해 주세요';
  } else {
    const country = selectedCountryData[0];
    const allRegionsForCountry = country.regions.map(r => r.id);
    const selInThis = pendingRegions.filter(r => allRegionsForCountry.includes(r));
    const isAllRegions = selInThis.length === 0 || selInThis.length === allRegionsForCountry.length;
    ctaLabel = isAllRegions
      ? `${country.name} 전체로 검색`
      : `${selInThis.length}개 권역으로 검색`;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="text-[16px] font-bold text-gray-1000 tracking-[-0.3px] text-left">어디로 떠나시나요?</SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* 나라 선택 칩 — 2개국 이상일 때만 노출 (현재 일본 단독이라 숨김) */}
          {availableCountries.length > 1 && (
          <div className="px-5 pt-4 pb-3 border-b border-gray-10 flex-shrink-0">
            <p className="text-[13px] font-medium text-gray-1000 tracking-[-0.2px] mb-2">나라 선택</p>
            <div className="flex flex-wrap gap-1.5">
              {availableCountries.map(c => {
                const isSel = pendingCountries.includes(c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => selectCountry(c.code)}
                    className={`inline-flex items-center gap-1 px-3 h-9 rounded-full text-[13px] tracking-[-0.2px] border transition-colors ${
                      isSel
                        ? 'bg-white border-gray-1000 text-gray-1000 font-medium'
                        : 'bg-white border-gray-100 text-gray-300 font-medium'
                    }`}
                  >
                    <span className="text-[14px] leading-none">{c.flag}</span>
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          )}

          {/* [리스트 ⇄ 지도] 탭 — 좌측정렬 underline 탭(포털 탭 스타일).
              [지도] 탭은 현재 일본만 지원되므로 jp 일 때만 렌더. */}
          <div className="px-5 flex-shrink-0 border-b border-gray-50">
            <div className="flex gap-5">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`relative inline-flex items-center gap-1 py-2.5 text-[14px] tracking-[-0.2px] transition-colors ${
                  viewMode === 'list' ? 'text-gray-1000 font-bold' : 'text-gray-300 font-medium'
                }`}
              >
                <List className="w-4 h-4" />리스트
                {viewMode === 'list' && <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-gray-1000" />}
              </button>
              {pendingCountries[0] === 'jp' && (
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`relative inline-flex items-center gap-1 py-2.5 text-[14px] tracking-[-0.2px] transition-colors ${
                    viewMode === 'map' ? 'text-gray-1000 font-bold' : 'text-gray-300 font-medium'
                  }`}
                >
                  <Map className="w-4 h-4" />지도
                  {viewMode === 'map' && <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-gray-1000" />}
                </button>
              )}
            </div>
          </div>

          {viewMode === 'map' ? (
            /* 지도 모드 — 마커 탭 → 그 권역 위 팝업으로 세부지역 선택.
               flex-1 로 시트 남는 공간을 꽉 채워(모바일 흰 여백 제거).
               데스크톱 중앙 모달(height:auto)에선 flex-1 이 수축하므로 min-h 로 높이 보장. */
            <div className="flex-1 min-h-[360px]">
              <RegionMapView
                selectedRegions={pendingRegions}
                pendingSubRegions={pendingSubRegions}
                onSelectRegion={(id) => setPendingRegions(prev => {
                  // 전체(모든 권역) 상태에서 첫 마커 탭 = 그 권역으로 좁힘(나머지 해제) → "탭해서 골라 담기"
                  const country = COUNTRIES.find(c => c.code === (pendingCountries[0] ?? 'jp'));
                  const allIds = country?.regions.map(r => r.id) ?? [];
                  const isAll = allIds.length > 0 && allIds.every(x => prev.includes(x));
                  if (isAll) return [id];
                  return prev.includes(id) ? prev : [...prev, id];
                })}
                onDeselectRegion={toggleRegion}
                onToggleSubRegion={toggleSubRegion}
                onClearSubRegions={(id) => {
                  const r = (COUNTRIES.find(c => c.code === (pendingCountries[0] ?? 'jp'))?.regions ?? []).find(x => x.id === id);
                  if (!r) return;
                  const subs = new Set(r.displaySubRegions ?? r.subRegions);
                  setPendingSubRegions(prev => prev.filter(s => !subs.has(s)));
                }}
                regionCounts={regionCounts}
                subRegionCounts={subRegionCounts}
                countryCode={pendingCountries[0] ?? 'jp'}
              />
            </div>
          ) : (
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-2">
            {selectedCountryData.length === 0 && (
              <p className="px-5 py-6 text-[12px] font-medium text-gray-300 tracking-[-0.2px] text-center">
                먼저 나라를 1개 이상 선택해 주세요
              </p>
            )}

            {selectedCountryData.map(country => (
              <div
                key={country.code}
                ref={el => { countrySectionRefs.current[country.code] = el; }}
                className="mb-2 last:mb-0"
              >
                <p className="px-5 pt-3 pb-1.5 text-[12px] font-medium text-gray-600 tracking-[-0.2px] flex items-center gap-1.5">
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                </p>
                {/* 전체 권역 — 한 번에 체크/해제하는 마스터 체크박스 행 */}
                {(() => {
                  const allSel = isAllRegionsSelected(country);
                  return (
                    <button
                      type="button"
                      onClick={() => toggleAllRegions(country)}
                      className="w-full flex items-center gap-3 px-5 py-3 text-left border-b border-gray-10 hover:bg-gray-5 transition-colors"
                      aria-pressed={allSel}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                        allSel ? 'bg-primary-600' : 'border-2 border-gray-100'
                      }`}>
                        {allSel && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </div>
                      <span className={`flex-1 text-[14px] tracking-[-0.2px] ${allSel ? 'font-medium text-gray-1000' : 'font-medium text-gray-600'}`}>
                        전체 권역
                      </span>
                      <span className="text-[12px] font-medium text-gray-300 tracking-[-0.2px] flex-shrink-0">
                        {allSel ? '전체 해제' : '전체 선택'}
                      </span>
                    </button>
                  );
                })()}
                {country.regions.map(r => {
                  const isSel = pendingRegions.includes(r.id);
                  const count = regionCounts[`${country.code}:${r.id}`] || 0;
                  const subList = r.displaySubRegions ?? r.subRegions;
                  const selSubCount = subList.filter(s => pendingSubRegions.includes(s)).length;
                  // [전체] 활성 조건: 부모 권역이 선택된 상태이면서, 세부 미선택(0) 또는 모두 선택 일 때만.
                  //  - 부모 미선택 시: 펼쳐서 sub 만 미리 보는 상태라 "전체" 가 의미를 갖지 않음 → 비활성
                  const isAllSub = isSel && (selSubCount === 0 || selSubCount === subList.length);
                  return (
                    <div key={`${country.code}:${r.id}`} className="border-b border-gray-10">
                      <div
                        className={`flex items-stretch transition-colors ${
                          isSel ? 'bg-primary-100' : 'hover:bg-gray-5'
                        }`}
                      >
                        {/* 권역 선택(체크박스 + 라벨 + 카운트) */}
                        <button
                          type="button"
                          onClick={() => toggleRegion(r.id)}
                          className="flex-1 flex items-center gap-3 px-5 py-3.5 text-left min-w-0"
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSel ? 'bg-primary-600' : 'border-2 border-gray-100'
                          }`}>
                            {isSel && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                          </div>
                          <span className={`flex-1 text-[14px] tracking-[-0.2px] truncate ${isSel ? 'font-medium text-gray-1000' : 'font-medium text-gray-1000'}`}>
                            {r.label}
                            {isSel && selSubCount > 0 && (
                              <span className="ml-1.5 text-[11px] font-medium text-primary-600">세부 {selSubCount}</span>
                            )}
                          </span>
                          <span className="text-[12px] font-medium text-gray-300 tracking-[-0.2px] flex-shrink-0">플랜 {count}</span>
                        </button>
                        {/* 펼침/접힘 — 선택 여부와 무관하게 sub 가 있으면 항상 노출.
                            미선택 상태에서도 세부지역을 미리 펼쳐보고 일부만 골라 담는 동선 지원. */}
                        {subList.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(r.id)}
                            className="flex-shrink-0 px-4 flex items-center text-gray-500"
                            aria-label={expandedRegions.has(r.id) ? '세부지역 접기' : '세부지역 펼치기'}
                            aria-expanded={expandedRegions.has(r.id)}
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${expandedRegions.has(r.id) ? 'rotate-180' : ''}`}
                              strokeWidth={2.2}
                            />
                          </button>
                        )}
                      </div>
                      {/* 2차 권역(현·도시) 칩 — 펼침 상태만으로 노출.
                          부모 선택 여부에 따라 영역 톤만 살짝 바뀌어 시각적 불일치 방지
                          (선택: 옅은 민트 / 미선택: 옅은 회색) */}
                      {expandedRegions.has(r.id) && subList.length > 0 && (
                        <div className={`px-5 pb-3 pt-2 ${isSel ? 'bg-[#F7FCF9]' : 'bg-gray-5'}`}>
                          <div className="flex flex-wrap gap-1.5">
                            {/* 전체 칩 — 이 권역의 세부 지역을 모두 해제 = 권역 전체.
                                부모가 아직 미선택이면 함께 자동 체크 ("전체" 는 부모 선택 의미와 동일) */}
                            <button
                              type="button"
                              onClick={() => {
                                const subs = new Set(subList);
                                setPendingSubRegions(prev => prev.filter(s => !subs.has(s)));
                                if (!isSel) {
                                  setPendingRegions(prev => (prev.includes(r.id) ? prev : [...prev, r.id]));
                                }
                              }}
                              className={`inline-flex items-center px-2.5 h-7 rounded-full text-[12px] tracking-[-0.2px] border transition-colors ${
                                isAllSub
                                  ? 'bg-white border-gray-1000 text-gray-1000 font-medium'
                                  : 'bg-white border-gray-100 text-gray-300 font-medium'
                              }`}
                            >
                              전체
                            </button>
                            {subList.map(sub => {
                              const subSel = pendingSubRegions.includes(sub);
                              const subCount = subRegionCounts[`${country.code}:${sub}`] || 0;
                              return (
                                <button
                                  key={sub}
                                  type="button"
                                  onClick={() => toggleSubRegion(sub, r.id)}
                                  className={`inline-flex items-center gap-1 px-2.5 h-7 rounded-full text-[12px] tracking-[-0.2px] border transition-colors ${
                                    subSel
                                      ? 'bg-white border-gray-1000 text-gray-1000 font-medium'
                                      : 'bg-white border-gray-100 text-gray-300 font-medium'
                                  }`}
                                >
                                  {sub}
                                  {/* 세부지역별 플랜 수 — 0 이 아닐 때만 노출 */}
                                  {subCount > 0 && (
                                    <span className={subSel ? 'text-primary-600 font-medium' : 'text-[#B7C2CC] font-medium'}>
                                      {subCount}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          )}
        </div>

        <div className="border-t border-gray-50 p-4 bg-white flex items-center gap-3">
          {/* 초기화 — CTA 좌측 보조 액션. default 상태일 땐 비활성(톤다운)으로 "초기화할 게 없다" 신호 */}
          <button
            type="button"
            onClick={resetAll}
            disabled={isDefaultState}
            className={`flex items-center gap-1 text-[13px] font-medium tracking-[-0.2px] transition-colors ${
              isDefaultState ? 'text-gray-100 cursor-not-allowed' : 'text-gray-500 hover:text-gray-1000'
            }`}
            aria-label="선택 초기화"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.2} />
            초기화
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pendingCountries.length === 0}
            className={`flex-1 py-3.5 rounded-[8px] text-[14px] font-medium tracking-[-0.2px] transition-colors ${
              pendingCountries.length === 0
                ? 'bg-gray-10 text-gray-300 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
          >
            {ctaLabel}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
