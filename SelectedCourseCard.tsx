import { type GolfCourse } from '../../data/mockData';
import { PriceDual } from '../../lib/price';
import { formatCourseDistance } from '../../lib/geo';
import { getParentRegion } from '../../lib/regions';
import { MapBottomCard } from './MapBottomCard';

interface Props {
  course: GolfCourse;
  onOpen: () => void;
  onClose: () => void;
}

export function SelectedCourseCard({ course, onOpen, onClose }: Props) {
  const parent = getParentRegion(course.region);
  const regionLabel = parent ? `${parent} ${course.region}` : course.region;
  return (
    <MapBottomCard>
      <button onClick={onOpen} className="w-full flex gap-3 p-3 text-left">
        <img
          src={course.image}
          alt={course.name}
          className="w-20 h-16 rounded-[8px] object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[14px] text-gray-1000 truncate mb-0.5">{course.name}</h3>
          <p className="text-[13px] font-medium text-gray-500 tracking-[-0.75px] mb-1">
            {regionLabel} · {formatCourseDistance(course)}
          </p>
          <div className="flex items-end justify-between">
            <PriceDual
              jpy={course.lowestPrice}
              remainingTeams={course.remainingTeams}
              size="base"
            />
            <span className="text-[13px] text-primary-600 font-medium tracking-[-0.75px] whitespace-nowrap ml-auto">{course.plans.length}개 플랜</span>
          </div>
        </div>
      </button>
      <button
        onClick={onClose}
        className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-500"
      >
        ×
      </button>
    </MapBottomCard>
  );
}
