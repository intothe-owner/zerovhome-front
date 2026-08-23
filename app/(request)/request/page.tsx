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

const BRAND_OPTIONS = ["삼성(Samsung)", "엘지(LG)", "캐리어(Carrier)", "위니아대우(Winia)", "잘 모르겠어요"];
const YEAR_OPTIONS = ["1년 미만", "1~3년", "3~5년", "5년 이상", "잘 모르겠어요"];
const SIZE_OPTIONS = ["5~10평", "10평형대", "20평형대", "30평형대", "40평형대", "50평형대", "기타"];
const LOCATION_OPTIONS = ["가정집", "식당", "사무실", "공공기관"];
const ENV_OPTIONS = [
  "에어컨이 설치가 되어 있지 않습니다", "화장실 사용이 어렵습니다", "바닥에 물이 닿으면 안됩니다", 
  "층고 높이가 높습니다", "주차가 어렵습니다", "엘레베이터가 없습니다", 
  "입주청소나 인테리어 작업과 동시에 진행됩니다", "에어컨 청소를 해본 경험이 있어요", "해당사항 없음"
];

const TIME_PERIOD_OPTIONS = [
  "오전 (8시~12시)",
  "오후 (13시~16시)",
  "언제든 (8시~16시)"
];

export default function ReservationPage() {
  const [cat1Id, setCat1Id] = useState<number | "">("");
  const [cat2Id, setCat2Id] = useState<number | "">("");
  const [unitCount, setUnitCount] = useState<number | "">("");
  
  const [form, setForm] = useState({
    customerName: "", customerPhone: "", address: "", detailAddress: "",
    reservationDate: "", reservationTime: "", privacyAgreed: false,
  });

  // 💡 기기별로 여러 개 생성되던 상태를 완전히 지우고, "단 1개의 객체"로 통합
  const [airconDetail, setAirconDetail] = useState({
    brand: "", year: "", size: "", location: "", notes: ""
  });
  const [environment, setEnvironment] = useState<string[]>([]);

  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories-active"],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/category`);
      const json = await res.json();
      return json.success ? json.data.filter((c: Category) => c.isActive) : [];
    },
  });

  const { data: memberSettings } = useQuery({
    queryKey: ["memberSettings"],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/member-settings`);
      const json = await res.json();
      return json.success ? json.data : null;
    }
  });

  const cat1List = categories.filter((c) => c.parentId === null);
  const cat2List = categories.filter((c) => c.parentId === Number(cat1Id));
  const hasCat2 = cat2List.length > 0;
  
  const selectedCat1Name = cat1List.find(c => c.id === cat1Id)?.name || "";
  const isAirconCategory = selectedCat1Name.includes("에어컨");

  const targetCategoryId = hasCat2 ? cat2Id : cat1Id;

  const { data: priceInfo, isLoading: isPriceLoading } = useQuery<PriceInfo | null>({
    queryKey: ["price", targetCategoryId],
    queryFn: async () => {
      if (!targetCategoryId) return null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/prices/category/${targetCategoryId}`);
      const json = await res.json();
      return json.success ? json.data : null;
    },
    enabled: !!targetCategoryId, 
  });

  const [totalPrice, setTotalPrice] = useState<number>(0);
  useEffect(() => {
    if (!priceInfo) { setTotalPrice(0); return; }
    if (priceInfo.unitType === 'FIXED') {
      setTotalPrice(priceInfo.unitPrice + priceInfo.basePrice);
    } else {
      const count = Number(unitCount) || 0;
      setTotalPrice((count * priceInfo.unitPrice) + priceInfo.basePrice);
    }
  }, [priceInfo, unitCount]);

  const toggleEnvironment = (val: string) => {
    setEnvironment(prev => {
      if (val === "해당사항 없음") return ["해당사항 없음"];
      let newEnv = prev.filter(e => e !== "해당사항 없음");
      if (newEnv.includes(val)) newEnv = newEnv.filter(e => e !== val);
      else newEnv.push(val);
      return newEnv;
    });
  };

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
    onError: (error: Error) => alert(error.message)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cat1Id) return alert("서비스 대분류를 선택해주세요.");
    if (hasCat2 && !cat2Id) return alert("상세 서비스를 선택해주세요.");
    if (!priceInfo) return alert("해당 서비스의 요금 정보가 없습니다. 관리자에게 문의해주세요.");
    if (priceInfo.unitType !== 'FIXED' && (!unitCount || Number(unitCount) <= 0)) {
      return alert("수량(평수/대수)을 정확히 입력해주세요.");
    }
    
    // 💡 하나의 폼에 대해서만 필수값 체크
    if (isAirconCategory && priceInfo.unitType !== 'FIXED') {
      if (!airconDetail.brand || !airconDetail.year || !airconDetail.size || !airconDetail.location) {
        return alert("제조사, 연식, 크기, 설치장소를 모두 선택해주세요.");
      }
    }

    if (!form.reservationDate) return alert("희망 예약 날짜를 선택해주세요.");
    if (!form.reservationTime) return alert("희망 예약 시간을 선택해주세요.");
    if (!form.privacyAgreed) return alert("개인정보 수집 및 이용에 동의해주세요.");

    // 💡 백엔드 호환성을 위해 단일 폼 데이터를 배열([{}]) 안에 감싸서 전송
    const finalExtraDetails = isAirconCategory ? [{
      ...airconDetail,
      environment
    }] : null;

    const payload = {
      category1Id: cat1Id,
      category2Id: cat2Id || null, 
      unitCount: priceInfo.unitType === 'FIXED' ? 1 : Number(unitCount),
      totalPrice: totalPrice, 
      customerName: form.customerName, customerPhone: form.customerPhone,
      address: form.address, detailAddress: form.detailAddress,
      reservationDate: form.reservationDate, reservationTime: form.reservationTime,
      privacyAgreed: form.privacyAgreed,
      extraDetails: finalExtraDetails 
    };

    submitMutation.mutate(payload);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const CustomRadio = ({ label, value, stateValue, onChange }: any) => {
    const isChecked = stateValue === value;
    return (
      <label className={`w-full flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all shrink-0 ${isChecked ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-slate-200 hover:border-indigo-300 bg-white'}`}>
        <input type="radio" className="hidden" value={value} checked={isChecked} onChange={onChange} />
        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isChecked ? 'border-indigo-600' : 'border-slate-300'}`}>
          {isChecked && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
        </div>
        <span className={`text-sm ${isChecked ? 'text-indigo-800 font-bold' : 'text-slate-600 font-medium'}`}>{label}</span>
      </label>
    );
  };

  const CustomCheckbox = ({ label, value, isChecked, onChange }: any) => {
    return (
      <label className={`w-full flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all shrink-0 ${isChecked ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-slate-200 hover:border-indigo-300 bg-white'}`}>
        <input type="checkbox" className="hidden" value={value} checked={isChecked} onChange={onChange} />
        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
          {isChecked && <CheckCircle2 size={14} className="text-white" />}
        </div>
        <span className={`text-sm ${isChecked ? 'text-indigo-800 font-bold' : 'text-slate-600 font-medium'}`}>{label}</span>
      </label>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 py-12 px-4 mt-10">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          
          <div className="bg-indigo-600 px-8 py-10 text-white text-center">
            <h1 className="text-3xl font-bold mb-3 flex items-center justify-center gap-2">
              <CheckCircle2 size={32} /> 예약 및 견적 신청
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-10">
            
            {/* 1. 서비스 카테고리 선택 */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">1. 서비스 선택</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">대분류 (1차)</label>
                  <select 
                    value={cat1Id} 
                    onChange={(e) => { setCat1Id(Number(e.target.value)); setCat2Id(""); setUnitCount(""); }}
                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" required
                  >
                    <option value="">서비스를 선택하세요</option>
                    {cat1List.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                
                {hasCat2 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">상세 서비스 (2차)</label>
                    <select 
                      value={cat2Id} onChange={(e) => setCat2Id(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" required
                    >
                      <option value="">상세 서비스를 선택하세요</option>
                      {cat2List.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </section>

            {/* 2. 수량 입력 및 실시간 견적 */}
            {targetCategoryId && priceInfo && (
              <section className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                 <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Calculator className="text-indigo-500" size={20} /> 견적 수량 및 금액
                </h2>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {priceInfo.unitType !== 'FIXED' && (
                    <div className="w-full md:w-1/2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        신청 수량 ({priceInfo.unitType === 'PYUNG' ? '평' : priceInfo.unitType === 'SQM' ? '㎡' : '대'})
                      </label>
                      <input 
                        type="number" min="1" value={unitCount} onChange={(e) => setUnitCount(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500" placeholder="숫자만 입력 (예: 3)" required
                      />
                    </div>
                  )}
                  <div className="w-full bg-white p-4 rounded-lg border border-indigo-100 shadow-sm flex justify-between items-center">
                    <div>
                      <p className="text-sm text-slate-500 font-medium">예상 총 금액 (VAT 별도)</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">(기본요금 {formatNumber(priceInfo.basePrice)}원 포함)</p>
                    </div>
                    <div className="text-2xl font-black text-indigo-600">
                      {formatNumber(totalPrice)} <span className="text-lg font-bold text-slate-700">원</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {targetCategoryId && !priceInfo && !isPriceLoading && (
              <div className="flex items-center gap-2 p-4 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
                <AlertCircle size={20} /> <p className="text-sm font-medium">요금표가 등록되지 않았습니다. 관리자에게 문의해주세요.</p>
              </div>
            )}

            {/* 💡 3. 기기 상세 정보 입력 (단일 폼, 모든 옵션 세로 나열) */}
            {isAirconCategory && Number(unitCount) > 0 && priceInfo?.unitType !== 'FIXED' && (
              <section className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
                  2. 에어컨 상세 정보 입력
                </h2>

                <div className="bg-white p-6 md:p-8 rounded-2xl border border-indigo-200 shadow-sm space-y-8">
                  
                  {/* 제조사 */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">제조사</label>
                    {/* 💡 flex-col을 사용하여 아래로 한 줄씩 나열되도록 복구 */}
                    <div className="flex flex-col gap-2">
                      {BRAND_OPTIONS.map(opt => (
                        <CustomRadio key={opt} label={opt} value={opt} stateValue={airconDetail.brand} onChange={() => setAirconDetail({...airconDetail, brand: opt})} />
                      ))}
                    </div>
                  </div>

                  {/* 연식 */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">연식</label>
                    <div className="flex flex-col gap-2">
                      {YEAR_OPTIONS.map(opt => (
                        <CustomRadio key={opt} label={opt} value={opt} stateValue={airconDetail.year} onChange={() => setAirconDetail({...airconDetail, year: opt})} />
                      ))}
                    </div>
                  </div>

                  {/* 크기 */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">에어컨 크기</label>
                    <div className="flex flex-col gap-2">
                      {SIZE_OPTIONS.map(opt => (
                        <CustomRadio key={opt} label={opt} value={opt} stateValue={airconDetail.size} onChange={() => setAirconDetail({...airconDetail, size: opt})} />
                      ))}
                    </div>
                  </div>

                  {/* 설치 장소 */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">설치 장소</label>
                    <div className="flex flex-col gap-2">
                      {LOCATION_OPTIONS.map(opt => (
                        <CustomRadio key={opt} label={opt} value={opt} stateValue={airconDetail.location} onChange={() => setAirconDetail({...airconDetail, location: opt})} />
                      ))}
                    </div>
                  </div>

                  {/* 시공 환경 */}
                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-sm font-bold text-slate-700 mb-3">
                      시공 환경 <span className="text-slate-400 font-medium ml-1">(중복 선택 가능)</span>
                    </label>
                    <div className="flex flex-col gap-2">
                      {ENV_OPTIONS.map(opt => (
                        <CustomCheckbox 
                          key={opt} 
                          label={opt} 
                          value={opt} 
                          isChecked={environment.includes(opt)} 
                          onChange={() => toggleEnvironment(opt)} 
                        />
                      ))}
                    </div>
                  </div>

                  {/* 💡 기타사항 텍스트 에어리어 (placeholder 적용) */}
                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-sm font-bold text-slate-700 mb-3">기타사항 (기기 상세 수량 등)</label>
                    <textarea 
                      value={airconDetail.notes}
                      onChange={(e) => setAirconDetail({...airconDetail, notes: e.target.value})}
                      placeholder="천장형 : 00대&#13;&#10;벽걸이형 : 00대&#13;&#10;스탠드형 : 00대"
                      className="w-full border border-slate-300 rounded-lg p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px] resize-y leading-relaxed"
                    />
                  </div>

                </div>
              </section>
            )}

            {/* 4. 예약자 정보 입력 */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">
                {isAirconCategory && Number(unitCount) > 0 && priceInfo?.unitType !== 'FIXED' ? '3' : '2'}. 예약자 정보
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="text-sm font-semibold text-slate-700 mb-2 block">이름 / 회사명</label><input type="text" name="customerName" value={form.customerName} onChange={handleChange} required className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500 bg-slate-50" /></div>
                <div><label className="text-sm font-semibold text-slate-700 mb-2 block">연락처</label><input type="tel" name="customerPhone" value={form.customerPhone} onChange={handleChange} required className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500 bg-slate-50" /></div>
                <div className="md:col-span-2"><label className="text-sm font-semibold text-slate-700 mb-2 block">방문 주소</label>
                  <input type="text" name="address" value={form.address} onChange={handleChange} required className="w-full border border-slate-300 rounded-lg p-3 mb-2 outline-none focus:border-indigo-500 bg-slate-50" placeholder="기본 주소" />
                  <input type="text" name="detailAddress" value={form.detailAddress} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500 bg-slate-50" placeholder="상세 주소" />
                </div>
                
                {/* 💡 예약 날짜 */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">희망 예약 날짜</label>
                  <input 
                    type="date" 
                    name="reservationDate" 
                    value={form.reservationDate} 
                    onChange={handleChange} 
                    required 
                    min={new Date().toISOString().split('T')[0]} 
                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500 bg-slate-50 cursor-pointer" 
                  />
                </div>
                
                {/* 💡 예약 시간 (라디오 버튼 적용) */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">희망 예약 시간</label>
                  <div className="flex flex-col gap-2">
                    {TIME_PERIOD_OPTIONS.map((timeOpt) => (
                      <CustomRadio 
                        key={timeOpt} 
                        label={timeOpt} 
                        value={timeOpt} 
                        stateValue={form.reservationTime} 
                        onChange={() => setForm({ ...form, reservationTime: timeOpt })} 
                      />
                    ))}
                  </div>
                </div>

              </div>
            </section>

            {/* 5. 약관 및 제출 */}
            <section className="bg-slate-50 p-5 rounded-lg border border-slate-200 mt-8">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.privacyAgreed} onChange={(e) => setForm({...form, privacyAgreed: e.target.checked})} className="mt-1 w-5 h-5 text-indigo-600 rounded cursor-pointer" />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800 text-sm">[필수] 개인정보 수집 및 이용 동의</span>
                    <button type="button" onClick={(e) => { e.preventDefault(); setIsPrivacyModalOpen(true); }} className="text-xs text-indigo-600 font-bold hover:underline">전문 보기</button>
                  </div>
                </div>
              </label>
            </section>

            <button type="submit" disabled={submitMutation.isPending || (targetCategoryId !== "" && !priceInfo)} className="w-full bg-indigo-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50">
              {submitMutation.isPending ? '예약 신청 중...' : '예약 및 견적 신청완료'}
            </button>
          </form>
        </div>
      </div>
      
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">개인정보처리방침</h2>
              <button onClick={() => setIsPrivacyModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto"><div className="prose prose-sm max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: memberSettings?.privacyContent || "등록된 개인정보처리방침이 없습니다." }} /></div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button onClick={() => setIsPrivacyModalOpen(false)} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">확인</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}