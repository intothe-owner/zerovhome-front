"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import {
    ArrowLeft, FileText, CheckCircle2,
    Save, RotateCcw, PenTool, X,
    Download, Image as ImageIcon, Camera, Loader2
} from "lucide-react";

// 파일 용량 변환 포맷 함수 (Bytes -> KB, MB)
const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Base64 문자열에서 대략적인 파일 용량(Byte) 계산
const getBase64Size = (base64: string) => {
    const base64str = base64.split('base64,')[1] || base64;
    const decodedLen = Math.round((base64str.length * 3) / 4);
    return decodedLen;
};

export default function WorkItemDetailPage() {
    const params = useParams();
    const itemId = params.id;
    const router = useRouter();

    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // 보고서 폼 및 카테고리 설정 상태
    const [reportForm, setReportForm] = useState<any>({ categories: [], textFields: [], imageFields: [] });
    const [activeCategory, setActiveCategory] = useState<string>("");

    // 입력 데이터 상태
    const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
    const [imageAnswers, setImageAnswers] = useState<Record<string, string>>({});

    // 이미지 용량
    const [imageSizes, setImageSizes] = useState<Record<string, string>>({});

    const [surveyAnswers, setSurveyAnswers] = useState<Record<string, any>>({});
    const [surveyForm, setSurveyForm] = useState<any>(null);

    // 서명 관련 상태
    const today = new Date();
    const [signYear, setSignYear] = useState<string>(String(today.getFullYear()));
    const [signMonth, setSignMonth] = useState<string>(String(today.getMonth() + 1));
    const [signDay, setSignDay] = useState<string>(String(today.getDate()));
    const [signName, setSignName] = useState<string>("");

    const [isSignModalOpen, setIsSignModalOpen] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [signatureUrl, setSignatureUrl] = useState<string>("");

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

    const getAuthHeaders = () => {
        const rawToken = localStorage.getItem("token") || "";
        const cleanToken = rawToken.replace(/^['"]|['"]$/g, '');
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${cleanToken}`
        };
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/work-items/${itemId}`, {
                headers: getAuthHeaders()
            });

            if (res.data.ok) {
                const workItem = res.data.data;
                setItem(workItem);

                // 이미 DB에 저장된 기존 텍스트 및 이미지 답변 보존
                const loadedTextAnswers = workItem.reportResult?.textAnswers || {};
                const loadedImageAnswers = workItem.reportResult?.imageAnswers || {};
                setImageAnswers(loadedImageAnswers);

                // 불러온 이미지의 용량 사전 계산
                const initialSizes: Record<string, string> = {};
                Object.keys(loadedImageAnswers).forEach(key => {
                    if (loadedImageAnswers[key]) {
                        initialSizes[key] = formatBytes(getBase64Size(loadedImageAnswers[key]));
                    }
                });
                setImageSizes(initialSizes);

                // 2. 설문조사 데이터 복원
                setSurveyAnswers(workItem.surveyResponse?.answers || {});

                // 3. 서명 및 기본 정보 복원
                if (workItem.customerSignature) {
                    setSignatureUrl(workItem.customerSignature);
                } else {
                    setSignatureUrl("");
                }

                if (workItem.customerName) setSignName(workItem.customerName);

                if (workItem.workDate) {
                    const parts = workItem.workDate.split("-");
                    if (parts.length === 3) {
                        setSignYear(parts[0]);
                        setSignMonth(String(Number(parts[1])));
                        setSignDay(String(Number(parts[2])));
                    }
                }

                // 폼 양식 불러오기
                const siteId = workItem.workSiteId;
                const [formRes, surveyRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/reports/work-sites/${siteId}/report-form`, { headers: getAuthHeaders() }).catch(() => null),
                    axios.get(`${API_BASE_URL}/api/site-surveys/work-sites/${siteId}/survey`, { headers: getAuthHeaders() }).catch(() => null)
                ]);

                if (formRes?.data?.ok && formRes.data.data) {
                    const formData = formRes.data.data;
                    let validCategories = formData.categories || [];
                    if (validCategories.length > 1 && validCategories.includes("기본")) {
                        validCategories = validCategories.filter((c: string) => c !== "기본");
                    }

                    setReportForm({ ...formData, categories: validCategories });
                    if (validCategories.length > 0) {
                        setActiveCategory(validCategories[0]);
                    }

                    // 텍스트 데이터 엑셀 연동 및 자동입력
                    const updatedTextAnswers = { ...loadedTextAnswers };
                    const textFieldsConfig = formData.textFields || [];

                    textFieldsConfig.forEach((field: any) => {
                        if (updatedTextAnswers[field.name] === undefined) {
                            if (field.isAutoFill) {
                                if (field.mappedExcelColumn) {
                                    const val1 = workItem.rowData?.[field.mappedExcelColumn] || "";
                                    const val2 = field.mappedExcelColumn2 ? (workItem.rowData?.[field.mappedExcelColumn2] || "") : "";
                                    updatedTextAnswers[field.name] = val2 ? `${val1} ${val2}`.trim() : val1.trim();
                                } else if (field.defaultValue) {
                                    updatedTextAnswers[field.name] = field.defaultValue;
                                } else {
                                    updatedTextAnswers[field.name] = "";
                                }
                            } else {
                                updatedTextAnswers[field.name] = "";
                            }
                        }
                    });

                    setTextAnswers(updatedTextAnswers);

                } else {
                    setTextAnswers(loadedTextAnswers);
                }

                if (surveyRes?.data?.ok && surveyRes.data.data) {
                    setSurveyForm(surveyRes.data.data);
                }
            }
        } catch (err) {
            console.error("데이터 조회 실패:", err);
            alert("정보를 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (itemId) fetchData();
    }, [itemId]);

    // 서명 모달 핸들러
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => setIsDrawing(false);

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignatureUrl("");
    };

    const saveSignatureFromModal = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setSignatureUrl(canvas.toDataURL("image/png"));
        setIsSignModalOpen(false);
    };

    // 이미지 업로드 핸들러
    const handleImageChange = (fieldName: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageSizes(prev => ({ ...prev, [fieldName]: formatBytes(file.size) }));

        const reader = new FileReader();
        reader.onloadend = () => {
            setImageAnswers(prev => ({ ...prev, [fieldName]: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    // 이미지 삭제 핸들러
    const removeImage = (fieldName: string) => {
        setImageAnswers(prev => {
            const updated = { ...prev };
            delete updated[fieldName];
            return updated;
        });
        setImageSizes(prev => {
            const updated = { ...prev };
            delete updated[fieldName];
            return updated;
        });
    };
    // 💡 개별 이미지 다운로드 핸들러 (캐시 우회 및 S3 직접 접근용으로 수정)
    const handleDownloadImage = async (imageUrl: string, fileName: string) => {
        try {
            if (imageUrl.startsWith("data:")) {
                // Base64인 경우 직접 다운로드
                const link = document.createElement("a");
                link.href = imageUrl;
                link.download = fileName || "image.png";
                link.click();
            } else {
                // 💡 핵심 1: URL 끝에 타임스탬프를 붙여서 브라우저 캐시 무시 (새로 불러오기 강제)
                const separator = imageUrl.includes("?") ? "&" : "?";
                const cacheBustingUrl = `${imageUrl}${separator}t=${new Date().getTime()}`;

                // 💡 핵심 2: headers: getAuthHeaders() 제거 
                // (S3는 우리 백엔드가 아니므로 토큰을 보내면 OPTIONS Preflight 에러가 발생할 수 있습니다)
                const response = await fetch(cacheBustingUrl);
                
                if (!response.ok) throw new Error("이미지 다운로드 실패");
                
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = blobUrl;
                link.download = fileName || "image.jpg";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            }
        } catch (error) {
            console.error("이미지 다운로드 에러:", error);
            alert("이미지를 다운로드하는 중 오류가 발생했습니다.");
        }
    };

    const handleTextChange = (fieldName: string, value: string) => {
        setTextAnswers(prev => ({ ...prev, [fieldName]: value }));
    };

    const handleSaveAll = async () => {
        try {
            setSaving(true);
            await axios.post(`${API_BASE_URL}/api/reports/work-items/${itemId}/report`, {
                workerId: item.assignedMemberId || 1,
                textAnswers,
                imageAnswers,
                surveyAnswers,
                surveyId: surveyForm?.id,
                customerSignature: signatureUrl,
                signDate: `${signYear}-${String(signMonth).padStart(2, '0')}-${String(signDay).padStart(2, '0')}`,
                signName
            }, { headers: getAuthHeaders() });

            alert("작업 보고서, 설문 응답, 서명이 모두 성공적으로 저장되었습니다.");
            fetchData();

        } catch (err) {
            console.error("저장 실패:", err);
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadPdf = async (url: string, fileName: string) => {
        try {
            const response = await fetch(url, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`다운로드 요청 실패: ${response.status}`);
            }

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("다운로드 실패:", err);
            alert("다운로드 중 오류가 발생했습니다.");
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500 font-bold">정보를 불러오는 중입니다...</div>;
    if (!item) return <div className="p-12 text-center text-slate-400">작업 정보를 찾을 수 없습니다.</div>;

    const detailFields = item.site?.detailVisibleFields || [];
    const categories = reportForm.categories || [];
    const textFields = reportForm.textFields || [];
    const imageFields = reportForm.imageFields || [];

    let downloadFileName = `[${item.site?.title || '현장'}]_${item.customerName || '고객'}_보고서.pdf`;
    
    if (item?.rowData) {
        // rowData 항목 중 "경로당"이라는 단어가 포함된 항목 찾기
        const centerKey = Object.keys(item.rowData).find(key => key.includes("경로당"));
        
        // 해당 항목에 값이 존재하면 파일명을 경로당 이름으로 변경
        if (centerKey && item.rowData[centerKey]) {
            downloadFileName = `${item.rowData[centerKey]}_보고서.pdf`;
        }
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 pb-20">
            {/* 상단 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                    <Link href="/admin/works/items" className="p-2 bg-white rounded-full border border-slate-300 hover:bg-slate-50 transition shadow-sm">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </Link>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-indigo-600" /> 통합 작업 보고서 작성
                    </h2>
                </div>
                <button
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? "저장 중..." : "모든 내용 저장하기"}
                </button>
            </div>

            {/* 기본 정보 및 상세 엑셀 데이터 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                    <h3 className="text-lg font-bold text-slate-800 border-b pb-2">기본 현황</h3>
                    <p className="text-sm text-slate-700"><b>고객명:</b> {item.customerName}</p>
                    <p className="text-sm text-slate-700"><b>작업일자:</b> {item.workDate || "미지정"}</p>
                    <p className="text-sm text-slate-700"><b>담당 작업자:</b> {item.workerName || "미배정"}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                    <h3 className="text-lg font-bold text-slate-800 border-b pb-2">고객 상세 정보</h3>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-2">
                        {detailFields.length === 0 && <p className="text-sm text-slate-400">설정된 상세 항목이 없습니다.</p>}
                        {detailFields.map((field: string) => {
                            const value = item.rowData?.[field];
                            const isPhoneNumber = field.includes("연락처") && value;
                            return (
                                <p key={field} className="text-sm text-slate-700">
                                    <b className="text-slate-400">{field}:</b>{' '}
                                    {isPhoneNumber ? (
                                        <a href={`tel:${value}`} className="text-blue-600 underline hover:text-blue-800">
                                            {value}
                                        </a>
                                    ) : (
                                        value ?? "-"
                                    )}
                                </p>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 작업 결과 보고서 (PDF 다운로드) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-3 flex items-center gap-2">
                    <Download size={20} className="text-red-500" /> 작업 결과 보고서 (PDF 다운로드)
                </h3>

                {item?.reportResult ? (
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => handleDownloadPdf(`${API_BASE_URL}/api/work-items/${itemId}/pdf`, downloadFileName)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 font-bold border border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition shadow-sm cursor-pointer"
                        >
                            <FileText size={18} /> 통합 보고서 PDF 다운로드
                        </button>
                    </div>
                ) : (
                    <p className="text-sm text-slate-400">아직 작성된 보고서가 없습니다. 양식을 작성하고 우측 상단의 [모든 내용 저장하기]를 진행해주세요.</p>
                )}
            </div>

            {/* 텍스트 입력 칸 */}
            {textFields.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 border-b pb-3">상세 텍스트 작성</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {textFields.map((field: any, idx: number) => {
                            const isFull = field.layout === 'FULL';
                            return (
                                <div key={idx} className={`space-y-1.5 ${isFull ? 'md:col-span-2' : ''}`}>
                                    <label className="block text-sm font-bold text-slate-700">
                                        {field.name}
                                        {field.isAutoFill && (
                                            <span className="ml-2 text-xs font-medium text-indigo-500">
                                                (자동입력)
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        value={textAnswers[field.name] || ""}
                                        onChange={(e) => handleTextChange(field.name, e.target.value)}
                                        placeholder={`${field.name} 입력`}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 기기 카테고리 탭 */}
            {categories.length > 0 && (
                <div className="flex gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
                    {categories.map((cat: string) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap ${activeCategory === cat
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* 현장 사진 첨부 */}
            {/* 현장 사진 첨부 */}
            {imageFields.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 border-b pb-3">현장 사진 첨부 {activeCategory && `(${activeCategory})`}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {imageFields.map((field: any) => {
                            const isHalf = field.layout === 'HALF';
                            const isSplit = field.layout === 'SPLIT';

                            let slots: { name: string, titleSuffix: string, colSpan: string }[] = [];

                            if (isHalf) {
                                slots = [
                                    { name: `${field.name} 1`, titleSuffix: "(2장 중 1번째)", colSpan: "col-span-1" },
                                    { name: `${field.name} 2`, titleSuffix: "(2장 중 2번째)", colSpan: "col-span-1" }
                                ];
                            } else if (isSplit) {
                                slots = [
                                    { name: field.name, titleSuffix: "", colSpan: "col-span-1" },
                                    { name: field.name2, titleSuffix: "", colSpan: "col-span-1" }
                                ];
                            } else {
                                slots = [
                                    { name: field.name, titleSuffix: "", colSpan: "md:col-span-2" }
                                ];
                            }

                            return slots.map(slot => {
                                const subKeyName = slot.name;
                                const fieldKey = activeCategory ? `${activeCategory}_${subKeyName}` : subKeyName;
                                const currentImg = imageAnswers[fieldKey];
                                const currentSize = imageSizes[fieldKey];

                                return (
                                    <div key={fieldKey} className={`p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 ${slot.colSpan}`}>
                                        <label className="block text-sm font-bold text-slate-700">
                                            {subKeyName} {slot.titleSuffix && <span className="text-xs text-indigo-600 font-normal ml-1">{slot.titleSuffix}</span>}
                                        </label>

                                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-2 bg-white hover:border-indigo-500 transition relative flex flex-col items-center justify-center overflow-hidden h-44 group">
                                            {currentImg ? (
                                                <>
                                                    <img src={currentImg} alt={subKeyName} className="w-full h-full object-contain rounded-lg bg-black/5" />

                                                    {/* 용량 뱃지 */}
                                                    <div className="absolute top-2 left-2 bg-black/70 text-white text-[11px] font-bold px-2.5 py-1 rounded-md z-40 backdrop-blur-sm shadow-sm">
                                                        {currentSize || "용량 계산 중..."}
                                                    </div>

                                                    {/* 버튼 컨테이너 */}
                                                    <div className="absolute top-2 right-2 flex items-center gap-2 z-50">
                                                        {/* 💡 개별 이미지 다운로드 버튼 */}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                
                                                                // 💡 1. 엑셀 데이터에서 '경로당' 키 찾기
                                                                const centerKey = item?.rowData ? Object.keys(item.rowData).find(key => key.includes("경로당")) : null;
                                                                // 💡 2. 경로당 값이 있으면 사용, 없으면 고객명(customerName)으로 대체
                                                                const prefixName = centerKey && item.rowData[centerKey] ? item.rowData[centerKey] : (item.customerName || "");
                                                                
                                                                // 💡 3. 최종 파일명 조합 (경로당이름_사진이름.jpg)
                                                                const finalFileName = prefixName ? `${prefixName}_${subKeyName}.jpg` : `${subKeyName}.jpg`;

                                                                handleDownloadImage(currentImg, finalFileName);
                                                            }}
                                                            className="flex items-center justify-center w-9 h-9 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition active:scale-90"
                                                        >
                                                            <Download size={16} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                removeImage(fieldKey);
                                                            }}
                                                            className="flex items-center justify-center w-9 h-9 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition active:scale-90"
                                                        >
                                                            <X size={18} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-slate-50 absolute inset-0 z-10">
                                                    <div className="flex flex-col items-center text-slate-400 space-y-2">
                                                        <ImageIcon size={28} />
                                                        <span className="text-xs font-semibold">클릭하여 사진 등록</span>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleImageChange(fieldKey, e)}
                                                        className="hidden"
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                );
                            });
                        })}
                    </div>
                </div>
            )}

            {/* 설문조사 응답 작성 */}
            {surveyForm && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                    <div className="border-b pb-3">
                        <h3 className="text-lg font-bold text-slate-800">{surveyForm.title}</h3>
                        {surveyForm.description && <p className="text-xs text-slate-500 mt-1">{surveyForm.description}</p>}
                    </div>

                    <div className="space-y-6">
                        {surveyForm.questions.map((q: any, qIdx: number) => (
                            <div key={qIdx} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                                <p className="font-bold text-slate-800 text-[15px]">{qIdx + 1}. {q.question}</p>
                                {q.type === 'MULTIPLE_CHOICE' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                        {q.options.map((opt: string, oIdx: number) => (
                                            <label key={oIdx} className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="radio"
                                                    name={`question_${qIdx}`}
                                                    checked={surveyAnswers[qIdx] === opt}
                                                    onChange={() => setSurveyAnswers(prev => ({ ...prev, [qIdx]: opt }))}
                                                    className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                                                />
                                                <span className="text-[15px] font-medium text-slate-700 group-hover:text-indigo-600 transition">
                                                    ({oIdx + 1}) {opt}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <textarea
                                        value={surveyAnswers[qIdx] || ""}
                                        onChange={(e) => setSurveyAnswers(prev => ({ ...prev, [qIdx]: e.target.value }))}
                                        placeholder="답변을 자유롭게 입력하세요"
                                        className="w-full p-4 border border-slate-300 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* 서명 입력 모달 창 */}
            {isSignModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <PenTool className="text-indigo-600" /> 서명 패드
                            </h3>
                            <button onClick={() => setIsSignModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">아래 영역에 마우스나 손가락으로 서명을 그려주세요.</p>

                        <div className="border border-slate-300 rounded-2xl overflow-hidden bg-slate-50 flex justify-center shadow-inner">
                            <canvas
                                ref={canvasRef}
                                width={360}
                                height={180}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                                className="cursor-crosshair bg-white touch-none"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-3">
                            <button onClick={clearSignature} className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-red-500 px-4 py-2.5 bg-slate-100 rounded-xl transition">
                                <RotateCcw size={16} /> 지우기
                            </button>
                            <div className="flex gap-2">
                                <button onClick={() => setIsSignModalOpen(false)} className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition text-sm">
                                    취소
                                </button>
                                <button onClick={saveSignatureFromModal} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition text-sm shadow-sm">
                                    입력 완료
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}