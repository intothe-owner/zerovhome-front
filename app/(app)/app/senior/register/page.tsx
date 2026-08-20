"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, MapPin, Building, User, Phone, Wind, FileText, Check, Loader2, X } from "lucide-react";
import axios from "axios"; // ✅ axios 임포트
import { useQueryClient } from "@tanstack/react-query"; // ✅ React Query 임포트
import Script from "next/script";

declare global {
    interface Window {
        daum: any;
        kakao: any;
    }
}

const MobileSeniorRegisterPage = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    // 모달 상태 및 Ref
    const [isAddrModalOpen, setIsAddrModalOpen] = useState<boolean>(false);
    const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
    const addrModalRef = useRef<HTMLDivElement>(null);

    // 폼 상태 관리
    const [formData, setFormData] = useState({
        name: "",
        dong: "",
        roadAddress: "",
        detailAddress: "",
        lat: "",
        lng: "",
        area: "",
        acCeiling: 0,
        acStand: 0,
        acWall: 0,
        airPurifier: 0,
        managerName: "",
        managerPhone: "",
        remark: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // 다음 우편번호 스크립트 로드
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
        script.async = true;
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    // 폼 입력 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // 숫자 증감 핸들러
    const handleCountChange = (name: string, delta: number) => {
        setFormData((prev) => {
            const newValue = Math.max(0, Number(prev[name as keyof typeof prev] || 0) + delta);
            return { ...prev, [name]: newValue };
        });
    };

    // 다음 주소 검색창 열기
    const handleOpenPostcode = () => {
        if (!window.daum || !window.daum.Postcode) {
            alert("우편번호 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }
        setIsAddrModalOpen(true);
    };

    // 모달이 열리면 다음 우편번호 컴포넌트를 embed로 삽입
    useEffect(() => {
        if (isAddrModalOpen && addrModalRef.current) {
            new window.daum.Postcode({
                oncomplete: (data: any) => {
                    let addr = data.roadAddress; // 도로명 주소
                    let extraAddr = ""; // 참고 항목

                    if (data.bname !== "" && /[동|로|가]$/g.test(data.bname)) {
                        extraAddr += data.bname;
                    }
                    if (data.buildingName !== "" && data.apartment === "Y") {
                        extraAddr += extraAddr !== "" ? ", " + data.buildingName : data.buildingName;
                    }
                    if (extraAddr !== "") {
                        addr += ` (${extraAddr})`;
                    }

                    // 주소 및 행정동 업데이트
                    setFormData((prev) => ({
                        ...prev,
                        roadAddress: addr,
                        dong: data.bname || "", 
                    }));

                    // 주소를 좌표로 변환 (카카오맵 API 필요)
                    if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
                        const geocoder = new window.kakao.maps.services.Geocoder();
                        
                        geocoder.addressSearch(addr, (result: any, status: any) => {

                            if (status === window.kakao.maps.services.Status.OK) {
                                setFormData((prev) => ({
                                    ...prev,
                                    lng: result[0].x, // 경도
                                    lat: result[0].y, // 위도
                                }));
                            }
                        });
                    } else {
                        console.warn("Kakao Maps API가 로드되지 않아 좌표를 변환할 수 없습니다.");
                    }

                    // 검색 완료 후 모달 닫기
                    setIsAddrModalOpen(false);
                },
                width: "100%",
                height: "100%",
            }).embed(addrModalRef.current);
        }
    }, [isAddrModalOpen]);

    const handleSubmit = async () => {
        if (!formData.name || !formData.roadAddress) {
            alert("경로당명과 주소는 필수 입력 항목입니다.");
            return;
        }

        setIsSubmitting(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
            
            // ✅ 백엔드로 POST 요청 전송 (엔드포인트 경로를 실제 라우터 설정에 맞게 확인해주세요)
            const response = await axios.post(`${baseUrl}/senior`, formData);

            if (response.data.ok) {
                alert("등록되었습니다.");
                
                // ✅ 목록 페이지 캐시 무효화 (뒤로 가기 시 최신 데이터 반영)
                queryClient.invalidateQueries({ queryKey: ["senior-centers"] });
                
                router.push('/mobile/senior')
            } else {
                alert(response.data.message || "등록에 실패했습니다.");
            }
        } catch (error) {
            console.error("등록 API 에러:", error);
            alert("서버 오류로 인해 등록에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 pb-24">
             {/* 2. Kakao Maps SDK 로드 (Next.js Script 컴포넌트 활용) */}
            <Script
    src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services&autoload=false`}
    strategy="afterInteractive"
    onLoad={() => {
        if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(() => {
                console.log("카카오맵 SDK 로드 완료");
                setIsMapLoaded(true);
            });
        }
    }}
    onError={(e) => {
        console.log(e);
        console.error("카카오맵 SDK 스크립트 로드 실패. API 키나 도메인 설정을 확인하세요.", e);
        alert("지도 설정을 불러오는 데 실패했습니다. 관리자에게 문의하세요.");
    }}
/>
            {/* 상단 헤더 */}
            <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
                <div className="relative flex h-14 items-center justify-between px-4">
                    <button onClick={() => router.back()} className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition">
                        <ChevronLeft className="h-6 w-6 text-gray-700" />
                    </button>
                    <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold">경로당 신규 등록</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-md px-4 py-6 space-y-6">
                
                {/* 1. 기본 정보 */}
                <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Building size={18} className="text-blue-600" />
                        <h2 className="text-sm font-bold text-gray-900">기본 정보</h2>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">경로당명 <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="예: 해운대 경로당"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">행정동</label>
                            <input
                                type="text"
                                name="dong"
                                value={formData.dong}
                                onChange={handleChange}
                                placeholder="예: 반송1동"
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">면적 (㎡)</label>
                            <input
                                type="number"
                                name="area"
                                value={formData.area}
                                onChange={handleChange}
                                placeholder="면적 입력"
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </section>

                {/* 2. 주소 및 좌표 */}
                <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <MapPin size={18} className="text-blue-600" />
                            <h2 className="text-sm font-bold text-gray-900">주소 및 좌표 <span className="text-red-500">*</span></h2>
                        </div>
                        <button 
                            type="button" 
                            onClick={handleOpenPostcode}
                            className="text-[11px] font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg active:scale-95 transition"
                        >
                            주소 검색
                        </button>
                    </div>

                    <div className="space-y-3">
                        <input
                            type="text"
                            readOnly
                            value={formData.roadAddress}
                            placeholder="주소 검색을 이용해주세요"
                            onClick={handleOpenPostcode}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none cursor-pointer"
                        />
                        <input
                            type="text"
                            name="detailAddress"
                            value={formData.detailAddress}
                            onChange={handleChange}
                            placeholder="상세 주소 입력"
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all"
                        />
                        
                        {/* 좌표 디버깅 */}
                        {formData.lat && formData.lng && (
                            <div className="text-[10px] text-gray-400 bg-gray-50 p-2 rounded-lg break-all">
                                📍 위도: {formData.lat} / 경도: {formData.lng}
                            </div>
                        )}
                    </div>
                </section>

                {/* 3. 기기 수량 */}
                <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-5">
                    <div className="flex items-center gap-2 mb-2">
                        <Wind size={18} className="text-blue-600" />
                        <h2 className="text-sm font-bold text-gray-900">기기 수량</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { id: "acCeiling", label: "천장형 에어컨" },
                            { id: "acStand", label: "스탠드 에어컨" },
                            { id: "acWall", label: "벽걸이 에어컨" },
                            { id: "airPurifier", label: "공기청정기" },
                        ].map((item) => (
                            <div key={item.id} className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-3">
                                <span className="text-[11px] font-bold text-gray-600">{item.label}</span>
                                <div className="flex items-center gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => handleCountChange(item.id, -1)}
                                        className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-lg text-gray-500 active:bg-gray-100 transition"
                                    >-</button>
                                    <span className="w-6 text-center font-black text-lg text-gray-900">{formData[item.id as keyof typeof formData]}</span>
                                    <button 
                                        type="button" 
                                        onClick={() => handleCountChange(item.id, 1)}
                                        className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-lg text-gray-500 active:bg-gray-100 transition"
                                    >+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 4. 담당자 정보 */}
                <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <User size={18} className="text-blue-600" />
                        <h2 className="text-sm font-bold text-gray-900">담당자 정보</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">이름</label>
                            <input
                                type="text"
                                name="managerName"
                                value={formData.managerName}
                                onChange={handleChange}
                                placeholder="담당자 이름"
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">연락처</label>
                            <div className="relative">
                                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="tel"
                                    name="managerPhone"
                                    value={formData.managerPhone}
                                    onChange={handleChange}
                                    placeholder="010-0000-0000"
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 py-3 text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. 특이사항 */}
                <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText size={18} className="text-blue-600" />
                        <h2 className="text-sm font-bold text-gray-900">특이사항 (비고)</h2>
                    </div>
                    <textarea
                        name="remark"
                        value={formData.remark}
                        onChange={handleChange}
                        placeholder="기타 참고할 사항을 입력해주세요."
                        rows={3}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all resize-none"
                    />
                </section>

            </main>

            {/* 하단 고정 저장 버튼 */}
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/95 pb-safe backdrop-blur-md">
                <div className="mx-auto max-w-md px-4 py-3">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:bg-gray-300"
                    >
                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                        등록 완료하기
                    </button>
                </div>
            </div>

            {/* --- 주소 검색 모달 --- */}
            {isAddrModalOpen && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                        <h2 className="text-lg font-bold">주소 검색</h2>
                        <button
                            onClick={() => setIsAddrModalOpen(false)}
                            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    {/* 우편번호 서비스가 embed될 영역 */}
                    <div ref={addrModalRef} className="flex-1 w-full bg-gray-50" />
                </div>
            )}
        </div>
    );
};

export default MobileSeniorRegisterPage;