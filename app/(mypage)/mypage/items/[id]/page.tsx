"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import dynamic from "next/dynamic";
import {
  CheckCircle2,
  Calendar, ClipboardCheck, Image as ImageIcon, Save, RotateCcw, PenTool, X, Pen,
  Download, FileText, Camera, Loader2, User, ChevronRight, FileSpreadsheet
} from "lucide-react";

const FilerobotImageEditor = dynamic(() => import("react-filerobot-image-editor"), { ssr: false });

const getAuthHeaders = () => {
  if (typeof window === "undefined") return {};
  const rawToken = localStorage.getItem("token") || "";
  const cleanToken = rawToken.replace(/^['"]|['"]$/g, '');
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${cleanToken}`
  };
};

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getBase64Size = (base64: string) => {
  const base64str = base64.split('base64,')[1] || base64;
  const decodedLen = Math.round((base64str.length * 3) / 4);
  return decodedLen;
};

export default function PcWorkItemDetailPage() {
  const params = useParams();
  const itemId = params.id as string;
  const router = useRouter();

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [reportForm, setReportForm] = useState<any>({ categories: [], textFields: [], imageFields: [] });
  const [activeCategory, setActiveCategory] = useState<string>("");

  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [imageAnswers, setImageAnswers] = useState<Record<string, string>>({});
  const [imageSizes, setImageSizes] = useState<Record<string, string>>({});
  const [editImageTarget, setEditImageTarget] = useState<{ key: string, url: string } | null>(null);

  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, any>>({});
  const [surveyForm, setSurveyForm] = useState<any>(null);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/work-items/${itemId}`, {
        headers: getAuthHeaders()
      });

      if (res.data.ok) {
        const workItem = res.data.data;
        setItem(workItem);

        setTextAnswers(workItem.reportResult?.textAnswers || {});

        const loadedImageAnswers = workItem.reportResult?.imageAnswers || {};
        setImageAnswers(loadedImageAnswers);

        const initialSizes: Record<string, string> = {};
        Object.keys(loadedImageAnswers).forEach(key => {
          if (loadedImageAnswers[key]) {
            initialSizes[key] = formatBytes(getBase64Size(loadedImageAnswers[key]));
          }
        });
        setImageSizes(initialSizes);

        setSurveyAnswers(workItem.surveyResponse?.answers || {});

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

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
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

  const handleOpenImageEditor = async (key: string, imageUrl: string) => {
    try {
      if (imageUrl.startsWith("data:")) {
        setEditImageTarget({ key, url: imageUrl });
        return;
      }
      const separator = imageUrl.includes("?") ? "&" : "?";
      const cacheBustingUrl = `${imageUrl}${separator}editor=${Date.now()}`;
      const response = await fetch(cacheBustingUrl, {
        method: "GET",
        mode: "cors",
        cache: "no-store",
      });

      if (!response.ok) throw new Error(`이미지 요청 실패`);

      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = () => {
        setEditImageTarget({ key, url: reader.result as string });
      };
      reader.onerror = () => {
        alert("이미지를 편집용 데이터로 변환하지 못했습니다.");
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      alert("이미지를 편집기로 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  const handleSaveEditedImage = (editedImageObject: any) => {
    const newBase64 = editedImageObject.imageBase64;
    const key = editImageTarget?.key;
    if (key) {
      setImageAnswers(prev => ({ ...prev, [key]: newBase64 }));
      const newSizeStr = formatBytes(getBase64Size(newBase64));
      setImageSizes(prev => ({ ...prev, [key]: newSizeStr }));
    }
    setEditImageTarget(null);
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

      alert("모든 정보가 성공적으로 저장되었습니다.");
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

      const isAndroidApp = typeof window !== 'undefined' && (window as any).AndroidBlobDownloader;

      if (isAndroidApp) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          (window as any).AndroidBlobDownloader.saveBase64File(base64data, "application/pdf", fileName);
        };
        reader.readAsDataURL(blob);
      } else {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error("다운로드 실패:", err);
      window.open(url, '_blank');
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;
  if (!item) return <div className="p-12 text-center text-slate-400">작업 정보를 찾을 수 없습니다.</div>;

  const detailFields = item.site?.detailVisibleFields || [];
  const categories = reportForm.categories || [];
  const textFields = reportForm.textFields || [];
  const imageFields = reportForm.imageFields || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24">
      {/* 📌 PC용 브레드크럼 서브타이틀 헤더 (뒤로가기 버튼 제거됨) */}
      <header className="sticky top-0 z-40 flex h-20 items-center justify-between px-8 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span onClick={() => router.push('/mypage')} className="hover:text-indigo-600 cursor-pointer">통합 현장 관리</span>
            <ChevronRight size={14} />
            <span onClick={() => router.push(`/mypage/${item.workSiteId}`)} className="hover:text-indigo-600 cursor-pointer">작업 현황</span>
            <ChevronRight size={14} />
            <span className="text-indigo-600">대상자 상세 정보</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {item.site?.title || "현장 관리"} <span className="text-sm font-normal text-slate-500 ml-2">({item.customerName || "고객"} 작업 상세)</span>
          </h1>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-3 text-sm font-bold bg-indigo-600 text-white rounded-xl shadow-md flex items-center gap-2 hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          전체 내용 저장하기
        </button>
      </header>

      {/* 📌 메인 그리드 레이아웃 */}
      <main className="p-8 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ⬅️ 좌측 사이드바 (정보, 서명, 설문) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* PDF 다운로드 영역 */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="text-indigo-600" size={18} /> 보고서 다운로드
              </h2>
              {(() => {
                let pdfList: Record<string, string> = {};
                try {
                  if (item?.reportResult?.pdfPath) {
                    if (item.reportResult.pdfPath.startsWith("{")) {
                      pdfList = JSON.parse(item.reportResult.pdfPath);
                    } else {
                      pdfList = { "통합본": item.reportResult.pdfPath };
                    }
                  }
                } catch (e) { }

                if (Object.keys(pdfList).length > 0) {
                  return (
                    <div className="flex flex-col gap-3">
                      {Object.entries(pdfList).map(([catName, url]) => {
                        const customerName = signName || item?.customerName || "고객";
                        const siteTitle = item?.site?.title || "작업현장";
                        const downloadFileName = `[${siteTitle}] ${customerName}_${catName}_보고서.pdf`;

                        return (
                          <button
                            key={catName}
                            onClick={() => handleDownloadPdf(url, downloadFileName)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-300 text-slate-700 text-sm font-bold rounded-xl hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition"
                          >
                            <span>{catName} 리포트</span>
                            <Download size={16} />
                          </button>
                        );
                      })}
                    </div>
                  );
                }
                return <p className="text-sm text-slate-400">아직 생성된 PDF가 없습니다.</p>;
              })()}
            </section>

            {/* 개인/연락처 정보 */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <User className="text-indigo-600" size={18} /> 기본 정보
              </h2>
              <div className="space-y-4">
                {detailFields.length === 0 && <p className="text-sm text-slate-400">설정된 정보가 없습니다.</p>}
                {detailFields.map((field: string) => (
                  <div key={field} className="flex flex-col border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <span className="text-xs font-bold text-slate-400 mb-1">{field}</span>
                    <span className="text-sm font-bold text-slate-800">{item.rowData?.[field] || "-"}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 설문조사 */}
            {surveyForm && surveyForm.questions && surveyForm.questions.length > 0 && (
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-amber-50 p-5 border-b border-amber-100">
                  <h3 className="font-extrabold text-base text-amber-900 flex items-center gap-2">
                    <ClipboardCheck size={18} className="text-amber-600" />
                    {surveyForm.title}
                  </h3>
                  <p className="text-xs text-amber-700 mt-1">{surveyForm.description || "설문에 응답해주세요."}</p>
                </div>
                <div className="p-6 space-y-6">
                  {surveyForm.questions.map((q: any, qIdx: number) => (
                    <div key={qIdx}>
                      <p className="text-sm font-bold text-slate-800 mb-3">{qIdx + 1}. {q.question}</p>
                      {q.type === 'MULTIPLE_CHOICE' ? (
                        <div className="flex flex-col gap-2.5">
                          {q.options.map((opt: string, oIdx: number) => (
                            <label key={oIdx} className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition">
                              <input
                                type="radio"
                                name={`question_${qIdx}`}
                                value={opt}
                                className="w-4 h-4 text-indigo-600 accent-indigo-600"
                                checked={surveyAnswers[qIdx] === opt}
                                onChange={() => setSurveyAnswers({ ...surveyAnswers, [qIdx]: opt })}
                              />
                              <span className="font-medium">{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                          rows={3}
                          placeholder="자유롭게 입력해주세요..."
                          value={surveyAnswers[qIdx] || ""}
                          onChange={(e) => setSurveyAnswers({ ...surveyAnswers, [qIdx]: e.target.value })}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 고객 서명 */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <PenTool className="text-indigo-600" size={18} /> 최종 고객 확인 및 서명
              </h2>
              
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <input type="text" value={signYear} onChange={(e) => setSignYear(e.target.value)} className="w-12 text-center text-sm font-bold bg-transparent outline-none" />년
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <input type="text" value={signMonth} onChange={(e) => setSignMonth(e.target.value)} className="w-8 text-center text-sm font-bold bg-transparent outline-none" />월
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <input type="text" value={signDay} onChange={(e) => setSignDay(e.target.value)} className="w-8 text-center text-sm font-bold bg-transparent outline-none" />일
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-600 shrink-0">고객 성명</span>
                  <input type="text" value={signName} onChange={(e) => setSignName(e.target.value)} className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-500" placeholder="이름을 입력하세요" />
                </div>

                {signatureUrl ? (
                  <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <img src={signatureUrl} alt="서명" className="h-14 object-contain" />
                    <div className="flex flex-col gap-2 shrink-0">
                      <button onClick={() => setIsSignModalOpen(true)} className="text-xs font-bold text-indigo-600 bg-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-200 transition">재서명</button>
                      <button onClick={() => setSignatureUrl("")} className="text-xs font-bold text-rose-600 bg-rose-100 px-3 py-1.5 rounded-lg hover:bg-rose-200 transition">삭제</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsSignModalOpen(true)}
                    className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-slate-700 transition"
                  >
                    <PenTool size={16} /> 서명 패드 열기
                  </button>
                )}
              </div>
            </section>
          </div>

          {/* ➡️ 우측 메인 컨텐츠 (현장 보고서 입력 폼) */}
          <div className="lg:col-span-8 space-y-6">
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              
              <div className="bg-slate-50 px-6 pt-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ImageIcon className="text-indigo-600" size={20} /> 현장 보고서 작성 내역
                </h2>
                
                {categories.length > 0 && (
                  <div className="flex gap-2 pb-[-1px] overflow-x-auto custom-scrollbar">
                    {categories.map((cat: string) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-6 py-3 text-sm font-bold rounded-t-xl transition-colors border-b-2 ${
                          activeCategory === cat
                            ? "bg-white text-indigo-700 border-indigo-600 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-transparent"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-8 space-y-8">
                {textFields.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-slate-100">
                    {textFields.map((field: any, idx: number) => (
                      <div key={idx} className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">{field.name}</label>
                        <input
                          type="text"
                          value={textAnswers[field.name] || ""}
                          onChange={(e) => handleTextChange(field.name, e.target.value)}
                          placeholder={`${field.name} 입력`}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:bg-white outline-none transition"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {imageFields.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {imageFields.map((field: any) => {
                      const isHalf = field.layout === 'HALF';
                      const slots = isHalf ? [1, 2] : [1];

                      return slots.map(slotNum => {
                        const subKeyName = isHalf ? `${field.name} ${slotNum}` : field.name;
                        const fieldKey = activeCategory ? `${activeCategory}_${subKeyName}` : subKeyName;
                        const currentImg = imageAnswers[fieldKey];
                        const currentSize = imageSizes[fieldKey];

                        return (
                          <div key={fieldKey} className="flex flex-col gap-2">
                            <span className="text-sm font-bold text-slate-800">
                              {subKeyName} {isHalf && <span className="text-xs text-indigo-500 font-medium ml-1">(2장 중 {slotNum})</span>}
                            </span>
                            <label className="relative w-full h-56 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden group hover:border-indigo-400 hover:bg-indigo-50/30 transition cursor-pointer flex flex-col items-center justify-center">
                              {currentImg ? (
                                <>
                                  <img src={currentImg} alt={subKeyName} className="w-full h-full object-contain" />
                                  <div className="absolute top-3 left-3 bg-black/70 text-white text-xs font-semibold px-2.5 py-1 rounded shadow-sm z-10">
                                    {currentSize || "용량 확인중"}
                                  </div>
                                  <div className="absolute top-3 right-3 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={async (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        await handleOpenImageEditor(fieldKey, currentImg);
                                      }}
                                      className="p-2.5 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition"
                                    >
                                      <PenTool size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.preventDefault(); removeImage(fieldKey); }}
                                      className="p-2.5 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-indigo-500 transition">
                                  <div className="p-4 bg-white rounded-full shadow-sm group-hover:bg-indigo-50">
                                    <Camera size={28} />
                                  </div>
                                  <span className="text-sm font-bold">사진 등록하기</span>
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageChange(fieldKey, e)}
                              />
                            </label>
                          </div>
                        );
                      });
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>

        </div>
      </main>

      {editImageTarget && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 lg:p-12">
          <div className="w-full max-w-6xl h-full max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl relative">
            <FilerobotImageEditor
              source={editImageTarget.url}
              onSave={(editedImageObject) => handleSaveEditedImage(editedImageObject)}
              onClose={() => setEditImageTarget(null)}
              annotationsCommon={{ fill: "#ff0000" }}
              Text={{ text: "텍스트 입력" }}
              tabsIds={["Adjust", "Annotate", "Watermark", "Filters", "Finetune"]}
              defaultTabId="Annotate"
              defaultToolId="Text"
              savingPixelRatio={1}
              previewPixelRatio={1}
              useBackendTranslations={false}
              language="ko"
              theme={{ typography: { fontFamily: '"Noto Sans KR", sans-serif' } }}
              translations={{
                name: "파일 이름", save: "적용하여 닫기", saveAs: "새로 저장", back: "취소",
                loading: "불러오는 중...", cancel: "닫기", apply: "적용", confirm: "확인",
              }}
            />
          </div>
        </div>
      )}

      {isSignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <PenTool className="text-indigo-600" size={22} /> 서명 패드
              </h3>
              <button onClick={() => setIsSignModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-slate-50 p-2 rounded-full transition"><X size={20} /></button>
            </div>
            
            <p className="text-sm font-medium text-slate-500 text-center">아래 영역에 마우스나 트랙패드로 서명해 주세요.</p>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 shadow-inner">
              <canvas
                ref={canvasRef}
                width={500}
                height={250}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="touch-none w-full bg-white cursor-crosshair"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <button onClick={clearSignature} className="text-sm font-bold text-slate-600 flex items-center gap-2 bg-slate-100 px-5 py-2.5 rounded-xl hover:bg-slate-200 transition">
                <RotateCcw size={16} /> 다시 그리기
              </button>
              <div className="flex gap-3">
                <button onClick={() => setIsSignModalOpen(false)} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition">취소</button>
                <button onClick={saveSignatureFromModal} className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-indigo-700 transition">서명 완료</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}} />
    </div>
  );
}