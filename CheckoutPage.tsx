import { useState } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { ChevronRight, AlertCircle, UserPlus, Clock } from 'lucide-react';
import { AppHeader } from './AppHeader';
import { useAppState } from '../data/store';
import { getCourseById, getPlanById, formatJpy, formatKrw, jpyToKrw } from '../data/mockData';
import { SellerInfoTable } from './SellerInfoTable';
import type { Reservation, CourseNotice } from '../data/mockData';
import { Section } from './checkout/Section';
import { KrwHint } from './KrwHint';
import { LegalFooter } from './LegalFooter';
import { PlanNoticeContent, NoticeModeToggle, type NoticeMode } from './course-detail/PlanNoticeSheet';

/** 유의사항 섹션 — 번역/원문 토글을 타이틀 우측에 배치(본문과 상태 공유) */
function NoticeSection({ notice }: { notice?: CourseNotice }) {
  const [mode, setMode] = useState<NoticeMode>('translated');
  return (
    <Section title="유의사항" trailing={<NoticeModeToggle mode={mode} onChange={setMode} />}>
      <PlanNoticeContent notice={notice} showToggle={false} mode={mode} onModeChange={setMode} />
    </Section>
  );
}

export function CheckoutPage() {
  const { courseId, planId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addReservation } = useAppState();

  const course = getCourseById(courseId || '');
  const plan = getPlanById(courseId || '', planId || '');

  // 1인은 옵션에서 제외 → 최소 2인부터
  const [totalPlayer, setTotalPlayer] = useState(Math.max(2, plan?.minPlayer || 2));
  // 티타임:
  //  - ?time=HH:MM 쿼리로 직접 들어오면 그 값 사용
  //  - 플랜 카드만 누르고 진입한 경우엔 plan.times[0] 으로 자동 선택 (사용자가 추가 동작 없이 결제 진행 가능)
  //  - 어느 쪽이든 사용자가 시간 셀렉터를 펼쳐 변경 가능
  const initialTime = searchParams.get('time') || plan?.times?.[0] || '';
  const [selectedTime, setSelectedTime] = useState(initialTime);
  const [showTimeSelector, setShowTimeSelector] = useState(false);
  const [hasPickedTime, setHasPickedTime] = useState(!!initialTime);

  // 본인 추가 정보
  const [myNameEn, setMyNameEn] = useState('');
  const [myEmail, setMyEmail] = useState('');

  // 동반자 (내장인원 - 1 만큼 슬롯). 여권상 영문 성/이름 두 필드만 사용.
  const companionCount = totalPlayer - 1;
  const [companions, setCompanions] = useState<{ surname: string; givenName: string }[]>([]);

  // 약관 동의
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeCancelPolicy, setAgreeCancelPolicy] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeThirdParty, setAgreeThirdParty] = useState(false);
  const [agreeOverseas, setAgreeOverseas] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);

  if (!course || !plan) {
    return <div className="p-8 text-center text-gray-300">예약 정보를 찾을 수 없습니다</div>;
  }

  const isPrepay = plan.paymentType === 'prepay';

  // --- handlers ---
  const handlePlayerCountChange = (count: number) => {
    setTotalPlayer(count);
    // 동반자 슬롯 수 조정
    const newCompCount = count - 1;
    setCompanions(prev => {
      if (prev.length <= newCompCount) {
        return [...prev, ...Array(newCompCount - prev.length).fill({ surname: '', givenName: '' })];
      }
      return prev.slice(0, newCompCount);
    });
  };

  const updateCompanion = (index: number, field: 'surname' | 'givenName', value: string) => {
    setCompanions(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreeCancelPolicy(checked);
    setAgreePrivacy(checked);
    setAgreeThirdParty(checked);
    setAgreeOverseas(checked);
  };

  const handleSingleAgree = (setter: (v: boolean) => void, val: boolean) => {
    setter(val);
    const next = [agreeCancelPolicy, agreePrivacy, agreeThirdParty, agreeOverseas];
    if (setter === setAgreeCancelPolicy) next[0] = val;
    if (setter === setAgreePrivacy) next[1] = val;
    if (setter === setAgreeThirdParty) next[2] = val;
    if (setter === setAgreeOverseas) next[3] = val;
    setAgreeAll(next.every(Boolean));
  };

  const allAgreed = agreeCancelPolicy && agreePrivacy && agreeThirdParty && agreeOverseas;

  const perPersonJpy = plan.basePrice;
  const totalJpy = perPersonJpy * totalPlayer;
  const totalKrw = jpyToKrw(totalJpy);

  const cancelDeadline = '2026.04.11 (금) 23:59';
  const payDeadline = '2026.04.17 (목) 23:59';

  const handleSubmit = () => {
    if (!hasPickedTime || !allAgreed || isProcessing) return;
    setIsProcessing(true);
    setTimeout(() => {
      const reservationId = `OT-2026-${Date.now().toString().slice(-8)}`;
      const reservation: Reservation = {
        id: reservationId,
        reservationCode: reservationId,
        courseId: course.id,
        planId: plan.id,
        playDate: '2026-04-18',
        teeTime: selectedTime,
        totalPlayer,
        name: '홍길동',
        nameEn: myNameEn || 'GILDONG HONG',
        email: 'test0001@example.com',
        phone: '010-1234-5678',
        players: companions
          .filter(p => p.surname.trim() || p.givenName.trim())
          .map(p => ({
            // 한글 이름 입력 제거 → 영문 fullname을 name 필드에 함께 저장
            name: `${p.surname} ${p.givenName}`.trim(),
            nameEn: `${p.surname} ${p.givenName}`.trim().toUpperCase(),
          })),
        status: 'ACTIVE',
        paidAmount: totalJpy,
        paidAmountKrw: totalKrw,
        currency: 'JPY',
        createdAt: new Date().toISOString(),
      };
      addReservation(reservation);
      setIsProcessing(false);
      navigate(`/booked/${reservationId}`);
    }, 1500);
  };

  // 표시용 — 라운드 일자 (mock)
  const playDate = '2026.04.18';
  // 옵션 — 플레이 조건/설비 위주로 derived (식사·세금·시설이용료 등은 제외)
  const optionList: string[] = [];
  // 홀정보 (18홀 / 9홀 등) — 가장 먼저
  const holeLabel = plan.roundCode === '18H' ? '18홀' : plan.roundCode;
  if (holeLabel) optionList.push(holeLabel);
  const hasCart = plan.includes.some(i => i.includes('카트'));
  const isThru = plan.badges?.includes('쓰루플레이') || plan.includes.some(i => i.includes('쓰루'));
  const hasCaddie = plan.includes.some(i => i.includes('캐디'));
  const isSelf = plan.badges?.includes('셀프') || plan.badges?.includes('셀프플레이');
  if (hasCart) optionList.push('카트포함');
  if (hasCaddie) optionList.push('캐디포함');
  if (isSelf) optionList.push('셀프플레이');
  if (isThru) optionList.push('쓰루플레이');
  if (plan.minPlayer <= 2 && plan.maxPlayer >= 2) optionList.push('2인 플레이 가능');
  if (plan.minPlayer <= 3 && plan.maxPlayer >= 3) optionList.push('3인 플레이 가능');
  const optionsText = optionList.length > 0 ? optionList.join(' / ') : '없음';

  return (
    <div className="rt-content-wrap min-h-screen bg-gray-10">
      {/* 헤더 */}
      <AppHeader title="예약하기" showHome />

      {/* 1. 상품 정보 */}
      <Section title="상품 정보" first>
        <div className="flex gap-3 mb-4 items-start">
          <img src={course.image} alt={course.name} className="w-[100px] h-[100px] rounded-[8px] object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-[4px] mb-1.5 ${
                isPrepay ? 'bg-primary-200 text-primary-700' : 'bg-gray-10 text-gray-600'
              }`}
              style={{ fontSize: 11, fontWeight: 500, letterSpacing: '-0.2px' }}
            >
              {isPrepay ? '선결제' : '현장결제'}
            </span>
            <p
              className="text-gray-1000 leading-snug"
              style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}
            >
              {course.name}
            </p>
            <p
              className="text-gray-1000 leading-snug mt-1"
              style={{ fontSize: 13, fontWeight: 500, letterSpacing: '-0.2px' }}
            >
              {plan.name}
            </p>
            <p
              className="text-gray-300 leading-snug mt-1.5"
              style={{ fontSize: 13, fontWeight: 500, letterSpacing: '-0.2px' }}
            >
              코스명[{plan.courseName}] / 홀정보[{plan.roundCode === '18H' ? '18홀' : plan.roundCode}]
            </p>
          </div>
        </div>

        {/* 라운드 일자 + 티타임 — 큰 카드 그리드 */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-5 border border-gray-50 rounded-[8px] py-3 px-3 text-center">
            <p
              className="text-positive mb-1"
              style={{ fontSize: 12, fontWeight: 500, letterSpacing: '-0.2px' }}
            >
              라운드 일자
            </p>
            <p
              className="text-gray-1000"
              style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.3px' }}
            >
              {playDate}
            </p>
          </div>
          <button
            onClick={() => setShowTimeSelector(s => !s)}
            className={`bg-gray-5 rounded-[8px] py-3 px-3 text-center transition-colors relative border ${
              hasPickedTime
                ? 'border-gray-50 hover:border-primary-600'
                : 'border-primary-600 ring-2 ring-primary-300'
            }`}
          >
            <p
              className="text-positive mb-1"
              style={{ fontSize: 12, fontWeight: 500, letterSpacing: '-0.2px' }}
            >
              티타임 시간
            </p>
            <div className="flex items-center justify-center gap-1">
              <p
                className={hasPickedTime ? 'text-gray-1000' : 'text-primary-600'}
                style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.3px' }}
              >
                {hasPickedTime ? selectedTime : '선택 필요'}
              </p>
              <ChevronRight className={`w-3.5 h-3.5 text-gray-300 transition-transform ${showTimeSelector ? 'rotate-90' : ''}`} />
            </div>
          </button>
        </div>

        {showTimeSelector && (
          <div className={`mb-3 p-3 rounded-[8px] border ${
            hasPickedTime ? 'bg-gray-5 border-gray-50' : 'bg-primary-100 border-primary-600'
          }`}>
            <p className="text-[12px] font-medium text-gray-1000 mb-2 inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-primary-600" />
              {hasPickedTime ? '티타임 변경' : '먼저 티타임을 선택해 주세요'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {plan.times.map(time => (
                <button
                  key={time}
                  onClick={() => { setSelectedTime(time); setHasPickedTime(true); setShowTimeSelector(false); }}
                  className={`px-3 py-1.5 rounded-[6px] text-[13px] font-medium border ${
                    selectedTime === time
                      ? 'border-primary-600 bg-white text-primary-600'
                      : 'border-gray-100 bg-white text-gray-1000'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        )}

        <ProductInfoRow label="옵션" value={optionsText} multiline />
        <ProductInfoRow label="취소가능기한">
          <span
            className="text-negative text-right"
            style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.2px' }}
          >
            {cancelDeadline}
          </span>
        </ProductInfoRow>
        <ProductInfoRow label="내장인원">
          <div className="flex items-center gap-1">
            {[2, 3, 4].filter(n => n >= Math.max(2, plan.minPlayer) && n <= plan.maxPlayer).map(n => {
              const active = totalPlayer === n;
              return (
                <button
                  key={n}
                  onClick={() => handlePlayerCountChange(n)}
                  className={`w-8 h-8 rounded-[4px] border transition-colors ${
                    active ? 'bg-gray-1000 border-gray-1000 text-white' : 'bg-white border-gray-100 text-gray-600'
                  }`}
                  style={{ fontSize: 13, fontWeight: 500, letterSpacing: '-0.2px' }}
                >
                  {n}인
                </button>
              );
            })}
          </div>
        </ProductInfoRow>
        <ProductInfoRow label="1인 결제금액">
          <div className="text-right">
            <p className="text-gray-1000" style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.2px' }}>
              {formatJpy(perPersonJpy)}
            </p>
            <p className="text-gray-300 mt-0.5" style={{ fontSize: 11, fontWeight: 500 }}>
              <KrwHint text={formatKrw(jpyToKrw(perPersonJpy))} />
            </p>
          </div>
        </ProductInfoRow>
      </Section>

      {/* 2. 예약자 정보 */}
      <Section title={<><span>예약자 정보</span><span className="text-negative ml-0.5">*</span></>}>
        <div className="space-y-2">
          <input
            type="text"
            defaultValue="홍길동"
            placeholder="이름"
            className="w-full h-11 px-3 bg-gray-5 border border-transparent rounded-[8px] text-[14px] text-gray-1000 outline-none focus:bg-white focus:border-primary-600 placeholder:text-gray-300 tracking-[-0.2px]"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={myNameEn.split(' ')[0] || ''}
              onChange={e => setMyNameEn(`${e.target.value.toUpperCase()} ${myNameEn.split(' ').slice(1).join(' ')}`.trim())}
              placeholder="여권상 영문 성"
              className="flex-1 min-w-0 h-11 px-3 bg-gray-5 border border-transparent rounded-[8px] text-[14px] text-gray-1000 outline-none focus:bg-white focus:border-primary-600 placeholder:text-gray-300 tracking-[-0.2px] uppercase"
            />
            <input
              type="text"
              value={myNameEn.split(' ').slice(1).join(' ') || ''}
              onChange={e => setMyNameEn(`${myNameEn.split(' ')[0] || ''} ${e.target.value.toUpperCase()}`.trim())}
              placeholder="여권상 영문 이름"
              className="flex-1 min-w-0 h-11 px-3 bg-gray-5 border border-transparent rounded-[8px] text-[14px] text-gray-1000 outline-none focus:bg-white focus:border-primary-600 placeholder:text-gray-300 tracking-[-0.2px] uppercase"
            />
          </div>
          <input
            type="tel"
            defaultValue="010-1234-5678"
            placeholder="전화번호"
            className="w-full h-11 px-3 bg-gray-5 border border-transparent rounded-[8px] text-[14px] text-gray-1000 outline-none focus:bg-white focus:border-primary-600 placeholder:text-gray-300 tracking-[-0.2px]"
          />
          <input
            type="email"
            value={myEmail}
            onChange={e => setMyEmail(e.target.value)}
            placeholder="이메일"
            className="w-full h-11 px-3 bg-gray-5 border border-transparent rounded-[8px] text-[14px] text-gray-1000 outline-none focus:bg-white focus:border-primary-600 placeholder:text-gray-300 tracking-[-0.2px]"
          />
        </div>
      </Section>

      {/* 3. 동반자 영문명 */}
      {companionCount > 0 && (
        <Section title={<><span>동반자 영문명</span><span className="text-negative ml-0.5">*</span></>}>
          <div className="space-y-3">
            {Array.from({ length: companionCount }).map((_, i) => (
              <div key={i}>
                <p className="inline-flex items-center gap-1 text-[13px] text-gray-1000 mb-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-gray-300" />
                  동반자 {i + 1}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={companions[i]?.surname || ''}
                    onChange={e => updateCompanion(i, 'surname', e.target.value.toUpperCase())}
                    placeholder="여권상 영문 성"
                    className="flex-1 min-w-0 h-11 px-3 bg-gray-5 border border-transparent rounded-[8px] text-[14px] text-gray-1000 outline-none focus:bg-white focus:border-primary-600 placeholder:text-gray-300 tracking-[-0.2px] uppercase"
                  />
                  <input
                    type="text"
                    value={companions[i]?.givenName || ''}
                    onChange={e => updateCompanion(i, 'givenName', e.target.value.toUpperCase())}
                    placeholder="여권상 영문 이름"
                    className="flex-1 min-w-0 h-11 px-3 bg-gray-5 border border-transparent rounded-[8px] text-[14px] text-gray-1000 outline-none focus:bg-white focus:border-primary-600 placeholder:text-gray-300 tracking-[-0.2px] uppercase"
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 유의사항 — 동반자 다음, 결제 정보 앞. 인라인 노출 + 토글은 타이틀 우측 (코스별 분기) */}
      <NoticeSection notice={course.notice} />

      {/* 결제 정보 */}
      <Section title="결제 정보">
        <div className="flex items-center justify-between py-3">
          <span
            className="text-gray-500"
            style={{ fontSize: 13, fontWeight: 500, letterSpacing: '-0.2px' }}
          >
            상품 금액
          </span>
          <span
            className="text-gray-1000"
            style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.2px' }}
          >
            {formatJpy(perPersonJpy)} × {totalPlayer}인
          </span>
        </div>
        <div className="flex justify-between items-center py-3 border-t border-gray-10">
          <span
            className="text-gray-1000"
            style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.2px' }}
          >
            총 결제 대상 금액
          </span>
          <div className="text-right">
            <p
              className="text-primary-600"
              style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.4px' }}
            >
              {formatJpy(totalJpy)}
            </p>
            <p
              className="text-gray-300 mt-0.5"
              style={{ fontSize: 11, fontWeight: 500 }}
            >
              <KrwHint text={formatKrw(totalKrw)} />
            </p>
          </div>
        </div>

        {/* 필수 확인사항 (mint box) */}
        <div className="mt-3 p-3 bg-primary-200 rounded-[8px]">
          <p
            className="inline-flex items-center gap-1 text-[#0E8F5D] mb-1.5"
            style={{ fontSize: 13, fontWeight: 500, letterSpacing: '-0.2px' }}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            필수 확인사항
          </p>
          <ul
            className="text-gray-1000 space-y-1 leading-relaxed list-disc pl-4"
            style={{ fontSize: 12, fontWeight: 500, letterSpacing: '-0.2px' }}
          >
            <li>표시된 금액의 통화 기준은 엔(¥)화입니다.</li>
            <li>
              {isPrepay
                ? '본 상품은 사전 결제 상품입니다. 결제 완료 후 예약이 확정됩니다.'
                : '본 상품은 이용요금 현장 결제 상품입니다. 현금(엔¥화) 또는 해당 골프장에서 지원하는 결제 수단으로 현장에서 이용 요금을 결제하실 수 있으며, 이용요금 결제 완료 후 예약 상품 이용이 가능합니다.'}
            </li>
            <li>총 결제 대상 금액에 표시된 금액 외 할증 요금이 발생할 수 있습니다. 옵션 선택 시 유의사항을 반드시 확인해 주시기 바랍니다.</li>
          </ul>
        </div>
      </Section>

      {/* 5. 이용 약관 */}
      <Section title="이용 약관">
        {/* 약관 전체 동의 */}
        <button
          onClick={() => handleAgreeAll(!agreeAll)}
          className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-[8px] border ${
            agreeAll ? 'bg-primary-100 border-primary-600' : 'bg-white border-gray-100'
          }`}
        >
          <span className={`w-5 h-5 flex-shrink-0 rounded-[4px] border flex items-center justify-center ${
            agreeAll ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-100'
          }`}>
            {agreeAll && <span className="text-white text-[12px] leading-none">✓</span>}
          </span>
          <span
            className="text-gray-1000"
            style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.2px' }}
          >
            약관 전체 동의
          </span>
        </button>

        <p
          className="text-gray-1000 mt-4 mb-1"
          style={{ fontSize: 13, fontWeight: 500, letterSpacing: '-0.2px' }}
        >
          카카오VX 이용약관
        </p>
        <div>
          {[
            { key: 'privacy', label: '[필수] 개인정보 수집 및 이용', state: agreePrivacy, setter: setAgreePrivacy },
            { key: 'thirdParty', label: '[필수] 개인정보 제 3자 제공 동의', state: agreeThirdParty, setter: setAgreeThirdParty },
            { key: 'overseas', label: '[필수] 개인정보 국외이전에 대한 동의', state: agreeOverseas, setter: setAgreeOverseas },
            { key: 'cancel', label: '[필수] 결제/취소/환불 규정에 따른 동의', state: agreeCancelPolicy, setter: setAgreeCancelPolicy },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => handleSingleAgree(item.setter, !item.state)}
              className="w-full flex items-center gap-2.5 py-3"
            >
              <span className={`w-5 h-5 flex-shrink-0 rounded-[4px] border flex items-center justify-center ${
                item.state ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-100'
              }`}>
                {item.state && <span className="text-white text-[12px] leading-none">✓</span>}
              </span>
              <span
                className="flex-1 text-left text-gray-600"
                style={{ fontSize: 13, fontWeight: 500, letterSpacing: '-0.2px' }}
              >
                {item.label}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          ))}
        </div>

        {/* 취소/환불 규정 box */}
        <div className="mt-3 p-3 bg-gray-10 rounded-[8px]">
          <p className="inline-flex items-center gap-1 text-[13px] font-medium text-gray-1000 mb-1">
            <AlertCircle className="w-3.5 h-3.5 text-gray-600" />
            취소/환불 규정
          </p>
          <p className="text-[12px] text-gray-600 leading-relaxed">
            플레이 5일 전부터 1인당 3,000엔의 취소 수수료가 발생합니다.
          </p>
        </div>

        {/* 임박 취소·NO SHOW 안내 */}
        <div className="mt-2 p-3 bg-gray-10 rounded-[8px]">
          <p className="text-[12px] text-gray-600 leading-relaxed tracking-[-0.3px]">
            *임박 기간 취소하실 경우 골프장 또는 카카오골프예약의 예약취소 규정에 따라 패널티 또는 취소수수료(위약금)가 발생합니다. 사전 취소 없이 골프장 미방문(NO SHOW)시 카카오골프예약의 계정은 영구정지되며, 안내 드리는 위약금 납부 시, 정지는 해지됩니다.
          </p>
        </div>
      </Section>

      {/* CTA */}
      <div className="sticky bottom-0 bg-white border-t border-gray-10 px-5 py-3">
        <button
          onClick={() => {
            if (isProcessing) return;
            if (!hasPickedTime) {
              import('sonner').then(({ toast }) => toast.info('먼저 티타임을 선택해 주세요', { duration: 2200, position: 'top-center' }));
              return;
            }
            if (!allAgreed) {
              import('sonner').then(({ toast }) => toast.info('필수 약관을 모두 동의해 주세요', { duration: 2200, position: 'top-center' }));
              return;
            }
            handleSubmit();
          }}
          className={`w-full py-4 rounded-[8px] text-[15px] font-medium transition-all ${
            hasPickedTime && allAgreed && !isProcessing
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-100 text-gray-300'
          }`}
        >
          {isProcessing ? '처리 중...' : '동의하고 예약하기'}
        </button>
      </div>

      {/* 판매자 정보 — [동의하고 예약하기] 아래. 전자상거래법상 통신판매중개자/판매자(공급자) 표시 (코스별 분기) */}
      <Section title="판매자 정보">
        <SellerInfoTable course={course} />
      </Section>

      <LegalFooter />
    </div>
  );
}

/* ── 상품 정보 라벨/값 행 ── */
/** 라벨 행 — 디자인 시스템: 라벨 13px gray-500, 값 14px gray-1000 medium, 우측 정렬 */
function ProductInfoRow({
  label, value, children, multiline = false, highlight = false, onClick,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
  multiline?: boolean;
  highlight?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`flex ${multiline ? 'items-start' : 'items-center'} gap-3 py-3`}
      onClick={onClick}
    >
      <span
        className="text-gray-500 flex-shrink-0"
        style={{ fontSize: 13, fontWeight: 500, letterSpacing: '-0.2px', minWidth: 88 }}
      >
        {label}
      </span>
      <div className="flex-1 min-w-0 flex justify-end">
        {children ?? (
          <span
            className={`text-right ${multiline ? 'leading-relaxed' : ''} ${highlight ? 'text-primary-600' : 'text-gray-1000'}`}
            style={{ fontSize: 14, fontWeight: highlight ? 700 : 500, letterSpacing: '-0.2px' }}
          >
            {value}
          </span>
        )}
      </div>
      {onClick && <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
    </div>
  );
}
