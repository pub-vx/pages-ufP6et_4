import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAppState } from '../data/store';
import { DateSheet } from './DateSheet';
import { generateDays } from '../lib/dateRange';

/**
 * 가로 스크롤 날짜 스트립 + 월 라벨 → 바텀시트 캘린더 진입.
 * - 검색/지도 페이지에서 동일하게 사용
 * - 선택된 날짜는 마운트 시 가운데로 자동 스크롤
 * - 월 버튼 탭 → DateSheet (3개월 캘린더 바텀시트) 노출
 */
export function DateStrip() {
  const { selectedDate, setSelectedDate } = useAppState();
  const [showSheet, setShowSheet] = useState(false);

  const dateStripRef = useRef<HTMLDivElement>(null);
  const selectedDateBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // 라우트 전환 직후엔 컨테이너 width 가 아직 settle 되지 않을 수 있음 →
    // 다음 paint frame 까지 기다린 후 오프셋 계산해야 active 날짜가 화면 밖에 남지 않는다.
    const id = requestAnimationFrame(() => {
      const btn = selectedDateBtnRef.current;
      const container = dateStripRef.current;
      if (!btn || !container) return;
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const offset = btnRect.left - containerRect.left - (containerRect.width / 2) + (btnRect.width / 2);
      container.scrollTo({ left: container.scrollLeft + offset, behavior: 'auto' });
    });
    return () => cancelAnimationFrame(id);
  }, [selectedDate]);

  // 기본 28일치. 단, 선택된 날짜가 28일 범위를 넘으면(예: DateSheet 에서 두 달 뒤 선택)
  // 그 날짜 + 버퍼(7일)까지 확장해, strip 에 항상 선택일 버튼이 존재하고 활성 표시되도록 한다.
  const allDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sel = new Date(selectedDate);
    sel.setHours(0, 0, 0, 0);
    const daysUntilSel = Math.round((sel.getTime() - today.getTime()) / 86400000);
    const count = Math.max(28, daysUntilSel + 7);
    return generateDays(count);
  }, [selectedDate]);

  return (
    <>
      {/* 날짜 스트립 (가로 스크롤) */}
      <div className="flex items-center gap-2 px-4 py-2 relative">
        <button
          onClick={() => setShowSheet(true)}
          className="flex items-center gap-[3px] text-[14px] font-medium text-gray-1000 flex-shrink-0"
        >
          <span>{selectedDate.getMonth() + 1}월</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        <div className="w-px h-[38px] bg-[#E5E7EB] flex-shrink-0" />

        <div ref={dateStripRef} className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex">
            {allDays.map(({ date, day, month, dayName, isSunday, isSaturday }, idx) => {
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const showMonth = idx > 0 && allDays[idx - 1].month !== month;
              return (
                <div key={date.toISOString()} className="flex items-center flex-shrink-0">
                  {showMonth && (
                    <span className="text-[10px] text-gray-300 font-medium px-1 mr-0.5">{month}월</span>
                  )}
                  <button
                    ref={isSelected ? selectedDateBtnRef : undefined}
                    onClick={() => setSelectedDate(date)}
                    className={`flex flex-col items-center justify-center py-[5px] px-[14px] rounded-[20px] transition-colors ${
                      isSelected ? 'bg-gray-1000 text-white' : ''
                    }`}
                  >
                    <span className={`text-[12px] font-medium tracking-[-0.43px] ${
                      isSelected ? 'text-white'
                      : isSunday ? 'text-[#EF3434]'
                      : isSaturday ? 'text-[#2697FF]'
                      : 'text-gray-1000'
                    }`}>{dayName}</span>
                    <span className={`text-[14px] tracking-[-1.4px] ${
                      isSelected ? 'text-white'
                      : isSunday ? 'text-[#EF3434]'
                      : isSaturday ? 'text-[#2697FF]'
                      : 'text-gray-1000'
                    }`}>{day}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="absolute right-0 top-px bottom-px w-10 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none" />
      </div>

      {/* 월 라벨 탭 시 노출되는 바텀시트 캘린더 */}
      <DateSheet
        open={showSheet}
        onOpenChange={setShowSheet}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
      />
    </>
  );
}
