"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, User, Phone, MapPin, Calendar, Clock, 
  Receipt, Tag, Briefcase, CheckCircle2, Save, AlertCircle
} from "lucide-react";
import { formatNumber } from "@/lib/function";

interface ReservationDetail {
  id: number;
  category1: { id: number; name: string };
  category2: { id: number; name: string };
  unitCount: number;
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  address: string;
  detailAddress: string | null;
  reservationDate: string;
  reservationTime: string;
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  worker: { id: number; name: string; phone?: string; companyName?: string } | null;
  workerId: number | null;
  createdAt: string;
  extraDetails: { brand: string; year: string; size: string; location: string; environment: string[] }[] | null;
}

interface Member {
  id: number;
  name: string;
  level: number;
  companyName?: string;
}

// 💡 관리자가 시간을 구체적으로 설정할 수 있도록 텍스트 입력과 빠른 선택을 돕는 옵션
const TIME_PERIOD_OPTIONS = [
  "오전 (8시~12시)", "오후 (13시~16시)", "언제든 (8시~16시)",
  "08:00","08:30",
  "09:00","09:30",
  "10:00","10:30",
  "11:00","11:30",
  "12:00","12:30",
  "13:00","13:30",
  "14:00","14:30",
  "15:00","15:30",
  "16:00"
];

