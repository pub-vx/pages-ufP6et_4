import { useMemo, useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { DateSheet } from '../DateSheet';
import { generateDays } from '../../lib/dateRange';

interface DetailDateStripProps {
  selectedDate: Date;
  onDateChange: (d: Date) => void;
}

export function DetailDateStrip({ selectedDate, onDateChange }: DetailDateStripProps) {
  const [showDateSheet, setShowDateSheet] = useState(false);
  // 기본 35일치. 선택일이 범위를 넘으면(목록에서 먼 날짜 선택 후 상세 진입) 그 날짜+버퍼까지 확장.
  const allDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sel = new Date(selectedDate);
    sel.setHours(0, 0, 0, 0);
    const daysUntilSel = Math.round((sel.getTime() - today.getTime()) / 86400000);
    const count = Math.max(35, daysUntilSel + 7);
    return generateDays(count);
  }, [selectedDate]);

  // 선택된 날짜로 자동 가운데 스크롤 (디폴트 +21일이 화면 밖이라 활성 표시가 안 보이는 문제 방지)
  const stripRef = useRef<HTMLDivElement>(null);
  const selectedBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const btn = selectedBtnRef.current;
    const container = stripRef.current;
    if (!btn || !container) return;
    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const offset = btnRect.left - containerRect.left - (containerRect.width / 2) + (btnRect.width / 2);
    container.scrollTo({ left: container.scrollLeft + offset, behavior: 'auto' });
  }, [selectedDate]);

  return (
    <>
      {/* sticky — AppHeader(48) + CourseTabBar(69, 포털 .tab_navigation 스타일) = 117px 누적 위치에 고정.
          스크롤 중에도 날짜 컨텍스트를 항상 노출하기 위함. bg-white 로 본문과 시각 분리. */}
      <div className="rt-sticky-course-date z-30 bg-white relative flex items-center gap-2 px-4 py-2 border-b border-gray-10">
        <button
          onClick={() => setShowDateSheet(true)}
          className="flex items-center gap-[3px] text-[14px] font-medium text-gray-1000 flex-shrink-0"
        >
          <span>{selectedDate.getMonth() + 1}월</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        <div className="w-px h-[38px] bg-[#E5E7EB] flex-shrink-0" />

        <div ref={stripRef} className="flex-1 overflow-x-auto scrollbar-hide">
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
                    ref={isSelected ? selectedBtnRef : undefined}
                    onClick={() => onDateChange(date)}
                    className={`flex flex-col items-center justify-center py-[5px] px-[14px] rounded-[20px] transition-colors ${
                      isSelected ? 'bg-gray-1000 text-white' : ''
                    }`}
                  >
                    <span className={`text-[12px] font-medium tracking-[-0.43px] ${
                      isSelected ? 'text-white'
                      : isSunday ? 'text-[#EF3434]'
                      : isSaturday ? 'text-[#2697FF]'
                      : 'text-gray-1000'
                    }`}>
                      {dayName}
                    </span>
                    <span className={`text-[14px] tracking-[-1.4px] ${
                      isSelected ? 'text-white'
                      : isSunday ? 'text-[#EF3434]'
                      : isSaturday ? 'text-[#2697FF]'
                      : 'text-gray-1000'
                    }`}>
                      {day}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="absolute right-0 top-px bottom-px w-10 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none" />
      </div>

      <DateSheet
        open={showDateSheet}
        onOpenChange={setShowDateSheet}
        selectedDate={selectedDate}
        onSelect={onDateChange}
      />
    </>
  );
}
