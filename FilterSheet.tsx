import { useEffect, useState } from 'react';
import { RefreshCw, Check } from 'lucide-react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { formatKrw, jpyToKrw, EXCHANGE_RATE, EXCHANGE_RATE_DATE } from '../data/mockData';
import { toggleInArray } from '../lib/selection';
import { useAppState } from '../data/store';
import type { PlayerCount } from '../data/store';
import {
  type FilterState,
  PRICE_RANGE_MIN,
  PRICE_RANGE_MAX,
  ALL_TIME_SLOTS,
} from './filterConfig';

// 타입/상수/헬퍼는 filterConfig.ts 로 분리(HMR 안정화). 외부에서 쓰던 것들은 거기서 import.

/** 내장인원 옵션 (단일 선택) */
const PLAYER_OPTIONS: PlayerCount[] = [2, 3, 4];

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: FilterState;
  onApply: (state: FilterState) => void;
}

/**
 * 맞춤 골프장 검색(라운드 조건 필터) 시트.
 * 지역/권역 선택은 "어디로" 시트(RegionPickerA)에서 담당.
 *
 *  - 시간대 (다중)
 *  - 내장인원 (단일) → 전역 playerCount 와 연동, 적용 시 실제 목록 필터 반영
 *  - 플레이 요금 (슬라이더, 엔화 = 브랜드 그린)
 *  - 푸터: 예약가능 골프장만 보기(전역 availableOnly) + 초기화 / 적용하기
 */
