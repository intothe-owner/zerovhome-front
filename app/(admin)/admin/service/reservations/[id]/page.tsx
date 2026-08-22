"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, User, Phone, MapPin, Calendar, Clock, 
  Receipt, Tag, Briefcase, CheckCircle2, Save, AlertCircle
} from "lucide-react";
import { formatNumber } from "@/lib/function";

// 💡 타입 정의
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
}

interface Member {
  id: number;
  name: string;
  level: number;
  companyName?: string;
}

export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const reservationId = Number(params.id);

  // 배정 및 상태 변경을 위한 로컬 폼 상태
  const [form, setForm] = useState<{ status: string; workerId: string }>({
    status: "PENDING",
    workerId: "",
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
      // 💡 수정됨: 회원 데이터 중 level이 10인(관리자 겸 직원) 회원만 필터링하여 목록에 표시
      return json.success ? json.data.filter((m: Member) => m.level === 10) : [];
    },
  });
  console.log(members);

  // 데이터 로드 시 폼 초기값 세팅
  useEffect(() => {
    if (reservation) {
      setForm({
        status: reservation.status,
        workerId: reservation.workerId ? String(reservation.workerId) : "",
      });
    }
  }, [reservation]);

  // ==========================================
  // 3. [React Query] 상태 업데이트 및 배정 (PUT)
  // ==========================================
  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        status: form.status,
        workerId: form.workerId ? Number(form.workerId) : null,
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
      // 상세 데이터 및 목록 데이터 캐시 갱신
      queryClient.invalidateQueries({ queryKey: ["reservation", reservationId] });
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      alert("배정 및 상태 정보가 성공적으로 변경되었습니다.");
    },
    onError: (error: Error) => {
      alert(`수정 실패: ${error.message}`);
    }
  });

  if (isLoading) return <div className="p-12 text-center text-slate-500 font-bold">데이터를 불러오는 중...</div>;
  if (isError || !reservation) return <div className="p-12 text-center text-rose-500 font-bold flex flex-col items-center gap-2"><AlertCircle />예약 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      
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
        
        {/* 진행 상태 뱃지 */}
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
        
        {/* 왼쪽 영역: 고객 및 예약 정보 */}
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
              <Tag className="text-indigo-500" size={20} /> 서비스 및 견적 정보
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
                  <p className="text-xs font-bold text-slate-400 mb-1">희망 방문 일자</p>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                    <Calendar size={14} className="text-slate-400" /> {reservation.reservationDate}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 mb-1">희망 방문 시간</p>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                    <Clock size={14} className="text-slate-400" /> {reservation.reservationTime.substring(0,5)}
                  </div>
                </div>
              </div>
              <div className="sm:col-span-2 mt-2 bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="text-slate-400" size={20} />
                  <span className="font-bold text-slate-700">총 견적 금액 <span className="text-xs font-normal text-slate-400">(VAT 별도)</span></span>
                </div>
                <div className="text-2xl font-black text-indigo-600">
                  {formatNumber(reservation.totalPrice)} <span className="text-lg font-bold text-slate-700">원</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 오른쪽 영역: 진행 상태 및 직원 배정 */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-md shadow-indigo-100/50 sticky top-6">
            <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Briefcase className="text-indigo-500" size={20} /> 배정 및 진행상태
            </h3>
            
            <div className="space-y-5">
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">진행 상태</label>
                <select 
                  value={form.status} 
                  onChange={(e) => setForm({...form, status: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                >
                  <option value="PENDING">예약대기 (미배정)</option>
                  <option value="ASSIGNED">배정완료</option>
                  <option value="IN_PROGRESS">작업중</option>
                  <option value="COMPLETED">작업완료</option>
                  <option value="CANCELLED">예약취소</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">직원 배정</label>
                <select 
                  value={form.workerId} 
                  onChange={(e) => setForm({...form, workerId: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                >
                  <option value="">직원을 선택하세요 (미배정)</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} {member.companyName ? `(${member.companyName})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  직원을 배정하고 상태를 <span className="font-bold text-slate-500">'배정완료'</span>로 변경하면 현장 작업자의 모바일로 알림이 발송됩니다. (알림 연동 시)
                </p>
              </div>

              <button 
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {updateMutation.isPending ? '저장 중...' : <><Save size={18} /> 배정 및 상태 저장</>}
              </button>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}