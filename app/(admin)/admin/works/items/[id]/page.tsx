"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import {
    ArrowLeft, FileText, MapPin, CheckCircle2, User,
    Calendar, ClipboardCheck, Image as ImageIcon, Save, RotateCcw, PenTool, X,
    Download
} from "lucide-react";

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

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/work-items/${itemId}`);

            if (res.data.ok) {
                const workItem = res.data.data;
                setItem(workItem);

                // 💡 1. 백엔드에서 불러온 보고서(텍스트, 사진) 데이터 복원
                setTextAnswers(workItem.reportResult?.textAnswers || {});
                setImageAnswers(workItem.reportResult?.imageAnswers || {});

                // 💡 2. 설문조사 데이터 복원
                setSurveyAnswers(workItem.surveyResponse?.answers || {});

                // 💡 3. 고객 서명 및 기본 정보 복원
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
                    axios.get(`${API_BASE_URL}/api/reports/work-sites/${siteId}/report-form`).catch(() => null),
                    axios.get(`${API_BASE_URL}/api/site-surveys/work-sites/${siteId}/survey`).catch(() => null)
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
        setSignatureUrl(""); // 💡 클리어 시 상태도 즉시 초기화
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
        const reader = new FileReader();
        reader.onloadend = () => {
            setImageAnswers(prev => ({ ...prev, [fieldName]: reader.result as string }));
        };
        reader.readAsDataURL(file);
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
            });

            alert("작업 보고서, 설문 응답, 서명이 모두 성공적으로 저장되었습니다.");

            // 저장 후 데이터를 다시 불러와서 최신 상태 동기화
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
            const response = await fetch(url);
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
            window.open(url, '_blank'); // 실패 시 새 창으로 열기 보완
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500 font-bold">정보를 불러오는 중입니다...</div>;
    if (!item) return <div className="p-12 text-center text-slate-400">작업 정보를 찾을 수 없습니다.</div>;

    const detailFields = item.site?.detailVisibleFields || [];
    const categories = reportForm.categories || [];
    const textFields = reportForm.textFields || [];
    const imageFields = reportForm.imageFields || [];

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
                        {detailFields.map((field: string) => (
                            <p key={field} className="text-sm text-slate-700">
                                <b className="text-slate-400">{field}:</b> {item.rowData?.[field] ?? "-"}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
            {/* 💡 카테고리별 PDF 다운로드 카드 추가 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-3 flex items-center gap-2">
                    <Download size={20} className="text-red-500" /> 작업 결과 보고서 (PDF 다운로드)
                </h3>
                {(() => {
                    let pdfList: Record<string, string> = {};
                    try {
                        if (item?.reportResult?.pdfPath) {
                            if (item.reportResult.pdfPath.startsWith("{")) {
                                pdfList = JSON.parse(item.reportResult.pdfPath); // JSON 형식일 때 분리 파싱
                            } else {
                                pdfList = { "통합본": item.reportResult.pdfPath }; // 예전 데이터 호환용
                            }
                        }
                    } catch (e) { }

                    if (Object.keys(pdfList).length > 0) {
                        return (
                            <div className="flex flex-wrap gap-3">
                                {Object.entries(pdfList).map(([catName, url]) => {
                                        // 💡 고객 성명(signName 또는 item.customerName)과 현장 타이틀(item.site?.title) 조합
                                        const customerName = signName || item?.customerName || "고객";
                                        const siteTitle = item?.site?.title || "작업현장";
                                        
                                        // 다운로드 될 파일 이름 생성 (예: [마포경로당] 홍길동_에어컨_보고서.pdf)
                                        const downloadFileName = `[${siteTitle}] ${customerName}_${catName}_보고서.pdf`;

                                        return (
                                            <button
                                                key={catName}
                                                onClick={() => handleDownloadPdf(url, downloadFileName)}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 font-bold border border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition shadow-sm cursor-pointer"
                                            >
                                                <FileText size={18} /> {catName} 보고서 다운로드
                                            </button>
                                        );
                                    })}
                            </div>
                        );
                    } else {
                        return <p className="text-sm text-slate-400">아직 생성된 PDF가 없습니다. 우측 상단의 [모든 내용 저장하기]를 진행해주세요.</p>;
                    }
                })()}
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
                                    <label className="block text-sm font-bold text-slate-700">{field.name}</label>
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
            {imageFields.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 border-b pb-3">현장 사진 첨부 {activeCategory && `(${activeCategory})`}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {imageFields.map((field: any) => {
                            const isHalf = field.layout === 'HALF';
                            const slots = isHalf ? [1, 2] : [1];

                            return slots.map(slotNum => {
                                const subKeyName = isHalf ? `${field.name} ${slotNum}` : field.name;
                                const fieldKey = activeCategory ? `${activeCategory}_${subKeyName}` : subKeyName;
                                const currentImg = imageAnswers[fieldKey];

                                return (
                                    <div key={fieldKey} className={`p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 ${isHalf ? 'col-span-1' : 'md:col-span-2'}`}>
                                        <label className="block text-sm font-bold text-slate-700">
                                            {subKeyName} {isHalf && <span className="text-xs text-indigo-600 font-normal ml-1">(2장 중 {slotNum}번째)</span>}
                                        </label>
                                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-2 text-center bg-white hover:border-indigo-500 transition relative flex flex-col items-center justify-center overflow-hidden h-44">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageChange(fieldKey, e)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            {currentImg ? (
                                                <img src={currentImg} alt={subKeyName} className="w-full h-full object-contain rounded-lg" />
                                            ) : (
                                                <div className="flex flex-col items-center text-slate-400 space-y-2">
                                                    <ImageIcon size={28} />
                                                    <span className="text-xs font-semibold">클릭하여 사진 등록</span>
                                                </div>
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

            {/* 서명 영역 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-3">고객 확인 서명</h3>

                <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-700 flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <input
                                type="text"
                                value={signYear}
                                onChange={(e) => setSignYear(e.target.value)}
                                className="w-16 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-800 shadow-sm"
                            />
                            <span>년</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <input
                                type="text"
                                value={signMonth}
                                onChange={(e) => setSignMonth(e.target.value)}
                                className="w-12 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-800 shadow-sm"
                            />
                            <span>월</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <input
                                type="text"
                                value={signDay}
                                onChange={(e) => setSignDay(e.target.value)}
                                className="w-12 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-800 shadow-sm"
                            />
                            <span>일</span>
                        </div>

                        <div className="flex items-center gap-2 ml-2 md:ml-6">
                            <span>성명:</span>
                            <input
                                type="text"
                                value={signName}
                                onChange={(e) => setSignName(e.target.value)}
                                placeholder="성명 입력"
                                className="w-32 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                        {signatureUrl ? (
                            <div className="flex items-center gap-3 bg-white border border-slate-300 px-4 py-2 rounded-xl shadow-sm">
                                <img src={signatureUrl} alt="서명" className="h-10 object-contain" />
                                <button onClick={() => setIsSignModalOpen(true)} className="text-xs font-bold text-indigo-600 hover:underline">
                                    재서명
                                </button>
                                {/* 💡 서명 삭제(초기화) 버튼 추가 */}
                                <button onClick={() => { setSignatureUrl(""); }} className="text-xs font-bold text-red-500 hover:underline ml-2">
                                    삭제
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsSignModalOpen(true)}
                                className="flex items-center gap-1.5 px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition shadow-sm text-sm"
                            >
                                <PenTool size={16} /> 서명하기
                            </button>
                        )}
                    </div>
                </div>
            </div>

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