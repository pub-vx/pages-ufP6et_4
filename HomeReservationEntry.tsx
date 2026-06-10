import { useNavigate } from 'react-router';
import { ChevronRight, ClipboardList } from 'lucide-react';

/**
 * 홈(티타임 예약 탭) 예약내역 진입점 — 검색 CTA 바로 아래.
 * 정적 배너: 예약 유무와 무관하게 "나의 예약 내역" 배너를 항상 노출 → /my-reservations.
 * (대안으로 "다가오는 라운드 요약형(C-2)"도 검토했으나 정적안으로 확정)
 * 모두 presentational — 데이터/로직 무관.
 */
export function HomeReservationEntry() {
  const navigate = useNavigate();

  return (
    <div className="rt-section-pad pt-4 pb-4">
      <button
        onClick={() => navigate('/my-reservations')}
        className="w-full flex items-center gap-3 py-3 px-3.5 rounded-[8px] border border-primary-200 bg-primary-100 text-left hover:bg-[#E2F7EE] transition-colors"
      >
        <span className="flex-shrink-0 w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center">
          <ClipboardList className="w-[18px] h-[18px] text-white" strokeWidth={2.2} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium text-gray-1000 tracking-[-0.3px]">나의 예약 내역</p>
          <p className="text-[12px] font-medium text-gray-600 tracking-[-0.2px]">
            예약하신 라운드를 확인하세요
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-primary-600 flex-shrink-0" />
      </button>
    </div>
  );
}