export function FilterSheet({ open, onOpenChange, initial, onApply }: FilterSheetProps) {
  const { playerCount, setPlayerCount, availableOnly, setAvailableOnly } = useAppState();

  const [timeSlots, setTimeSlots] = useState<string[]>(initial.timeSlots);
  // playStyles/inclusions 는 UI 비노출 — QuickCuration 값 통과/초기화용으로만 보관
  const [playStyles, setPlayStyles] = useState<string[]>(initial.playStyles);
  const [inclusions, setInclusions] = useState<string[]>(initial.inclusions);
  const [priceRange, setPriceRange] = useState<number[]>(initial.priceRange);
  // 전역 토글의 시트 내 pending 사본 — 적용 전까지 임시
  const [pendingPlayer, setPendingPlayer] = useState<PlayerCount>(playerCount);
  const [pendingAvailable, setPendingAvailable] = useState<boolean>(availableOnly);

  // 시트 열릴 때마다 외부 값으로 동기화
  useEffect(() => {
    if (!open) return;
    setTimeSlots(initial.timeSlots);
    setPlayStyles(initial.playStyles);
    setInclusions(initial.inclusions);
    setPriceRange(initial.priceRange);
    setPendingPlayer(playerCount);
    setPendingAvailable(availableOnly);
  }, [open, initial, playerCount, availableOnly]);

  const reset = () => {
    setTimeSlots([...ALL_TIME_SLOTS]);   // 초기화 = 전체 선택
    setPlayStyles([]);
    setInclusions([]);
    setPriceRange([PRICE_RANGE_MIN, PRICE_RANGE_MAX]);
    setPendingPlayer(4);
    setPendingAvailable(true);
  };

  const apply = () => {
    onApply({ timeSlots, playStyles, inclusions, priceRange: [priceRange[0], priceRange[1]] });
    setPlayerCount(pendingPlayer);
    setAvailableOnly(pendingAvailable);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-2 border-b border-gray-50">
          <SheetTitle className="text-[16px] font-medium text-gray-1000 tracking-[-0.3px] text-left">맞춤 골프장 검색</SheetTitle>
          <SheetDescription className="text-[12px] font-medium text-gray-500 tracking-[-0.2px] text-left">
            원하는 라운드 조건을 선택하세요
          </SheetDescription>
        </SheetHeader>

        {/* 본문 — 라운드 조건 */}
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4">
          <div className="space-y-6">
            {/* 시간대 (다중) */}
            <div>
              <h3 className="text-[14px] font-medium tracking-[-0.2px] mb-2.5 text-gray-1000">시간대</h3>
              <div className="flex gap-1.5">
                {[
                  { id: '새벽', label: '새벽', sub: '~06:59' },
                  { id: '오전', label: '오전', sub: '07:00~11:59' },
                  { id: '오후', label: '오후', sub: '12:00~' },
                ].map(t => {
                  const on = timeSlots.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTimeSlots(toggleInArray(timeSlots, t.id))}
                      className={`py-2 px-3 rounded-full text-[13px] transition-all flex items-center gap-1 border tracking-[-0.2px] whitespace-nowrap ${
                        on ? 'border-gray-1000 text-gray-1000 font-medium' : 'border-gray-100 text-gray-300 font-medium'
                      }`}
                    >
                      <span>{t.label}</span>
                      <span className={`text-[10px] ${on ? 'text-gray-500' : 'text-[#a4b3c4]'}`}>{t.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 내장인원 (단일) — 전역 playerCount 연동 */}
            <div>
              <h3 className="text-[14px] font-medium tracking-[-0.2px] mb-2.5 text-gray-1000">내장인원</h3>
              {/* 시간대 칩과 동일한 디자인 — hug(내용폭) + rounded-full + text-[13px] 아웃라인 */}
              <div className="flex gap-1.5">
                {PLAYER_OPTIONS.map(n => {
                  const on = pendingPlayer === n;
                  return (
                    <button
                      key={n}
                      onClick={() => setPendingPlayer(n)}
                      className={`py-2 px-3 rounded-full text-[13px] transition-all border tracking-[-0.2px] whitespace-nowrap ${
                        on ? 'border-gray-1000 text-gray-1000 font-medium' : 'border-gray-100 text-gray-300 font-medium'
                      }`}
                    >
                      {n}인
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 플레이 요금 — 슬라이더(초록 fill), 엔화 = 브랜드 그린 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-medium tracking-[-0.2px] text-gray-1000">플레이 요금</h3>
                <span className="text-[10px] font-medium text-gray-300 tracking-[-0.1px]">
                  적용 환율: 1¥ ≈ {EXCHANGE_RATE}원 ({EXCHANGE_RATE_DATE} 기준)
                </span>
              </div>
              <div className="space-y-3.5">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-[16px] font-medium text-primary-600 tracking-[-0.3px]">¥{priceRange[0].toLocaleString()}</span>
                    <span className="text-[11px] font-medium text-gray-400 tracking-[-0.2px]">약 {formatKrw(jpyToKrw(priceRange[0]))}</span>
                  </div>
                  <span className="text-gray-300 mt-1.5">~</span>
                  <div className="flex flex-col items-end">
                    <span className="text-[16px] font-medium text-primary-600 tracking-[-0.3px]">¥{priceRange[1].toLocaleString()}</span>
                    <span className="text-[11px] font-medium text-gray-400 tracking-[-0.2px]">약 {formatKrw(jpyToKrw(priceRange[1]))}</span>
                  </div>
                </div>

                {/* 재디자인 슬라이더 — 트랙 6px / 초록 range / 흰 thumb + 그린 보더 */}
                <SliderPrimitive.Root
                  min={PRICE_RANGE_MIN}
                  max={PRICE_RANGE_MAX}
                  step={1000}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="relative flex w-full touch-none items-center select-none py-2"
                >
                  <SliderPrimitive.Track className="relative grow h-1.5 rounded-full bg-gray-100">
                    <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary-600" />
                  </SliderPrimitive.Track>
                  {priceRange.map((_, i) => (
                    <SliderPrimitive.Thumb
                      key={i}
                      className="block w-5 h-5 rounded-full bg-white border-2 border-primary-600 shadow-[0_1px_4px_rgba(0,0,0,0.18)] transition-transform hover:scale-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-600/20"
                      aria-label={i === 0 ? '최소 요금' : '최대 요금'}
                    />
                  ))}
                </SliderPrimitive.Root>

                <div className="flex items-center justify-between text-[11px] font-medium text-gray-300 tracking-[-0.1px]">
                  <span>¥{PRICE_RANGE_MIN.toLocaleString()}</span>
                  <span>¥{PRICE_RANGE_MAX.toLocaleString()}+</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 — 예약가능 토글 + 초기화 / 적용하기 (마스터 FilterFooter 레이아웃) */}
        <div className="px-5 pt-3.5 pb-5 bg-white border-t border-gray-50">
          {/* 예약가능 골프장만 보기 */}
          <button
            type="button"
            onClick={() => setPendingAvailable(v => !v)}
            className="flex items-center gap-2 mb-3"
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
              pendingAvailable ? 'bg-gray-1000' : 'border-2 border-gray-200 bg-white'
            }`}>
              <Check className={`w-3 h-3 ${pendingAvailable ? 'text-white' : 'text-gray-200'}`} strokeWidth={3} />
            </span>
            <span className="text-[14px] font-medium text-gray-1000 tracking-[-0.3px]">예약가능 골프장만 보기</span>
          </button>

          {/* 초기화(흰색·narrow) / 적용하기(그린·flex-1) */}
          <div className="flex items-center gap-3">
            <button
              onClick={reset}
              className="flex-shrink-0 flex items-center justify-center gap-1.5 px-4 h-12 bg-white border border-gray-100 text-gray-600 rounded-[8px] text-[14px] font-medium tracking-[-0.2px] hover:bg-gray-5 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              초기화
            </button>
            <button
              onClick={apply}
              className="flex-1 h-12 rounded-[8px] text-[15px] font-medium tracking-[-0.2px] bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              적용하기
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
