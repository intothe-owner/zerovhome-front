"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, User, Phone, Calendar, Clock, Receipt, Tag, AlertCircle, X, ChevronRight, MapPin, Briefcase, Calculator 
} from "lucide-react";
import { formatNumber } from "@/lib/function";

// 💡 예약 데이터 타입 정의 (notes 추가)
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
  worker: { id: number; name: string; phone?: string; companyName?: string } | null;
  createdAt: string;
  extraDetails?: { 
    brand: string; 
    year: string; 
    size: string; 
    location: string; 
    environment: string[];
    notes?: string; // 💡 기타사항 추가
  }[] | null;
}

// 예약 상태 배지 헬퍼 함수
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
  const [form, setForm] = useState({ name: "", phone: "" });
  const [queryParams, setQueryParams] = useState<{ name: string; phone: string } | null>(null);
  
  // 선택된 예약 상세 정보를 담을 상태 (모달 제어용)
  const [selectedItem, setSelectedItem] = useState<ReservationItem | null>(null);

  const { data: reservations = [], isLoading, isError, isFetching } = useQuery<ReservationItem[]>({
    queryKey: ["reservations", queryParams?.name, queryParams?.phone],
    queryFn: async () => {
      if (!queryParams) return [];
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservations?name=${encodeURIComponent(queryParams.name)}&phone=${encodeURIComponent(queryParams.phone)}`
      );
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: !!queryParams, 
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      return alert("예약자 이름과 연락처를 모두 입력해주세요.");
    }
    setQueryParams({ name: form.name, phone: form.phone });
  };

  return (
    <>
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
                    <div 
                      key={item.id} 
                      onClick={() => setSelectedItem(item)} // 클릭 시 모달 열기
                      className="group cursor-pointer border border-slate-200 rounded-xl p-5 hover:border-indigo-400 hover:shadow-md transition-all bg-white relative overflow-hidden"
                    >
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-indigo-500 transition-colors">
                        <ChevronRight size={24} />
                      </div>
                      
                      {/* 카드 헤더 */}
                      <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4 pr-6">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 mb-1">
                            <Tag size={12} />
                            {item.category1?.name} &gt; {item.category2?.name}
                          </div>
                          <h3 className="text-lg font-bold text-slate-800">
                            예약번호 #{item.id}
                          </h3>
                        </div>
                        <div>{getStatusBadge(item.status)}</div>
                      </div>

                      {/* 카드 요약 정보 */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pr-6">
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
                            <p className="text-slate-600">{item.reservationTime}</p>
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

      {/* 💡 예약 상세 정보 모달 */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">예약 상세 내역</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">예약번호 #{selectedItem.id}</p>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-2 text-slate-400 hover:text-slate-700 bg-white rounded-full border border-slate-200 shadow-sm transition-colors">
                <X size={20} />
              </button>
            </div>
            
            {/* 모달 바디 (스크롤 영역) */}
            <div className="p-6 overflow-y-auto space-y-6 bg-slate-50/50">
              
              {/* 진행 상태 및 결제 금액 (하이라이트) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-indigo-50/80 border border-indigo-100 p-5 rounded-2xl gap-4">
                <div>
                  <p className="text-xs font-bold text-indigo-500 mb-2">현재 진행 상태</p>
                  <div className="text-lg">{getStatusBadge(selectedItem.status)}</div>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs font-bold text-slate-500 mb-1">
                    {selectedItem.status === 'PENDING' ? '예상 결제 금액 (VAT 별도)' : '최종 결제 금액 (VAT 별도)'}
                  </p>
                  <p className="text-2xl font-black text-indigo-700">{formatNumber(selectedItem.totalPrice)} 원</p>
                </div>
              </div>

              {/* 그리드 레이아웃: 고객 정보 & 서비스 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. 고객 및 현장 정보 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <User className="text-indigo-500" size={18} /> 고객 및 현장 정보
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-slate-400 block mb-1 font-bold">예약자명</span>
                      <span className="text-sm font-semibold text-slate-700">{selectedItem.customerName}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block mb-1 font-bold">연락처</span>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        <Phone size={14} className="text-slate-400" /> {selectedItem.customerPhone}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block mb-1 font-bold">방문 주소</span>
                      <div className="flex items-start gap-1.5 text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" /> 
                        <span>{selectedItem.address} <br/> <span className="text-slate-500 font-medium">{selectedItem.detailAddress}</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. 서비스 및 일정 정보 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Tag className="text-indigo-500" size={18} /> 서비스 및 일정 정보
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-slate-400 block mb-1 font-bold">신청 서비스</span>
                      <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                        {selectedItem.category1?.name} &gt; {selectedItem.category2?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block mb-1 font-bold">수량 / 단위</span>
                      <span className="text-sm font-semibold text-slate-700">{selectedItem.unitCount}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-slate-400 block mb-1 font-bold">방문 일자</span>
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                          <Calendar size={14} className="text-slate-400" /> {selectedItem.reservationDate}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block mb-1 font-bold">방문 시간</span>
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                          <Clock size={14} className="text-slate-400" /> {selectedItem.reservationTime}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. 담당 직원 정보 (배정된 경우에만 표시) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Briefcase className="text-indigo-500" size={18} /> 배정된 현장 직원
                </h3>
                {selectedItem.worker ? (
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                      {selectedItem.worker.name.substring(0,1)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {selectedItem.worker.name} 
                        {selectedItem.worker.companyName && <span className="text-slate-500 font-medium ml-1">({selectedItem.worker.companyName})</span>}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">고객님 현장 방문을 담당할 직원입니다.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                    <p className="text-sm text-slate-500 font-medium">아직 담당 직원이 배정되지 않았습니다. (일정 조율 중)</p>
                  </div>
                )}
              </div>

              {/* 4. 에어컨 등 기기 상세 정보 */}
              {selectedItem.extraDetails && Array.isArray(selectedItem.extraDetails) && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Calculator size={18} className="text-indigo-500"/> 기기 및 현장 상세정보
                  </h3>
                  <div className="space-y-4">
                    {selectedItem.extraDetails.map((detail, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-400"></div>
                        <p className="text-xs font-black text-indigo-600 mb-3 border-b border-slate-200 pb-2">기기 정보</p>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-4">
                          {detail.brand && <div><span className="text-xs text-slate-400 block mb-1">제조사</span><span className="text-sm font-bold text-slate-700">{detail.brand}</span></div>}
                          {detail.year && <div><span className="text-xs text-slate-400 block mb-1">연식</span><span className="text-sm font-bold text-slate-700">{detail.year}</span></div>}
                          {detail.size && <div><span className="text-xs text-slate-400 block mb-1">크기</span><span className="text-sm font-bold text-slate-700">{detail.size}</span></div>}
                          {detail.location && <div><span className="text-xs text-slate-400 block mb-1">설치장소</span><span className="text-sm font-bold text-slate-700">{detail.location}</span></div>}
                        </div>
                        
                        {detail.environment && detail.environment.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-slate-200">
                            <span className="text-xs text-slate-400 block mb-2">시공 환경 (특이사항)</span>
                            <div className="flex flex-wrap gap-2">
                              {detail.environment.map((env, eIdx) => (
                                <span key={eIdx} className="bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md text-[11px] font-bold shadow-sm">{env}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 💡 기타사항 추가 영역 */}
                        {detail.notes && (
                          <div className="mt-4 pt-3 border-t border-slate-200">
                            <span className="text-xs text-slate-400 block mb-2">기타사항 (기기 타입 및 수량 등)</span>
                            <div className="bg-white border border-slate-200 p-3 rounded-lg text-sm font-semibold text-slate-700 whitespace-pre-wrap leading-relaxed">
                              {detail.notes}
                            </div>
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
            
            {/* 모달 푸터 */}
            <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end rounded-b-2xl">
              <button 
                onClick={() => setSelectedItem(null)} 
                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md"
              >
                닫기
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}