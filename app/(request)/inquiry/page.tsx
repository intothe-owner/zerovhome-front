"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, User, Phone, Calendar, Clock, Receipt, Tag, AlertCircle } from "lucide-react";
import { formatNumber } from "@/lib/function";

// 💡 예약 데이터 타입 정의 (백엔드 구조 기반)
interface ReservationItem {
  id: number;
  category1: { id: number; name: string };
  category2: { id: number; name: string };
  unitCount: number;
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  address: string;
  detailAddress: string;
  reservationDate: string;
  reservationTime: string;
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

// 💡 예약 상태에 따른 한글명 및 컬러 배지 설정 헬퍼 함수
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'PENDING':
      return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">예약대기</span>;
    case 'ASSIGNED':
      return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">배정완료</span>;
    case 'IN_PROGRESS':
      return <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">작업중</span>;
    case 'COMPLETED':
      return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">작업완료</span>;
    case 'CANCELLED':
      return <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">예약취소</span>;
    default:
      return <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">알 수 없음</span>;
  }
};

export default function ReservationInquiryPage() {
  // 폼 입력 상태
  const [form, setForm] = useState({ name: "", phone: "" });
  // 검색이 실행될 때 사용할 쿼리 파라미터 상태
  const [queryParams, setQueryParams] = useState<{ name: string; phone: string } | null>(null);

  // ==========================================
  // [React Query] 예약 내역 조회 (GET)
  // ==========================================
  const { data: reservations = [], isLoading, isError, isFetching } = useQuery<ReservationItem[]>({
    // queryParams가 바뀔 때마다 새로운 캐시 키로 요쳥
    queryKey: ["reservations", queryParams?.name, queryParams?.phone],
    queryFn: async () => {
      if (!queryParams) return [];
      
      // 💡 앞서 만든 관리자 조회 API를 재사용합니다. (이름과 전화번호 쿼리스트링 전달)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservations?name=${encodeURIComponent(queryParams.name)}&phone=${encodeURIComponent(queryParams.phone)}`
      );
      const json = await res.json();
      return json.success ? json.data : [];
    },
    // queryParams가 null이 아닐 때만 API를 호출하도록 설정
    enabled: !!queryParams, 
  });

  // 검색 폼 제출 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      return alert("예약자 이름과 연락처를 모두 입력해주세요.");
    }
    // 💡 폼 데이터를 queryParams로 옮겨서 React Query가 fetch를 실행하도록 유도
    setQueryParams({ name: form.name, phone: form.phone });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 mt-10">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* 1. 검색 폼 영역 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-slate-800 px-8 py-8 text-white text-center">
            <h1 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
              <Search size={28} className="text-indigo-400" />
              예약 내역 조회
            </h1>
            <p className="text-slate-300 text-sm">예약 시 입력하신 이름과 연락처로 예약 진행 상황을 확인하세요.</p>
          </div>

          <form onSubmit={handleSearch} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <User size={16} className="text-slate-400" /> 예약자명
                </label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                  placeholder="예: 홍길동"
                  required 
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Phone size={16} className="text-slate-400" /> 연락처
                </label>
                <input 
                  type="tel" 
                  value={form.phone} 
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                  className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                  placeholder="예: 010-0000-0000"
                  required 
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={isFetching}
              className="w-full bg-indigo-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50"
            >
              {isFetching ? '조회 중...' : '예약 내역 조회하기'}
            </button>
          </form>
        </div>

        {/* 2. 조회 결과 영역 */}
        {queryParams && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-indigo-500 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Receipt className="text-indigo-500" size={24} /> 
              조회 결과 <span className="text-indigo-600">({reservations.length}건)</span>
            </h2>

            {isLoading || isFetching ? (
              <div className="py-12 text-center text-slate-400">데이터를 불러오는 중입니다...</div>
            ) : isError ? (
              <div className="py-12 text-center text-rose-500 flex flex-col items-center gap-2">
                <AlertCircle size={32} />
                데이터를 불러오는데 실패했습니다.
              </div>
            ) : reservations.length === 0 ? (
              <div className="py-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 flex flex-col items-center gap-3">
                <Search size={40} className="text-slate-300" />
                <p className="text-slate-500 font-medium">일치하는 예약 내역이 없습니다.</p>
                <p className="text-sm text-slate-400">이름과 연락처를 다시 한 번 확인해주세요.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reservations.map((item) => (
                  <div key={item.id} className="border border-slate-200 rounded-xl p-5 hover:border-indigo-300 transition-colors bg-slate-50/50">
                    
                    {/* 카드 헤더 (카테고리 & 상태) */}
                    <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 mb-1">
                          <Tag size={12} />
                          {item.category1?.name} &gt; {item.category2?.name}
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">
                          {item.address.split(' ')[0]} {item.address.split(' ')[1]} 고객님 예약건
                        </h3>
                      </div>
                      <div>
                        {getStatusBadge(item.status)}
                      </div>
                    </div>

                    {/* 카드 바디 (상세 정보) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-start gap-3">
                        <Calendar className="text-slate-400 shrink-0 mt-0.5" size={16} />
                        <div>
                          <p className="font-semibold text-slate-700">예약 일자</p>
                          <p className="text-slate-600">{item.reservationDate}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Clock className="text-slate-400 shrink-0 mt-0.5" size={16} />
                        <div>
                          <p className="font-semibold text-slate-700">예약 시간</p>
                          <p className="text-slate-600">{item.reservationTime.substring(0, 5)}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 sm:col-span-2 bg-white p-3 rounded-lg border border-slate-200">
                        <Receipt className="text-slate-400 shrink-0 mt-0.5" size={16} />
                        <div className="w-full flex justify-between items-center">
                          <p className="font-semibold text-slate-700">총 견적 금액 <span className="text-xs text-slate-400 font-normal">(VAT 별도)</span></p>
                          <p className="text-lg font-black text-indigo-600">{formatNumber(item.totalPrice)} 원</p>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}