"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, MapPin, User, Smartphone, CreditCard, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatPhone } from "@/lib/function";
import Script from "next/script";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

declare global {
    interface Window {
        daum: any;
        kakao: any;
    }
}

const MobileRegisterPage = () => {
    const router = useRouter();
    const queryClient = useQueryClient();

    // SDK 로드 상태
    const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
    const [isDaumLoaded, setIsDaumLoaded] = useState<boolean>(false);

    // 모달 상태 및 Ref
    const [isAddrModalOpen, setIsAddrModalOpen] = useState<boolean>(false);
    const addrModalRef = useRef<HTMLDivElement>(null);

    // 폼 상태 관리
    const [formData, setFormData] = useState({
        name: "",
        rrn: "",
        phone: "",
        proxyPhone: "",
        roadAddress: "",
        detailAddress: "",
        latitude: 0,
        longitude: 0,
    });

    // --- React Query: 데이터 등록 Mutation ---
    const createHouseholdMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/households`,
                data
            );
            return response.data;
        },
        onSuccess: () => {
            alert("대상자가 성공적으로 등록되었습니다.");
            // 등록 성공 시 목록 쿼리 무효화로 최신화
            queryClient.invalidateQueries({ queryKey: ["households-list"] });
            router.push("/app/clean"); 
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || error.message || "등록 중 오류가 발생했습니다.");
        }
    });

    // 주소 선택 완료 시 로직 (Geocoding 포함)
    const onCompleteAddress = (data: any) => {
        const fullAddress = data.roadAddress;

        // 1. 선택된 주소 텍스트 업데이트
        setFormData((prev) => ({ ...prev, roadAddress: fullAddress }));

        // 2. 카카오 Geocoder를 사용하여 좌표 추출
        if (isMapLoaded && window.kakao && window.kakao.maps && window.kakao.maps.services) {
            const geocoder = new window.kakao.maps.services.Geocoder();

            geocoder.addressSearch(fullAddress, (result: any, status: any) => {
                if (status === window.kakao.maps.services.Status.OK) {
                    const lat = parseFloat(result[0].y); // 위도
                    const lng = parseFloat(result[0].x); // 경도

                    setFormData((prev) => ({
                        ...prev,
                        latitude: lat,
                        longitude: lng,
                    }));

                    console.log("좌표 변환 성공:", lat, lng);
                } else {
                    console.error("좌표 변환에 실패했습니다. (검색 결과 없음)");
                    alert("해당 주소의 좌표를 찾을 수 없습니다.");
                }
            });
        } else {
            console.error("지도 객체 상태:", { isMapLoaded, kakao: window.kakao });
            alert("지도 서비스가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.");
        }

        setIsAddrModalOpen(false); // 모달 닫기
    };

    // 모달 열릴 때 Daum Postcode 실행
    useEffect(() => {
        if (isAddrModalOpen && addrModalRef.current && isDaumLoaded) {
            new window.daum.Postcode({
                oncomplete: onCompleteAddress,
                width: "100%",
                height: "100%",
            }).embed(addrModalRef.current);
        }
    }, [isAddrModalOpen, isDaumLoaded]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'phone' || name === 'proxyPhone') {
            setFormData((prev) => ({ ...prev, [name]: formatPhone(value) }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 유효성 검사
        if (!formData.name || !formData.roadAddress) {
            alert("이름과 주소는 필수 항목입니다.");
            return;
        }

        // Mutation 실행
        createHouseholdMutation.mutate(formData);
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 pb-10">
            {/* 1. Daum 우편번호 SDK 로드 */}
            <Script
                src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
                strategy="afterInteractive"
                onLoad={() => setIsDaumLoaded(true)}
            />

            {/* 2. Kakao Maps SDK 로드 */}
            <Script
                src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=f560bf58d09c10884b45a0e3ce3e733d&libraries=services&autoload=false`}
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
                    console.error("카카오맵 SDK 스크립트 로드 실패. API 키나 도메인 설정을 확인하세요.", e);
                    alert("지도 설정을 불러오는 데 실패했습니다. 관리자에게 문의하세요.");
                }}
            />

            {/* 헤더 */}
            <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
                <div className="relative flex h-14 items-center justify-between px-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition"
                    >
                        <ChevronLeft className="h-6 w-6 text-gray-800" />
                    </button>
                    <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">
                        대상자 등록
                    </h1>
                </div>
            </header>

            <main className="mx-auto w-full max-w-md px-4 py-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 기본 정보 섹션 */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <User className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-bold text-gray-800">기본 정보</h2>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-600 ml-1">이름</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="성함을 입력하세요"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-600 ml-1">생년월일</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <CreditCard className="w-5 h-5" />
                                    </span>
                                    <input
                                        type="text"
                                        name="rrn"
                                        value={formData.rrn}
                                        onChange={handleChange}
                                        placeholder="000000"
                                        className="w-full rounded-xl border border-gray-300 pl-11 pr-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 연락처 섹션 */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Smartphone className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-bold text-gray-800">연락처 정보</h2>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-600 ml-1">휴대폰 번호</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="010-0000-0000"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-600 ml-1">대리인 연락처 (선택)</label>
                                <input
                                    type="tel"
                                    name="proxyPhone"
                                    value={formData.proxyPhone}
                                    onChange={handleChange}
                                    placeholder="비상 연락처를 입력하세요"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                                />
                            </div>
                        </div>
                    </section>

                    {/* 주소 섹션 */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-bold text-gray-800">주소 정보</h2>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-600 ml-1">도로명 주소</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        name="roadAddress"
                                        value={formData.roadAddress}
                                        readOnly
                                        onClick={() => setIsAddrModalOpen(true)}
                                        placeholder="주소를 검색하세요"
                                        className="flex-1 rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:outline-none cursor-pointer"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsAddrModalOpen(true)}
                                        className="rounded-xl bg-gray-800 px-4 py-3 text-sm font-bold text-white active:bg-gray-700 transition shadow-sm"
                                    >
                                        검색
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-600 ml-1">상세 주소</label>
                                <input
                                    type="text"
                                    name="detailAddress"
                                    value={formData.detailAddress}
                                    onChange={handleChange}
                                    placeholder="나머지 상세 주소를 입력하세요"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                                />
                            </div>

                            {/* 좌표 확인용 */}
                            {(formData.latitude !== 0) && (
                                <div className="text-[12px] font-medium text-blue-600 mt-2 px-1">
                                    ✓ 위도: {formData.latitude} / 경도: {formData.longitude}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 등록 버튼 */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={createHouseholdMutation.isPending}
                            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg shadow-blue-200 active:scale-[0.98] active:bg-blue-700 transition disabled:bg-gray-400 disabled:shadow-none"
                        >
                            {createHouseholdMutation.isPending && <Loader2 size={20} className="animate-spin" />}
                            {createHouseholdMutation.isPending ? "등록 중..." : "대상자 등록하기"}
                        </button>
                    </div>
                </form>
            </main>

            {/* --- 주소 검색 모달 --- */}
            {isAddrModalOpen && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <h2 className="text-lg font-bold">주소 검색</h2>
                        <button
                            onClick={() => setIsAddrModalOpen(false)}
                            className="p-1 rounded-full hover:bg-gray-100"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    {/* 우편번호 서비스가 들어갈 영역 */}
                    <div ref={addrModalRef} className="flex-1 w-full" />
                </div>
            )}
        </div>
    );
};

export default MobileRegisterPage;