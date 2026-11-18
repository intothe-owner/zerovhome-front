"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import {
    ArrowLeft, ListChecks, MapPin, CheckCircle2, 
    ClipboardList, FileText, User, Calendar
} from "lucide-react";

export default function MyWorkSiteDetailPage() {
    const params = useParams();
    const siteId = params.id;
    const router = useRouter();

    const [siteInfo, setSiteInfo] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    
    // 상태 관리
    const [isFetching, setIsFetching] = useState(true);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

    const getAuthHeaders = () => {
        const rawToken = localStorage.getItem("token") || "";
        const cleanToken = rawToken.replace(/^['"]|['"]$/g, ''); 

        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${cleanToken}`
        };
    };

    // 데이터 불러오기
    const fetchData = async () => {
        try {
            setIsFetching(true);
            
            // 1. 기업 회원의 내 현장 목록을 불러와서 현재 현장 정보를 찾음
            // (백엔드의 my-sites API를 통해 권한이 있는 데이터만 조회)
            const siteRes = await axios.get(`${API_BASE_URL}/api/work-sites/my-sites`, {
                headers: getAuthHeaders()
            });
            const currentSite = siteRes.data.data?.find((s: any) => s.id === Number(siteId));

            if (!currentSite) {
                alert("권한이 없거나 존재하지 않는 현장입니다.");
                router.push("/dashboard");
                return;
            }
            setSiteInfo(currentSite);

            // 2. 해당 현장에 속한 작업 항목(고객/장소 목록) 조회
            const itemsRes = await axios.get(`${API_BASE_URL}/api/work-items?workSiteId=${siteId}`, {
                headers: getAuthHeaders()
            });
            if (itemsRes.data.ok) {
                setItems(itemsRes.data.data);
            }
        } catch (err) {
            console.error("현장 상세 데이터 조회 실패:", err);
            alert("정보를 불러오는데 실패했습니다.");
            router.push("/dashboard");
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        if (siteId) fetchData();
    }, [siteId]);

    // 진행률 계산
    const totalItems = items.length;
    const completedItems = items.filter(item => item.status === "COMPLETED").length;
    const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    if (isFetching && !siteInfo) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="p-8 text-center text-indigo-500 font-bold animate-pulse">
                    현장 데이터를 불러오는 중입니다...
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 pt-10">
            {/* 1. 상단 타이틀 & 뒤로가기 */}
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-6">
                <div className="flex items-start gap-4">
                    <Link href="/dashboard" className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition shadow-sm mt-1">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-800">{siteInfo?.title || siteInfo?.name}</h1>
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200">
                                진행중
                            </span>
                        </div>
                        <p className="text-base text-slate-500 mt-2 font-medium">
                            {siteInfo?.description || "별도의 현장 설명이 등록되지 않았습니다."}
                        </p>
                    </div>
                </div>

                {/* 기업 회원이 바로 보고서를 확인하거나 실사를 조회할 수 있는 바로가기 버튼 */}
                <div className="flex items-center gap-3">
                    <Link
                        href={`/dashboard/works/${siteId}/survey`}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 hover:border-indigo-400 hover:text-indigo-600 transition shadow-sm"
                    >
                        <ClipboardList size={18} className="text-indigo-500" />
                        사전 실사 내역
                    </Link>
                    <Link
                        href={`/dashboard/works/${siteId}/report-form`}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition shadow-sm"
                    >
                        <FileText size={18} />
                        최종 보고서 작성
                    </Link>
                </div>
            </div>

            {/* 2. 현장 요약 정보 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500">현장 개설일</p>
                        <p className="text-lg font-black text-slate-800">
                            {siteInfo?.createdAt ? new Date(siteInfo.createdAt).toLocaleDateString() : "-"}
                        </p>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 md:col-span-2">
                    <div className="flex-1">
                        <div className="flex justify-between items-end mb-2">
                            <p className="text-sm font-bold text-slate-500">전체 작업 진행률</p>
                            <p className="text-2xl font-black text-indigo-600">{progressPercent}%</p>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div 
                                className="bg-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out" 
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                        <p className="text-xs font-bold text-slate-400 mt-2 text-right">
                            총 {totalItems}건 중 {completedItems}건 완료
                        </p>
                    </div>
                </div>
            </div>

            {/* 3. 작업 대상 목록 영역 (엑셀 업로드 설정 영역을 제거하고 목록만 넓게 배치) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <ListChecks size={20} className="text-slate-500" />
                            세부 작업 대상 목록
                        </h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">
                            관리자가 엑셀로 업로드한 작업처 또는 세부 장소 목록입니다.
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[600px] custom-scrollbar-dark">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white shadow-sm z-10">
                            <tr className="border-b border-slate-200 text-sm font-semibold text-slate-500">
                                <th className="p-5 text-center w-20">순번</th>
                                <th className="p-5 w-1/3">고객명 / 장소명</th>
                                <th className="p-5">현장 주소 (매핑 정보)</th>
                                <th className="p-5 text-center w-32">좌표 연동</th>
                                <th className="p-5 text-center w-32">작업 상태</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center text-slate-400 font-medium">
                                        <ListChecks size={40} className="mx-auto mb-3 opacity-20" />
                                        등록된 세부 작업 대상이 없습니다.<br/>
                                        관리자가 엑셀을 업로드하면 목록이 표시됩니다.
                                    </td>
                                </tr>
                            ) : (
                                items.map((item: any) => {
                                    // 엑셀 rowData 안에 주소가 있다면 표시용으로 추출 (키워드 유추)
                                    let addressStr = "-";
                                    if (item.rowData) {
                                        for (const key of Object.keys(item.rowData)) {
                                            if (key.includes("주소") || key.includes("도로명") || key.includes("소재지")) {
                                                addressStr = item.rowData[key];
                                                break;
                                            }
                                        }
                                    }

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50 transition cursor-pointer group">
                                            <td className="p-5 text-center font-bold text-slate-400">
                                                {item.routeOrder}
                                            </td>
                                            <td className="p-5 font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                                {item.customerName}
                                            </td>
                                            <td className="p-5 text-sm font-medium text-slate-600 truncate max-w-xs">
                                                {addressStr}
                                            </td>
                                            <td className="p-5 text-center">
                                                {item.latitude && item.longitude ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                                        <CheckCircle2 size={14} /> 확인됨
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                                        <MapPin size={14} /> 미확인
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-5 text-center">
                                                <span className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold rounded-lg border ${
                                                    item.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                    item.status === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                                                    'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>
                                                    {item.status === 'COMPLETED' ? '작업완료' :
                                                     item.status === 'IN_PROGRESS' ? '진행중' : '대기중'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}