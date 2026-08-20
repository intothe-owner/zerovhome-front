"use client";

import { useState, useEffect,ChangeEvent } from "react";
import {
    MapPin,
    User,
    Home,
    Wind,
    ChevronLeft,
    Camera,
    CheckCircle2,
    Upload,
    FileText,
    Download,
    Loader2,
    AlertCircle
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type ReportCategory = "AIR_CONDITIONER" | "AIR_PURIFIER";

interface SeniorCenterDetail {
    id: number;
    seq: number;
    name: string;
    dong: string | null;
    facilityType: string | null;
    area: number | null;
    programYear: number;
    roadAddress: string;
    managerName: string | null;
    managerPhone: string | null;
    centerPhone: string | null;
    acCeilingCount: number;
    acStandCount: number;
    acWallCount: number;
    airPurifierCount: number;
    isComplete: boolean;
    acReportImages?: Record<string, string | null>;
    purifierReportImages?: Record<string, string | null>;
    workName?: string | null;
}

export default function SeniorCenterDetailUI() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const centerId = params.id;

    // UI 상태 관리
    const [activeReportTab, setActiveReportTab] = useState<ReportCategory>("AIR_CONDITIONER");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState("노인장애인복지과");
    const [downloadingCategory, setDownloadingCategory] = useState<ReportCategory | null>(null);
    const [message, setMessage] = useState("");

    // --- 1. React Query: 경로당 상세 정보 조회 (/api/senior/:id)[cite: 9] ---
    const { data: centerData, isLoading, isError } = useQuery<{ ok: boolean; data: SeniorCenterDetail }>({
        queryKey: ["seniorCenter", centerId],
        queryFn: async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/senior/${centerId}`);
            if (!res.ok) throw new Error("경로당 정보를 불러오지 못했습니다.");
            return res.json();
        },
        enabled: !!centerId,
    });

    const center = centerData?.data;

    // --- 2. React Query: 경로당 정보 수정 (작업 완료 토글 등) (/api/senior/:id)[cite: 9] ---
    const updateCenterMutation = useMutation({
        mutationFn: async (updatedFields: Partial<SeniorCenterDetail>) => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/senior/${centerId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedFields),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "수정에 실패했습니다.");
            return json;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["seniorCenter", centerId] });
        },
        onError: (err: Error) => {
            alert(err.message);
        },
    });

    // --- 3. React Query: 보고서 사진 업로드 Mutation (/api/senior-centers/:centerId/reports/:category/photos)[cite: 11] ---
    const photoUploadMutation = useMutation({
        mutationFn: async ({ category, fieldName, file }: { category: ReportCategory; fieldName: string; file: File }) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("fieldName", fieldName);

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/senior-centers/${centerId}/reports/${category}/photos`,
                {
                    method: "PUT",
                    body: formData,
                }
            );
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "사진 업로드에 실패했습니다.");
            return json;
        },
        onSuccess: () => {
            setMessage("사진이 성공적으로 업로드되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["seniorCenter", centerId] });
        },
        onError: (err: Error) => {
            setMessage(`업로드 실패: ${err.message}`);
        },
    });

    // 사진 파일 변경 핸들러
    const handleFileChange = (category: ReportCategory, fieldName: string) => (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setMessage("");
        photoUploadMutation.mutate({ category, fieldName, file });
    };

    // PDF 다운로드 핸들러 (/api/senior-centers/:id/reports/:category/pdf)[cite: 11]
    const handleDownloadPdf = async (category: ReportCategory) => {
        if (!center) return;
        setDownloadingCategory(category);

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/senior-centers/${center.id}/reports/${category}/pdf?org=${encodeURIComponent(selectedOrg)}`,
                { method: "GET" }
            );

            if (!res.ok) {
                const json = await res.json().catch(() => null);
                throw new Error(json?.message || "PDF 다운로드에 실패했습니다.");
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${selectedOrg}_${center.name}_${category}_작업보고서.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setIsModalOpen(false);
        } catch (err) {
            alert(err instanceof Error ? err.message : "PDF 다운로드 실패");
        } finally {
            setDownloadingCategory(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-indigo-600" size={36} />
            </div>
        );
    }

    if (isError || !center) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-20 text-center">
                <AlertCircle className="mx-auto text-red-500 mb-2" size={36} />
                <p className="text-lg font-bold text-slate-800">경로당 정보를 불러오지 못했습니다.</p>
                <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">
                    돌아가기
                </button>
            </div>
        );
    }

    // 현재 활성화된 탭에 따른 이미지 객체 가져오기
    const currentImages = activeReportTab === "AIR_CONDITIONER" 
        ? (center.acReportImages || {}) 
        : (center.purifierReportImages || {});

    return (
        <div className="max-w-6xl mx-auto space-y-6 relative pb-12 pt-6 px-4 sm:px-6">
            
            {/* 상단 액션 바 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <button 
                    onClick={() => router.back()} 
                    className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition"
                >
                    <ChevronLeft size={20} /> 리스트로 돌아가기
                </button>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => { setActiveReportTab("AIR_CONDITIONER"); setIsModalOpen(true); }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
                    >
                        <FileText size={18} className="text-blue-600" />
                        에어컨 보고서
                    </button>
                    <button
                        onClick={() => { setActiveReportTab("AIR_PURIFIER"); setIsModalOpen(true); }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
                    >
                        <FileText size={18} className="text-purple-600" />
                        공기청정기 보고서
                    </button>

                    <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block" />

                    {/* 작업 완료 토글 버튼 */}
                    <button
                        onClick={() => updateCenterMutation.mutate({ isComplete: !center.isComplete })}
                        disabled={updateCenterMutation.isPending}
                        className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                            center.isComplete 
                                ? "bg-green-100 text-green-700 border border-green-200" 
                                : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                    >
                        {updateCenterMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                        {center.isComplete ? <><CheckCircle2 size={18} /> 작업 완료됨</> : "작업 완료 처리"}
                    </button>
                </div>
            </div>

            {message && (
                <div className="rounded-xl px-4 py-3 text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {message}
                </div>
            )}

            {/* 기본 정보 및 담당자 정보 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <SectionTitle icon={<Home size={20} />} title="경로당 기본 정보" />
                    <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                        <DetailItem label="연번" value={center.seq} />
                        <DetailItem label="경로당 명" value={center.name} className="text-indigo-600 font-black" />
                        <DetailItem label="동명" value={center.dong || "-"} />
                        <DetailItem label="시설 유형" value={center.facilityType || "-"} />
                        <DetailItem label="면적(㎡)" value={center.area ? `${center.area} ㎡` : "-"} />
                        <DetailItem label="사업 연도" value={`${center.programYear}년`} />
                    </div>
                </section>

                <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <SectionTitle icon={<User size={20} />} title="담당자 및 연락처 정보" />
                    <div className="space-y-5">
                        <DetailItem label="도로명 주소" value={center.roadAddress} icon={<MapPin size={14} className="text-gray-400" />} />
                        <div className="h-px bg-gray-100" />
                        <div className="grid grid-cols-2 gap-5">
                            <DetailItem label="담당자" value={center.managerName || "-"} />
                            <DetailItem label="담당자 연락처" value={center.managerPhone || "-"} />
                            <DetailItem label="경로당 번호" value={center.centerPhone || "-"} />
                        </div>
                    </div>
                </section>
            </div>

            {/* 기기 설치 현황 */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <SectionTitle icon={<Wind size={20} />} title="기기 설치 현황" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <CountBox label="천장형 에어컨" count={center.acCeilingCount} />
                    <CountBox label="스탠드 에어컨" count={center.acStandCount} />
                    <CountBox label="벽걸이 에어컨" count={center.acWallCount} />
                    <CountBox label="공기청정기" count={center.airPurifierCount} color="purple" />
                </div>
            </section>

            {/* 사진 보고서 관리 */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <SectionTitle icon={<Camera size={20} />} title="상세 보고서 사진 관리" />

                    <div className="flex items-center gap-4">
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            {(["AIR_CONDITIONER", "AIR_PURIFIER"] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveReportTab(tab)}
                                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                        activeReportTab === tab 
                                            ? "bg-white text-indigo-600 shadow-sm" 
                                            : "text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                    {tab === "AIR_CONDITIONER" ? "에어컨" : "공기청정기"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-10">
                    <PhotoSectionGroup title="1. 경로당 입구">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <PhotoBox 
                                label="입구 전경" 
                                url={currentImages.entranceImage} 
                                isUploading={photoUploadMutation.isPending}
                                onChange={handleFileChange(activeReportTab, "entranceImage")} 
                            />
                        </div>
                    </PhotoSectionGroup>

                    <PhotoSectionGroup title="2. 작업 진행 사진">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <PhotoBox 
                                label="작업 사진 1" 
                                url={currentImages.workImage1} 
                                isUploading={photoUploadMutation.isPending}
                                onChange={handleFileChange(activeReportTab, "workImage1")} 
                            />
                            <PhotoBox 
                                label="작업 사진 2" 
                                url={currentImages.workImage2} 
                                isUploading={photoUploadMutation.isPending}
                                onChange={handleFileChange(activeReportTab, "workImage2")} 
                            />
                        </div>
                    </PhotoSectionGroup>

                    <PhotoSectionGroup title="3. 작업 전/후 비교 (Set 1)">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-gray-50/50 rounded-3xl border border-gray-100">
                            <PhotoBox 
                                label="작업 전 1" 
                                url={currentImages.beforeImage1} 
                                isUploading={photoUploadMutation.isPending}
                                onChange={handleFileChange(activeReportTab, "beforeImage1")} 
                            />
                            <PhotoBox 
                                label="작업 후 1" 
                                url={currentImages.afterImage1} 
                                isUploading={photoUploadMutation.isPending}
                                onChange={handleFileChange(activeReportTab, "afterImage1")} 
                            />
                        </div>
                    </PhotoSectionGroup>
                    <PhotoSectionGroup title="4. 작업 전/후 비교 (Set 2)">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-gray-50/50 rounded-3xl border border-gray-100">
                            <PhotoBox 
                                label="작업 전 2" 
                                url={currentImages.beforeImage2} 
                                isUploading={photoUploadMutation.isPending}
                                onChange={handleFileChange(activeReportTab, "beforeImage2")} 
                            />
                            <PhotoBox 
                                label="작업 후 1" 
                                url={currentImages.afterImage2} 
                                isUploading={photoUploadMutation.isPending}
                                onChange={handleFileChange(activeReportTab, "afterImage2")} 
                            />
                        </div>
                    </PhotoSectionGroup>
                </div>
            </section>

            {/* 기관 선택 모달창 (PDF 다운로드용) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">보고서 기관 선택</h3>
                            <p className="text-xs text-gray-500 mt-1">{center.name} - {activeReportTab === "AIR_CONDITIONER" ? "에어컨" : "공기청정기"} 보고서</p>
                        </div>

                        <div className="p-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">제출할 기관을 선택해주세요</label>
                            <select
                                value={selectedOrg}
                                onChange={(e) => setSelectedOrg(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                            >
                                <option value="노인장애인복지과">노인장애인복지과</option>
                                <option value="해운대구청">해운대구청</option>
                            </select>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDownloadPdf(activeReportTab)}
                                disabled={downloadingCategory === activeReportTab}
                                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-all disabled:bg-gray-400"
                            >
                                {downloadingCategory === activeReportTab ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                                다운로드
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- UI 헬퍼 컴포넌트 ---

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">{icon}</div>
            <h3 className="text-lg font-black text-gray-900">{title}</h3>
        </div>
    );
}

function PhotoSectionGroup({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-500 rounded-full"></span> {title}
            </h4>
            {children}
        </div>
    );
}

function DetailItem({ label, value, className = "", icon }: { label: string; value: string | number; className?: string; icon?: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{label}</p>
            <div className="flex items-center gap-2 px-1">
                {icon}
                <p className={`text-sm font-semibold text-gray-800 ${className}`}>{value}</p>
            </div>
        </div>
    );
}

function CountBox({ label, count, color = "indigo" }: { label: string; count: number; color?: "indigo" | "purple" }) {
    const colorClass = color === "indigo" 
        ? "bg-indigo-50 text-indigo-600 border-indigo-100" 
        : "bg-purple-50 text-purple-600 border-purple-100";
    return (
        <div className={`p-4 rounded-2xl border ${colorClass} text-center`}>
            <p className="text-[10px] font-bold opacity-70 mb-1">{label}</p>
            <p className="text-xl font-black">{count}<span className="text-xs ml-0.5 font-bold">대</span></p>
        </div>
    );
}

function PhotoBox({ label, url, isUploading, onChange }: { label: string; url?: string | null; isUploading?: boolean; onChange: (e: ChangeEvent<HTMLInputElement>) => void }) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
                <p className="text-xs font-bold text-gray-500">{label}</p>
            </div>
            
            <div className="relative aspect-video rounded-2xl border-2 border-dashed overflow-hidden group transition-all border-gray-200 bg-gray-50 hover:border-indigo-300">
                {isUploading ? (
                    <div className="flex flex-col items-center justify-center h-full text-indigo-600 gap-1 bg-white/80 z-10">
                        <Loader2 size={24} className="animate-spin" />
                        <span className="text-[10px] font-bold">업로드 중...</span>
                    </div>
                ) : url ? (
                    <img src={url} alt={label} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-1">
                        <Camera size={28} />
                        <span className="text-[10px] font-bold text-gray-400">사진 선택</span>
                    </div>
                )}
                
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-bold text-xs backdrop-blur-sm">
                    <input type="file" className="hidden" accept="image/*" onChange={onChange} />
                    <div className="flex flex-col items-center gap-2">
                        <Upload size={20} />
                        {url ? "사진 변경" : "사진 선택"}
                    </div>
                </label>
            </div>

            {url && (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                >
                    <Download size={16} /> 원본 보기
                </a>
            )}
        </div>
    );
}