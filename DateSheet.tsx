import { useEffect, useMemo, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';

interface DateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onSelect: (d: Date) => void;
  /** 보여줄 개월 수 (기본 3) */
  monthsCount?: number;
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function buildMonthCells(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const cells: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
  // 마지막 주 채우기
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function DateSheet({ open, onOpenChange, selectedDate, onSelect, monthsCount = 3 }: DateSheetProps) {
  const [pending, setPending] = useState<Date>(selectedDate);
  const today = useRef<Date>(new Date()).current;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedCellRef = useRef<HTMLButtonElement>(null);

  // 시트 열릴 때마다 외부값으로 동기화 + 선택된 날짜가 화면에 보이도록 스크롤
  useEffect(() => {
    if (!open) return;
    setPending(selectedDate);
    // 시트 애니메이션이 시작된 이후 DOM이 그려진 시점에 스크롤 (스크롤 컨테이너 기준 가운데로)
    const id = requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      const cell = selectedCellRef.current;
      if (!container || !cell) return;
      const containerRect = container.getBoundingClientRect();
      const cellRect = cell.getBoundingClientRect();
      const offset = (cellRect.top - containerRect.top) - (containerRect.height / 2) + (cellRect.height / 2);
      container.scrollTop = container.scrollTop + offset;
    });
    return () => cancelAnimationFrame(id);
  }, [open, selectedDate]);

  const months = useMemo(() => {
    const base = new Date(today.getFullYear(), today.getMonth(), 1);
    return Array.from({ length: monthsCount }, (_, i) => {
      const d = new Date(base);
      d.setMonth(base.getMonth() + i);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }, [monthsCount, today]);

  const handleConfirm = () => {
    onSelect(pending);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-gray-50">
          <SheetTitle className="text-base text-left">날짜 선택</SheetTitle>
        </SheetHeader>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 pb-4">
          {months.map(({ year, month }) => {
            const cells = buildMonthCells(year, month);
            return (
              <div key={`${year}-${month}`} className="pt-5">
                <h4 className="text-center text-sm font-medium text-gray-1000 mb-3">
                  {year}년 {month + 1}월
                </h4>
                <div className="grid grid-cols-7 gap-y-2.5 text-center">
                  {DAY_NAMES.map((dn, i) => (
                    <div
                      key={dn}
                      className={`text-xs font-medium pb-2 ${
                        i === 0 ? 'text-negative' : i === 6 ? 'text-positive' : 'text-gray-300'
                      }`}
                    >
                      {dn}
                    </div>
                  ))}
                  {cells.map((d, idx) => {
                    if (!d) return <div key={`e-${idx}`} className="h-10" />;
                    const isToday = isSameDay(d, today);
                    const isSelected = isSameDay(d, pending);
                    const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    const dow = d.getDay();
                    return (
                      <button
                        key={d.toISOString()}
                        ref={isSelected ? selectedCellRef : undefined}
                        disabled={isPast}
                        onClick={() => setPending(d)}
                        className="h-10 flex items-center justify-center"
                      >
                        <span
                          className={`relative w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-primary-600 text-white font-medium'
                              : isPast
                              ? 'text-[#C5CDD5]'
                              : dow === 0
                              ? 'text-negative'
                              : dow === 6
                              ? 'text-positive'
                              : 'text-gray-1000'
                          }`}
                        >
                          {d.getDate()}
                          {isToday && !isSelected && (
                            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full" />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-gray-50 p-4 bg-white">
          <button
            onClick={handleConfirm}
            className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-[8px] transition-colors"
          >
            날짜 선택 완료
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function formatDateLabel(d: Date): string {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}/${d.getDate()}(${dayNames[d.getDay()]})`;
}
