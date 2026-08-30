"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import {
    ArrowLeft, UploadCloud, Save, TableProperties,
    ListChecks, MapPin, CheckCircle2, ClipboardList, FileText
} from "lucide-react";

export default function WorkSiteDetailPage() {
    const params = useParams();
    const siteId = params.id;
    const router = useRouter();

    const [siteInfo, setSiteInfo] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [file, setFile] = useState<File | null>(null);

    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);

    // 💡 동적 노출 필드 상태 (웹 목록, 웹 상세, 모바일 목록)
    const [listFields, setListFields] = useState<string[]>([]);
    const [detailFields, setDetailFields] = useState<string[]>([]);
    const [mobileFields, setMobileFields] = useState<string[]>([]);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

    // 데이터 불러오기
    const fetchData = async () => {
        try {
            setIsFetching(true);
            // 1. 현장 정보 조회
            const siteRes = await axios.get(`${API_BASE_URL}/api/work-sites`);
            const currentSite = siteRes.data.data.find((s: any) => s.id === Number(siteId));

            if (currentSite) {
                setSiteInfo(currentSite);
                setListFields(currentSite.listVisibleFields || []);
                setDetailFields(currentSite.detailVisibleFields || []);
                setMobileFields(currentSite.mobileListVisibleFields || []); // 💡 모바일 필드 복원
            }

            // 2. 파싱된 작업 항목 리스트 조회
            const itemsRes = await axios.get(`${API_BASE_URL}/api/work-items?workSiteId=${siteId}`);
            if (itemsRes.data.ok) {
                setItems(itemsRes.data.data);
            }
        } catch (err) {
            console.error("데이터 조회 실패:", err);
            alert("정보를 불러오는데 실패했습니다.");
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        if (siteId) fetchData();
    }, [siteId]);

    // 엑셀 파일 업로드 처리
    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return alert("엑셀 파일을 선택해주세요.");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("overwrite", "true"); // 덮어쓰기 옵션

        try {
            setLoading(true);
            const res = await axios.post(`${API_BASE_URL}/api/work-sites/${siteId}/upload`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            alert(`성공적으로 ${res.data.saved}건의 작업이 업로드되었습니다.`);
            setFile(null);
            fetchData(); // 업로드 후 데이터(헤더 및 리스트) 새로고침
        } catch (err) {
            console.error("엑셀 업로드 에러:", err);
            alert("엑셀 업로드 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 💡 노출 필드 토글 핸들러 (모바일용 추가)
    const toggleField = (type: "list" | "detail" | "mobile", field: string) => {
        if (type === "list") {
            setListFields(prev => prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]);
        } else if (type === "detail") {
            setDetailFields(prev => prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]);
        } else if (type === "mobile") {
            setMobileFields(prev => prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]);
        }
    };

    // 💡 설정 저장 처리 (모바일 항목 같이 전송)
    const handleSaveFields = async () => {
        try {
            setSaveLoading(true);
            await axios.put(`${API_BASE_URL}/api/work-sites/${siteId}`, {
                listVisibleFields: listFields,
                detailVisibleFields: detailFields,
                mobileListVisibleFields: mobileFields
            });
            alert("노출 항목 설정이 저장되었습니다.");
            fetchData();
        } catch (err) {
            console.error("설정 저장 실패:", err);
            alert("설정 저장에 실패했습니다.");
        } finally {
            setSaveLoading(false);
        }
    };

    if (isFetching && !siteInfo) {
        return <div className="p-8 text-center text-slate-500 font-bold">데이터를 불러오는 중입니다...</div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/works" className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{siteInfo?.title}</h2>
                        <p className="text-sm text-slate-500 mt-1">{siteInfo?.description || "설명 없음"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href={`/admin/works/${siteId}/survey`}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 hover:border-indigo-400 hover:text-indigo-600 transition shadow-sm"
                    >
                        <ClipboardList size={18} className="text-indigo-500" />
                        설문조사 설정
                    </Link>
                    <Link
                        href={`/admin/works/${siteId}/report-form`}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 hover:border-emerald-400 hover:text-emerald-600 transition shadow-sm"
                    >
                        <FileText size={18} className="text-emerald-500" />
                        보고서 양식 설정
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 좌측: 엑셀 업로드 및 설정 영역 */}
                <div className="lg:col-span-1 space-y-6">

                    {/* 엑셀 업로드 카드 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <UploadCloud size={20} className="text-indigo-600" />
                            엑셀 데이터 업로드
                        </h3>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                        setFile(e.dataTransfer.files[0]);
                                    }
                                }}
                                className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-500 hover:bg-indigo-50/30 transition cursor-pointer relative"
                            >
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                                    <UploadCloud size={32} className="text-indigo-500" />
                                    <p className="text-sm font-semibold text-slate-700">
                                        {file ? <span className="text-indigo-600 font-bold">{file.name}</span> : "엑셀 파일을 이곳에 끌어다 놓으세요"}
                                    </p>
                                    <p className="text-xs text-slate-400">또는 클릭하여 파일 직접 선택 (.xlsx, .xls)</p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !file}
                                className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? "파싱 및 저장 중..." : "업로드 실행"}
                            </button>
                        </form>
                    </div>

                    {/* 동적 컬럼 노출 설정 카드 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <TableProperties size={20} className="text-emerald-600" />
                                앱/웹 노출 항목 설정
                            </h3>
                            <button
                                onClick={handleSaveFields}
                                disabled={saveLoading}
                                className="flex items-center gap-1 text-sm bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 transition disabled:opacity-50"
                            >
                                <Save size={16} /> 저장
                            </button>
                        </div>

                        {!siteInfo?.excelHeaders || siteInfo.excelHeaders.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg border border-slate-100">
                                엑셀을 먼저 업로드하면 항목을 설정할 수 있습니다.
                            </p>
                        ) : (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar-dark">
                                <p className="text-xs text-slate-500 mb-2 font-medium leading-relaxed bg-slate-50 p-3 rounded-lg">
                                    <b className="text-blue-600">웹(PC) 목록/상세</b> 및 <b className="text-orange-500">모바일 앱 목록</b>에 보여줄 엑셀 컬럼을 각각 선택하세요. <br/>
                                    (※ 모바일 앱은 경로당명, 주소, 동명이 기본 노출되므로 그 외 추가 정보만 체크하세요)
                                </p>
                                {siteInfo.excelHeaders.map((header: string) => (
                                    <div key={header} className="flex flex-col gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition">
                                        <span className="font-bold text-slate-700 text-sm truncate">{header}</span>
                                        <div className="flex items-center gap-4 justify-start pl-1">
                                            {/* 웹 목록 */}
                                            <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-slate-600 hover:text-indigo-600">
                                                <input
                                                    type="checkbox"
                                                    checked={listFields.includes(header)}
                                                    onChange={() => toggleField("list", header)}
                                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                                />
                                                웹 목록
                                            </label>
                                            {/* 웹 상세 */}
                                            <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-slate-600 hover:text-emerald-600">
                                                <input
                                                    type="checkbox"
                                                    checked={detailFields.includes(header)}
                                                    onChange={() => toggleField("detail", header)}
                                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                                />
                                                웹 상세
                                            </label>
                                            {/* 모바일 목록 (신규) */}
                                            <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-slate-600 hover:text-orange-500">
                                                <input
                                                    type="checkbox"
                                                    checked={mobileFields.includes(header)}
                                                    onChange={() => toggleField("mobile", header)}
                                                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 border-slate-300"
                                                />
                                                모바일
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 우측: 파싱된 데이터 목록 영역 */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <ListChecks size={20} className="text-slate-500" />
                                업로드된 작업 대상 ({items.length}건)
                            </h3>
                        </div>

                        <div className="flex-1 overflow-auto p-0 max-h-[800px]">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white shadow-sm z-10">
                                    <tr className="border-b border-slate-200 text-sm font-semibold text-slate-500">
                                        <th className="p-4 text-center w-16">순번</th>
                                        <th className="p-4 w-1/3">고객명 / 식별값</th>
                                        <th className="p-4">상태</th>
                                        <th className="p-4 text-center">좌표 연동</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-12 text-center text-slate-400">
                                                좌측에서 엑셀 파일을 업로드해주세요.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-slate-50 transition">
                                                <td className="p-4 text-center font-bold text-slate-400">{item.routeOrder}</td>
                                                <td className="p-4 font-bold text-slate-800">{item.customerName}</td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${item.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                        item.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                            'bg-slate-100 text-slate-600 border-slate-200'
                                                        }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    {item.latitude && item.longitude ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                                            <CheckCircle2 size={14} /> 확인됨
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                                                            <MapPin size={14} /> 미확인
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}