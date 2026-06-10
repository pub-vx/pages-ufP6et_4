import { Upload } from 'lucide-react';
import type { GolfCourse } from '../../data/mockData';
import { Badge } from '../ui/badge';
import { formatCourseDistance } from '../../lib/geo';
import { getParentRegion } from '../../lib/regions';

interface CourseInfoCardProps {
  course: GolfCourse;
  onShare?: () => void;
}

export function CourseInfoCard({ course, onShare }: CourseInfoCardProps) {
  const parentRegion = getParentRegion(course.region);
  return (
    <div className="bg-white px-4 py-4 border-b border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-1000 mb-1">{course.name}</h2>

          {/* 뱃지 — 추천/외국인예약 가능은 노출 제외 */}
          {course.tags && course.tags.filter(t => t !== '추천' && t !== '초보자 추천').length > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              {course.tags
                .filter(t => t !== '추천' && t !== '초보자 추천')
                .map(tag => (
                  <Badge
                    key={tag}
                    className={`text-[11px] px-2 py-0.5 rounded-sm ${
                      tag === '특가' ? 'bg-negative text-white' : 'bg-primary-600 text-white'
                    }`}
                  >
                    {tag}
                  </Badge>
                ))}
            </div>
          )}

          {/* 기본 정보 라인 — 권역(1차 + 2차 이어서) + 우측에 브랜드·별점·후기 수 */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[13px] text-gray-500 font-medium tracking-[-0.75px]">
              {parentRegion ? `${parentRegion} ${course.region}` : course.region}
            </p>
            <span className="text-gray-100" style={{ fontSize: 12 }}>|</span>
            <p className="text-[13px] font-medium tracking-[-0.2px] inline-flex items-center gap-1">
              {course.brand && (
                <span className="text-gray-1000 font-medium">{course.brand}</span>
              )}
              <span className="text-[#FFB400]">★</span>
              <span className="text-gray-1000 font-medium">{course.rating.toFixed(1)}</span>
              <span className="text-gray-300">({course.reviewCount})</span>
              {course.ratingSource && (
                <span className="text-gray-300" style={{ fontSize: 11 }}>· {course.ratingSource}</span>
              )}
            </p>
          </div>

          {/* 교통 정보 */}
          <p className="text-[13px] text-gray-500 font-medium tracking-[-0.75px] mt-0.5">
            {formatCourseDistance(course)}
          </p>

        </div>

        {/* 공유 버튼 */}
        <button onClick={onShare} className="p-1 text-gray-1000" aria-label="공유">
          <Upload className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
