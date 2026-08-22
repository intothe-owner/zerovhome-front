"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Search, CalendarDays, RefreshCw, ChevronRight } from "lucide-react";
import { formatNumber } from "@/lib/function";

// 💡 예약 데이터 타입
interface ReservationItem {
  id: number;
  category1: { id: number; name: string };
  category2: { id: number; name: string };
  unitCount: number;
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  reservationDate: string;
  reservationTime: string;
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  worker: { id: number; name: string } | null;
  createdAt: string;
}

// 💡 상태별 배지 컴포넌트
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    ASSIGNED: "bg-blue-100 text-blue-700 border-blue-200",
    IN_PROGRESS: "bg-indigo-100 text-indigo-700 border-indigo-200",
    COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
  };
  const labels: Record<string, string> = {
    PENDING: "예약대기",
    ASSIGNED: "배정완료",
    IN_PROGRESS: "작업중",
    COMPLETED: "작업완료",
    CANCELLED: "예약취소",
  };
  
  return (
    <span className={`px-2.5 py-1 text-[11px] font-bold border rounded-full ${styles[status] || styles.CANCELLED}`}>
      {labels[status] || "알 수 없음"}
    </span>
  );
};

export default function AdminReservationListPage() {
  const router = useRouter();
  
  // 💡 검색 및 필터 상태
  const [filters, setFilters] = useState({
    name: "",
    phone: "",
    status: ""
  });
  
  // React Query에 넘길 실제 적용된 필터 상태
  const [activeFilters, setActiveFilters] = useState({ ...filters });

  // ==========================================
  // [React Query] 데이터 조회
  // ==========================================
  const { data: reservations = [], isLoading, isFetching, refetch } = useQuery<ReservationItem[]>({
    queryKey: ["admin-reservations", activeFilters],
    queryFn: async () => {
      // 필터 조건들을 URL 쿼리 파라미터로 변환
      const params = new URLSearchParams();
      if (activeFilters.name) params.append("name", activeFilters.name);
      if (activeFilters.phone) params.append("phone", activeFilters.phone);
      if (activeFilters.status) params.append("status", activeFilters.status);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservations?${params.toString()}`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  // 검색 버튼 클릭 시 필터 적용
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveFilters({ ...filters });
  };

  // 초기화
  const handleReset = () => {
    setFilters({ name: "", phone: "", status: "" });
    setActiveFilters({ name: "", phone: "", status: "" });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      
      {/* 1. 페이지 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="text-indigo-600" /> 예약/견적 관리
          </h2>
          <p className="text-sm text-slate-500 mt-1">고객의 예약 및 견적 신청 내역을 조회하고 직원을 배정합니다.</p>
        </div>
        <div className="text-sm font-semibold text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          총 <span className="text-indigo-600">{reservations.length}</span> 건
        </div>
      </div>

      {/* 2. 검색 및 필터 박스 */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 mb-1.5">상태 필터</label>
            <select 
              value={filters.status} 
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">전체 상태</option>
              <option value="PENDING">예약대기 (미배정)</option>
              <option value="ASSIGNED">배정완료</option>
              <option value="IN_PROGRESS">작업중</option>
              <option value="COMPLETED">작업완료</option>
              <option value="CANCELLED">취소</option>
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 mb-1.5">고객명</label>
            <input 
              type="text" 
              value={filters.name} 
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              placeholder="예: 홍길동"
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 mb-1.5">연락처</label>
            <input 
              type="text" 
              value={filters.phone} 
              onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
              placeholder="예: 010"
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button 
              type="button" 
              onClick={handleReset}
              className="flex-1 md:flex-none px-4 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={14} /> 초기화
            </button>
            <button 
              type="submit" 
              className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <Search size={14} /> 검색
            </button>
          </div>
        </form>
      </div>

      {/* 3. 예약 리스트 테이블 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
        {/* 로딩 인디케이터 (배경 흐리게) */}
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <span className="text-indigo-600 font-semibold flex items-center gap-2">
              <RefreshCw size={16} className="animate-spin" /> 데이터를 불러오는 중...
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-bold text-center">No</th>
                <th className="px-4 py-3 font-bold">진행상태</th>
                <th className="px-4 py-3 font-bold">서비스 구분</th>
                <th className="px-4 py-3 font-bold">고객 정보</th>
                <th className="px-4 py-3 font-bold">예약 일정</th>
                <th className="px-4 py-3 font-bold text-right">총 견적가</th>
                <th className="px-4 py-3 font-bold text-center">배정 직원</th>
                <th className="px-4 py-3 font-bold text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-400">
                    등록된 예약 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                reservations.map((item) => (
                  <tr 
                    key={item.id} 
                    className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                    // 💡 행(Row) 전체를 클릭해도 상세 페이지로 이동
                    onClick={() => router.push(`/admin/service/reservations/${item.id}`)}
                  >
                    <td className="px-4 py-4 text-center text-slate-400 font-medium">{item.id}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-slate-800 font-bold">{item.category2?.name}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{item.category1?.name}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-slate-800 font-bold">{item.customerName}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{item.customerPhone}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-slate-800 font-semibold">{item.reservationDate}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{item.reservationTime.substring(0,5)}</div>
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-slate-700">
                      {formatNumber(item.totalPrice)}<span className="text-xs font-normal text-slate-400 ml-0.5">원</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {item.worker ? (
                        <span className="text-indigo-600 font-bold text-xs bg-indigo-50 px-2 py-1 rounded">
                          {item.worker.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button 
                        // 버튼을 눌렀을 때는 이벤트 버블링 방지 후 이동
                        onClick={(e) => { e.stopPropagation(); router.push(`/admin/service/reservations/${item.id}`); }}
                        className="text-slate-400 group-hover:text-indigo-600 bg-white border border-slate-200 group-hover:border-indigo-300 p-1.5 rounded transition-all"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}