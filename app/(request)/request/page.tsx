"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, Phone, User, CheckCircle2, AlertCircle, Calculator, X } from "lucide-react";
import { formatNumber } from "@/lib/function";

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  isActive: boolean;
}

interface PriceInfo {
  unitType: 'PYUNG' | 'SQM' | 'DEVICE' | 'FIXED';
  unitPrice: number;
  basePrice: number;
}

export default function ReservationPage() {
  const [cat1Id, setCat1Id] = useState<number | "">("");
  const [cat2Id, setCat2Id] = useState<number | "">("");
  const [unitCount, setUnitCount] = useState<number | "">("");
  
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    address: "",
    detailAddress: "",
    reservationDate: "",
    reservationTime: "",
    privacyAgreed: false,
  });

  // 💡 개인정보처리방침 모달 상태 관리
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // ==========================================
  // 1. [React Query] 데이터 조회 (카테고리 & 약관 설정)
  // ==========================================
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories-active"],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/category`);
      const json = await res.json();
      return json.success ? json.data.filter((c: Category) => c.isActive) : [];
    },
  });

  const cat1List = categories.filter((c) => c.parentId === null);
  const cat2List = categories.filter((c) => c.parentId === Number(cat1Id));

  // 💡 백엔드에서 회원/약관 설정(MemberSettings) 데이터 가져오기
  const { data: memberSettings } = useQuery({
    queryKey: ["memberSettings"],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/member-settings`);
      const json = await res.json();
      return json.success ? json.data : null;
    }
  });

  // ==========================================
  // 2. [React Query] 선택한 2차 카테고리의 단가 조회
  // ==========================================
  const { data: priceInfo, isLoading: isPriceLoading } = useQuery<PriceInfo | null>({
    queryKey: ["price", cat2Id],
    queryFn: async () => {
      if (!cat2Id) return null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/prices/category/${cat2Id}`);
      const json = await res.json();
      return json.success ? json.data : null;
    },
    enabled: !!cat2Id, 
  });

  // ==========================================
  // 3. 실시간 견적가 계산 로직
  // ==========================================
  const [totalPrice, setTotalPrice] = useState<number>(0);

  useEffect(() => {
    if (!priceInfo) {
      setTotalPrice(0);
      return;
    }
    if (priceInfo.unitType === 'FIXED') {
      setTotalPrice(priceInfo.unitPrice + priceInfo.basePrice);
    } else {
      const count = Number(unitCount) || 0;
      setTotalPrice((count * priceInfo.unitPrice) + priceInfo.basePrice);
    }
  }, [priceInfo, unitCount]);

  // ==========================================
  // 4. [React Query] 예약 신청 (POST)
  // ==========================================
  const submitMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => {
      alert("예약 신청이 완료되었습니다! 관리자 확인 후 연락드리겠습니다.");
      window.location.reload(); 
    },
    onError: (error: Error) => {
      alert(error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cat1Id || !cat2Id) return alert("서비스 카테고리를 선택해주세요.");
    if (!priceInfo) return alert("해당 서비스의 요금 정보가 없습니다. 관리자에게 문의해주세요.");
    if (priceInfo.unitType !== 'FIXED' && (!unitCount || Number(unitCount) <= 0)) {
      return alert("수량(평수/대수)을 정확히 입력해주세요.");
    }
    if (!form.privacyAgreed) return alert("개인정보 수집 및 이용에 동의해주세요.");

    const payload = {
      category1Id: cat1Id,
      category2Id: cat2Id,
      unitCount: priceInfo.unitType === 'FIXED' ? 1 : Number(unitCount),
      totalPrice: totalPrice, 
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      address: form.address,
      detailAddress: form.detailAddress,
      reservationDate: form.reservationDate,
      reservationTime: form.reservationTime,
      privacyAgreed: form.privacyAgreed
    };

    submitMutation.mutate(payload);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 py-12 px-4 mt-10">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          
          <div className="bg-indigo-600 px-8 py-10 text-white text-center">
            <h1 className="text-3xl font-bold mb-3 flex items-center justify-center gap-2">
              <CheckCircle2 size={32} />
              서비스 예약 및 견적 신청
            </h1>
            <p className="text-indigo-100">원하시는 서비스를 선택하고 정보를 입력해주시면 빠르게 배정해 드립니다.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            
            {/* 1. 서비스 카테고리 선택 */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">1. 서비스 선택</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">대분류 (1차)</label>
                  <select 
                    value={cat1Id} 
                    onChange={(e) => {
                      setCat1Id(Number(e.target.value));
                      setCat2Id(""); 
                      setUnitCount("");
                    }}
                    className="w-full border border-slate-300 rounded-lg p-3 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  >
                    <option value="">서비스를 선택하세요</option>
                    {cat1List.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">상세 서비스 (2차)</label>
                  <select 
                    value={cat2Id} 
                    onChange={(e) => setCat2Id(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-3 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100"
                    disabled={!cat1Id}
                    required
                  >
                    <option value="">상세 서비스를 선택하세요</option>
                    {cat2List.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* 2. 수치 입력 및 견적 확인 */}
            {cat2Id && priceInfo && (
              <section className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Calculator className="text-indigo-500" size={20} /> 실시간 견적 확인
                </h2>
                
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {priceInfo.unitType !== 'FIXED' && (
                    <div className="w-full md:w-1/2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        수량 입력 
                        <span className="text-slate-400 font-normal ml-2">
                          ({priceInfo.unitType === 'PYUNG' ? '평' : priceInfo.unitType === 'SQM' ? '㎡' : '대'})
                        </span>
                      </label>
                      <input 
                        type="number" 
                        min="1"
                        value={unitCount}
                        onChange={(e) => setUnitCount(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="숫자만 입력하세요"
                        required
                      />
                    </div>
                  )}
                  
                  <div className="w-full bg-white p-4 rounded-lg border border-indigo-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 font-medium">예상 총 금액 (VAT 별도)</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        (기본요금 {formatNumber(priceInfo.basePrice)}원 포함)
                      </p>
                    </div>
                    <div className="text-2xl font-black text-indigo-600">
                      {formatNumber(totalPrice)} <span className="text-lg font-bold text-slate-700">원</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {cat2Id && !priceInfo && !isPriceLoading && (
              <div className="flex items-center gap-2 p-4 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
                <AlertCircle size={20} />
                <p className="text-sm font-medium">선택하신 서비스의 요금표가 등록되지 않았습니다. 관리자에게 문의해주세요.</p>
              </div>
            )}

            {/* 3. 예약자 정보 입력 */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">2. 예약자 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <User size={16} className="text-slate-400" /> 이름 / 회사명
                  </label>
                  <input type="text" name="customerName" value={form.customerName} onChange={handleChange} required className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500" placeholder="홍길동" />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <Phone size={16} className="text-slate-400" /> 연락처
                  </label>
                  <input type="tel" name="customerPhone" value={form.customerPhone} onChange={handleChange} required className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500" placeholder="010-0000-0000" />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <MapPin size={16} className="text-slate-400" /> 방문 주소
                  </label>
                  <input type="text" name="address" value={form.address} onChange={handleChange} required className="w-full border border-slate-300 rounded-lg p-3 mb-2 outline-none focus:border-indigo-500" placeholder="기본 주소 입력" />
                  <input type="text" name="detailAddress" value={form.detailAddress} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500" placeholder="상세 주소 (동, 호수 등)" />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <Calendar size={16} className="text-slate-400" /> 희망 예약 날짜
                  </label>
                  <input type="date" name="reservationDate" value={form.reservationDate} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <Clock size={16} className="text-slate-400" /> 희망 예약 시간
                  </label>
                  <input type="time" name="reservationTime" value={form.reservationTime} onChange={handleChange} required className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500" />
                </div>
              </div>
            </section>

            {/* 4. 약관 동의 */}
            <section className="bg-slate-50 p-5 rounded-lg border border-slate-200 mt-8">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.privacyAgreed}
                  onChange={(e) => setForm({...form, privacyAgreed: e.target.checked})}
                  className="mt-1 w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 text-sm block">[필수] 개인정보 수집 및 이용 동의</span>
                    {/* 💡 약관 전문 보기 버튼 */}
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.preventDefault();
                        setIsPrivacyModalOpen(true);
                      }}
                      className="text-xs text-indigo-600 font-bold hover:underline"
                    >
                      전문 보기
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    본 서비스 예약 및 상담 진행을 위해 이름, 연락처, 주소 등의 개인정보를 수집하며, 목적 달성 후 해당 법령에 따라 안전하게 파기됩니다.
                  </p>
                </div>
              </label>
            </section>

            <button 
              type="submit" 
              disabled={submitMutation.isPending || (cat2Id !== "" && !priceInfo)}
              className="w-full bg-indigo-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitMutation.isPending ? '예약 신청 중...' : '예약 및 견적 신청완료'}
            </button>
          </form>
        </div>
      </div>

      {/* 💡 개인정보처리방침 모달 UI */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">
                개인정보처리방침
              </h2>
              <button 
                onClick={() => setIsPrivacyModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div 
                className="prose prose-sm max-w-none text-slate-600"
                dangerouslySetInnerHTML={{ __html: memberSettings?.privacyContent || "등록된 개인정보처리방침이 없습니다." }}
              />
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setIsPrivacyModalOpen(false)}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}