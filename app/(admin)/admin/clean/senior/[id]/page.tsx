"use client";

import { useState } from "react";
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
    Download
} from "lucide-react";

type ReportCategory = "AIR_CONDITIONER" | "AIR_PURIFIER";

export default function SeniorCenterDetailUI() {
    // UI 조작을 위한 최소한의 상태
    const [activeReportTab, setActiveReportTab] = useState<ReportCategory>("AIR_CONDITIONER");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState("노인장애인복지과");
    const [isComplete, setIsComplete] = useState(false); // 작업 완료 토글 테스트용

    // UI 퍼블리싱 확인용 가짜(Mock) 데이터
    const mockCenter = {
        seq: "2026-001",
        name: "해운대 시니어 클럽 (테스트)",
        dong: "반송동",
        facilityType: "단독건물",
        area: 120,
        programYear: 2026,
        roadAddress: "부산광역시 해운대구 반송로 123",
        managerName: "김철수",
        managerPhone: "010-1234-5678",
        centerPhone: "051-700-1234",
        acCeilingCount: 2,
        acStandCount: 1,
        acWallCount: 3,
        airPurifierCount: 2,
    };

    // 더미 사진 URL (UI 테스트용)
    const mockImages = {
        entranceImage: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400",
        workImage1: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&q=80&w=400",
        workImage2: null, // 빈 상태 테스트용
        beforeImage1: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=400",
        afterImage1: null,
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 relative pb-12">
            
            {/* 상단 액션 바 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <button 
                    onClick={() => alert("리스트로 이동 (UI 테스트)")} 
                    className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition"
                >
                    <ChevronLeft size={20} /> 리스트로 돌아가기
                </button>

                <div className="flex flex-wrap items-center gap-3">
                    {/* 보고서 다운로드 버튼 */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
                    >
                        <FileText size={18} className="text-blue-600" />
                        에어컨 보고서
                    </button>
                    <button
                        onClick={() => alert("공기청정기 보고서 다운로드 (UI 테스트)")}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
                    >
                        <FileText size={18} className="text-purple-600" />
                        공기청정기 보고서
                    </button>

                    <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block" />

                    {/* 작업 완료 토글 버튼 */}
                    <button
                        onClick={() => setIsComplete(!isComplete)}
                        className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                            isComplete 
                                ? "bg-green-100 text-green-700 border border-green-200" 
                                : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                    >
                        {isComplete ? <><CheckCircle2 size={18} /> 작업 완료</> : "작업 완료 처리"}
                    </button>
                </div>
            </div>

            {/* 기본 정보 및 담당자 정보 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <SectionTitle icon={<Home size={20} />} title="경로당 기본 정보" />
                    <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                        <DetailItem label="연번" value={mockCenter.seq} />
                        <DetailItem label="경로당 명" value={mockCenter.name} className="text-indigo-600 font-black" />
                        <DetailItem label="동명" value={mockCenter.dong} />
                        <DetailItem label="시설 유형" value={mockCenter.facilityType} />
                        <DetailItem label="면적(㎡)" value={`${mockCenter.area} ㎡`} />
                        <DetailItem label="사업 연도" value={`${mockCenter.programYear}년`} />
                    </div>
                </section>

                <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <SectionTitle icon={<User size={20} />} title="담당자 및 연락처 정보" />
                    <div className="space-y-5">
                        <DetailItem label="도로명 주소" value={mockCenter.roadAddress} icon={<MapPin size={14} className="text-gray-400" />} />
                        <div className="h-px bg-gray-100" />
                        <div className="grid grid-cols-2 gap-5">
                            <DetailItem label="담당자" value={mockCenter.managerName} />
                            <DetailItem label="담당자 연락처" value={mockCenter.managerPhone} />
                            <DetailItem label="경로당 번호" value={mockCenter.centerPhone} />
                        </div>
                    </div>
                </section>
            </div>

            {/* 기기 설치 현황 */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <SectionTitle icon={<Wind size={20} />} title="기기 설치 현황" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <CountBox label="천장형 에어컨" count={mockCenter.acCeilingCount} />
                    <CountBox label="스탠드 에어컨" count={mockCenter.acStandCount} />
                    <CountBox label="벽걸이 에어컨" count={mockCenter.acWallCount} />
                    <CountBox label="공기청정기" count={mockCenter.airPurifierCount} color="purple" />
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
                        <button
                            onClick={() => alert("사진 저장 테스트")}
                            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                        >
                            <Upload size={16} /> 사진 저장하기
                        </button>
                    </div>
                </div>

                <div className="space-y-10">
                    <PhotoSectionGroup title="1. 경로당 입구">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <PhotoBox label="입구 전경" url={mockImages.entranceImage} />
                        </div>
                    </PhotoSectionGroup>

                    <PhotoSectionGroup title="2. 작업 진행 사진">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <PhotoBox label="작업 사진 1" url={mockImages.workImage1} />
                            <PhotoBox label="작업 사진 2" url={mockImages.workImage2} isNew={true} />
                        </div>
                    </PhotoSectionGroup>

                    <PhotoSectionGroup title="3. 작업 전/후 비교 (Set 1)">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-gray-50/50 rounded-3xl border border-gray-100">
                            <PhotoBox label="작업 전 1" url={mockImages.beforeImage1} />
                            <PhotoBox label="작업 후 1" url={mockImages.afterImage1} />
                        </div>
                    </PhotoSectionGroup>
                </div>
            </section>

            {/* 기관 선택 모달창 */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">보고서 기관 선택</h3>
                            <p className="text-xs text-gray-500 mt-1">{mockCenter.name} - 에어컨 보고서</p>
                        </div>

                        <div className="p-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">제출할 기관을 선택해주세요</label>
                            <select
                                value={selectedOrg}
                                onChange={(e) => setSelectedOrg(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                                onClick={() => {
                                    alert(`${selectedOrg} 용으로 다운로드 되었습니다.`);
                                    setIsModalOpen(false);
                                }}
                                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-all"
                            >
                                <FileText size={16} /> 다운로드
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

function PhotoBox({ label, url, isNew = false }: { label: string; url?: string | null; isNew?: boolean }) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
                <p className="text-xs font-bold text-gray-500">{label}</p>
                {isNew && <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">저장 대기</span>}
            </div>
            
            {/* 사진 영역 */}
            <div className={`relative aspect-video rounded-2xl border-2 border-dashed overflow-hidden group transition-all ${
                isNew ? 'border-amber-400 ring-2 ring-amber-100' : 'border-gray-200 bg-gray-50 hover:border-indigo-300'
            }`}>
                {url ? (
                    <img src={url} alt={label} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-1">
                        <Camera size={28} />
                        <span className="text-[10px] font-bold text-gray-400">사진 선택</span>
                    </div>
                )}
                
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-bold text-xs backdrop-blur-sm">
                    <input type="file" className="hidden" accept="image/*" onChange={() => alert("파일 선택 다이얼로그 (UI 테스트)")} />
                    <div className="flex flex-col items-center gap-2">
                        <Upload size={20} />
                        {url ? "사진 변경" : "사진 선택"}
                    </div>
                </label>
            </div>

            {/* 다운로드 버튼 */}
            {url && (
                <button
                    type="button"
                    onClick={() => alert(`${label} 사진 다운로드 (UI 테스트)`)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                >
                    <Download size={16} /> 사진 다운로드
                </button>
            )}
        </div>
    );
}