export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const reservationId = Number(params.id);

  // 💡 배정, 상태뿐만 아니라 실예약일, 실시간, 실가격까지 관리하는 로컬 폼 상태
  const [form, setForm] = useState({
    status: "PENDING",
    workerId: "",
    reservationDate: "",
    reservationTime: "",
    totalPrice: 0,
  });

  // ==========================================
  // 1. [React Query] 예약 상세 정보 조회
  // ==========================================
  const { data: reservation, isLoading, isError } = useQuery<ReservationDetail>({
    queryKey: ["reservation", reservationId],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservations/${reservationId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    enabled: !!reservationId,
  });

  // ==========================================
  // 2. [React Query] 직원(Member) 목록 조회
  // ==========================================
  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["members-list"],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/members/members`);
      const json = await res.json();
      return json.success ? json.data.filter((m: Member) => m.level === 10) : [];
    },
  });

  // 데이터 로드 시 폼 초기값 세팅 (고객 희망 내역을 기본값으로 세팅)
  useEffect(() => {
    if (reservation) {
      setForm({
        status: reservation.status,
        workerId: reservation.workerId ? String(reservation.workerId) : "",
        reservationDate: reservation.reservationDate || "",
        reservationTime: reservation.reservationTime || "",
        totalPrice: reservation.totalPrice || 0,
      });
    }
  }, [reservation]);

  // ==========================================
  // 3. [React Query] 정보 업데이트 및 배정 (PUT)
  // ==========================================
  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        status: form.status,
        workerId: form.workerId ? Number(form.workerId) : null,
        reservationDate: form.reservationDate, // 💡 확정 날짜 전송
        reservationTime: form.reservationTime, // 💡 확정 시간 전송
        totalPrice: Number(form.totalPrice),   // 💡 확정 가격 전송 (콤마 없는 순수 숫자)
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservations/${reservationId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservation", reservationId] });
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      alert("배정 및 확정 정보가 성공적으로 저장되었습니다.");
    },
    onError: (error: Error) => {
      alert(`수정 실패: ${error.message}`);
    }
  });

  if (isLoading) return <div className="p-12 text-center text-slate-500 font-bold">데이터를 불러오는 중...</div>;
  if (isError || !reservation) return <div className="p-12 text-center text-rose-500 font-bold flex flex-col items-center gap-2"><AlertCircle />예약 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* 상단 헤더 & 뒤로가기 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/admin/service/reservations')}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">예약 상세 정보</h2>
            <p className="text-sm text-slate-500">예약번호 #{reservation.id}</p>
          </div>
        </div>
        
        <div className="bg-white px-4 py-2 border border-slate-200 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2">
          현재 상태 : 
          <span className={`px-2 py-0.5 rounded text-xs ${
            reservation.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
            reservation.status === 'CANCELLED' ? 'bg-slate-100 text-slate-500' :
            'bg-indigo-100 text-indigo-700'
          }`}>
            {reservation.status === 'PENDING' ? '예약대기' : 
             reservation.status === 'ASSIGNED' ? '배정완료' : 
             reservation.status === 'IN_PROGRESS' ? '작업중' : 
             reservation.status === 'COMPLETED' ? '작업완료' : '취소됨'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 왼쪽 영역: 고객이 신청한 원본 정보 (읽기 전용) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="text-indigo-500" size={20} /> 고객 및 현장 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-bold text-slate-400 mb-1">고객명 (회사명)</p>
                <p className="text-sm font-semibold text-slate-800">{reservation.customerName}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 mb-1">연락처</p>
                <div className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                  <Phone size={14} className="text-slate-400" /> {reservation.customerPhone}
                </div>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs font-bold text-slate-400 mb-1">방문 주소</p>
                <div className="flex items-start gap-1.5 text-sm font-semibold text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" /> 
                  <span>{reservation.address} {reservation.detailAddress}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Tag className="text-indigo-500" size={20} /> 서비스 및 고객 희망 견적 (원본)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 mb-1">신청 서비스</p>
                  <p className="text-sm font-bold text-indigo-600 bg-indigo-50 inline-block px-2 py-1 rounded">
                    {reservation.category1?.name} &gt; {reservation.category2?.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 mb-1">수량 / 단위</p>
                  <p className="text-sm font-semibold text-slate-800">{reservation.unitCount}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 mb-1">고객 희망 방문 일자</p>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                    <Calendar size={14} className="text-slate-400" /> {reservation.reservationDate}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 mb-1">고객 희망 방문 시간</p>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                    <Clock size={14} className="text-slate-400" /> {reservation.reservationTime}
                  </div>
                </div>
              </div>
              <div className="sm:col-span-2 mt-2 bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between opacity-70">
                <div className="flex items-center gap-2">
                  <Receipt className="text-slate-400" size={20} />
                  <span className="font-bold text-slate-700">시스템 예상 견적 <span className="text-xs font-normal text-slate-400">(변경 전)</span></span>
                </div>
                <div className="text-xl font-bold text-slate-500 line-through">
                  {formatNumber(reservation.totalPrice)} 원
                </div>
              </div>
            </div>
          </div>

          {/* 에어컨 등 추가 상세 정보 */}
          {reservation.extraDetails && Array.isArray(reservation.extraDetails) && (
            <div className="sm:col-span-2 mt-4 space-y-4">
              {reservation.extraDetails.map((detail, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-100 p-5 rounded-xl relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-400"></div>
                  <p className="text-sm font-black text-indigo-600 mb-4 border-b border-slate-200 pb-2">#{idx + 1}번 기기 및 환경 정보</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-4">
                    {detail.brand && <div><span className="text-xs text-slate-400 block mb-1">제조사</span><span className="text-sm font-bold text-slate-700">{detail.brand}</span></div>}
                    {detail.year && <div><span className="text-xs text-slate-400 block mb-1">구입 연식</span><span className="text-sm font-bold text-slate-700">{detail.year}</span></div>}
                    {detail.size && <div><span className="text-xs text-slate-400 block mb-1">크기</span><span className="text-sm font-bold text-slate-700">{detail.size}</span></div>}
                    {detail.location && <div><span className="text-xs text-slate-400 block mb-1">설치 장소</span><span className="text-sm font-bold text-slate-700">{detail.location}</span></div>}
                    
                    {detail.environment && detail.environment.length > 0 && (
                      <div className="col-span-2 sm:col-span-4 mt-2">
                        <span className="text-xs text-slate-400 block mb-2">시공 환경 (특이사항)</span>
                        <div className="flex flex-wrap gap-2">
                          {detail.environment.map((env: string, eIdx: number) => (
                            <span key={eIdx} className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm">{env}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* 오른쪽 영역: 실예약 확정 및 직원 배정 컨트롤러 */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-xl shadow-indigo-100/50 sticky top-6">
            <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Briefcase className="text-indigo-500" size={20} /> 실예약 확정 및 배정
            </h3>
            
            <div className="space-y-6">
              
              {/* 확정 일자 */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">확정 방문 일자</label>
                <input 
                  type="date" 
                  value={form.reservationDate} 
                  onChange={(e) => setForm({...form, reservationDate: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>

              {/* 확정 시간 */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">확정 방문 시간</label>
                <input 
                  type="text" 
                  list="timeOptions"
                  value={form.reservationTime} 
                  onChange={(e) => setForm({...form, reservationTime: e.target.value})}
                  placeholder="예: 14:00 또는 오후 2시"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
                <datalist id="timeOptions">
                  {TIME_PERIOD_OPTIONS.map(time => <option key={time} value={time} />)}
                </datalist>
              </div>

              {/* 💡 최종 결제 금액 (포맷팅 적용) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-sm font-bold text-indigo-700 mb-2">최종 결제 금액 (실가격)</label>
                <div className="relative">
                  <input 
                    type="text" // 💡 콤마를 입력받기 위해 text 타입으로 변경
                    value={formatNumber(form.totalPrice)} // 화면 표시 시 콤마 추가
                    onChange={(e) => {
                      // 입력 시 콤마 제외하고 순수 숫자로 state 변경
                      const rawValue = e.target.value.replace(/,/g, '');
                      setForm({...form, totalPrice: Number(rawValue) || 0});
                    }}
                    className="w-full border-2 border-indigo-200 rounded-lg p-3 pr-8 text-right font-black text-lg text-indigo-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <span className="absolute right-3 top-3 text-slate-500 font-bold">원</span>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* 직원 배정 */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">현장 직원 배정</label>
                <select 
                  value={form.workerId} 
                  onChange={(e) => setForm({...form, workerId: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">직원을 선택하세요 (미배정)</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} {member.companyName ? `(${member.companyName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 진행 상태 */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">진행 상태 변경</label>
                <select 
                  value={form.status} 
                  onChange={(e) => setForm({...form, status: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="PENDING">예약대기 (상담/조율 중)</option>
                  <option value="ASSIGNED">배정완료 (일정 확정)</option>
                  <option value="IN_PROGRESS">작업중</option>
                  <option value="COMPLETED">작업완료 (결제 대기/완료)</option>
                  <option value="CANCELLED">예약취소</option>
                </select>
              </div>

              <button 
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {updateMutation.isPending ? '저장 중...' : <><Save size={18} /> 실예약 확정 및 배정 저장</>}
              </button>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}