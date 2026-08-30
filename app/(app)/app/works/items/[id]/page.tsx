"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowLeft, MapPin, CheckCircle2, User,
  Calendar, ClipboardCheck, Image as ImageIcon, Save, RotateCcw, PenTool, X,
  Download, FileText, Camera, Loader2
} from "lucide-react";

// 공통 인증 헤더
const getAuthHeaders = () => {
  if (typeof window === "undefined") return {};
  const rawToken = localStorage.getItem("token") || "";
  const cleanToken = rawToken.replace(/^['"]|['"]$/g, '');
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${cleanToken}`
  };
};

export default function MobileWorkItemDetailPage() {
  const params = useParams();
  const itemId = params.id as string;
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

        // 1. 기존 보고서 데이터 복원
        setTextAnswers(workItem.reportResult?.textAnswers || {});
        setImageAnswers(workItem.reportResult?.imageAnswers || {});

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

        // 4. 양식 불러오기
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

  // --- 📝 서명 캔버스 핸들러 ---
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
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

  // --- 📷 이미지 및 텍스트 핸들러 ---
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

  // --- 💾 한 번에 통합 저장 ---
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

  // --- 📄 PDF 다운로드 핸들러 ---
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
      window.open(url, '_blank');
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
  if (!item) return <div className="p-12 text-center text-slate-400">작업 정보를 찾을 수 없습니다.</div>;

  const detailFields = item.site?.detailVisibleFields || [];
  const categories = reportForm.categories || [];
  const textFields = reportForm.textFields || [];
  const imageFields = reportForm.imageFields || [];

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-24">
      {/* 📌 상단 고정 헤더 */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between px-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-600 p-1">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-base font-bold">대상자 상세</h1>
        </div>
        <button 
          onClick={handleSaveAll}
          disabled={saving}
          className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-md shadow-sm flex items-center gap-1 hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          저장
        </button>
      </header>

      <main className="p-4 space-y-6 max-w-md mx-auto">
        
        {/* 1️⃣ 카테고리별 PDF 다운로드 */}
        <section>
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
                <div className="flex flex-wrap gap-2 mb-2">
                  {Object.entries(pdfList).map(([catName, url]) => {
                    const customerName = signName || item?.customerName || "고객";
                    const siteTitle = item?.site?.title || "작업현장";
                    const downloadFileName = `[${siteTitle}] ${customerName}_${catName}_보고서.pdf`;

                    return (
                      <button
                        key={catName}
                        onClick={() => handleDownloadPdf(url, downloadFileName)}
                        className="flex-1 min-w-[45%] flex items-center justify-center gap-1 px-3 py-2.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-lg shadow-sm hover:bg-gray-50 active:scale-95 transition"
                      >
                        <Download size={14} /> PDF ({catName})
                      </button>
                    );
                  })}
                </div>
              );
            }
            return null;
          })()}
        </section>

        {/* 2️⃣ 개인/연락처 정보 (웹 상세 노출 필드 적용) */}
        <section>
          <h2 className="text-sm font-bold text-gray-800 mb-2 ml-1">개인/연락처 정보</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            {detailFields.length === 0 && <p className="text-xs text-gray-400">설정된 정보가 없습니다.</p>}
            {detailFields.map((field: string) => (
              <div key={field} className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-gray-400">{field}</span>
                <span className="text-sm font-bold text-gray-800">{item.rowData?.[field] || "-"}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 3️⃣ 현장 사진 및 텍스트 첨부 */}
        <section>
          <h2 className="text-sm font-bold text-gray-800 mb-2 ml-1 flex items-center justify-between">
            현장 보고서 입력
            {categories.length >= 4 && (
              <select 
                value={activeCategory} 
                onChange={(e) => setActiveCategory(e.target.value)}
                className="text-xs font-bold text-gray-700 border border-gray-300 rounded-md px-2 py-1 bg-white outline-none"
              >
                {categories.map((cat: string) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </h2>

          {categories.length > 0 && categories.length < 4 && (
            <div className="flex bg-slate-200 p-1 rounded-xl mb-3">
              {categories.map((cat: string) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-1 py-2.5 text-[13px] font-bold rounded-lg transition-all ${
                    activeCategory === cat
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
            {textFields.length > 0 && (
              <div className="space-y-4 border-b border-gray-100 pb-5 mb-5">
                {textFields.map((field: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700">{field.name}</label>
                    <input
                      type="text"
                      value={textAnswers[field.name] || ""}
                      onChange={(e) => handleTextChange(field.name, e.target.value)}
                      placeholder={`${field.name} 입력`}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                ))}
              </div>
            )}

            {imageFields.length > 0 && (
              <div className="space-y-5">
                {imageFields.map((field: any) => {
                  const isHalf = field.layout === 'HALF';
                  const slots = isHalf ? [1, 2] : [1];

                  return slots.map(slotNum => {
                    const subKeyName = isHalf ? `${field.name} ${slotNum}` : field.name;
                    const fieldKey = activeCategory ? `${activeCategory}_${subKeyName}` : subKeyName;
                    const currentImg = imageAnswers[fieldKey];

                    return (
                      <div key={fieldKey}>
                        <span className="block text-sm font-bold text-gray-800 mb-2">
                          {subKeyName} {isHalf && <span className="text-[10px] text-blue-500 ml-1">(2장 중 {slotNum})</span>}
                        </span>
                        <label className="flex flex-col items-center justify-center w-full h-40 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 overflow-hidden relative">
                          {currentImg ? (
                            <img src={currentImg} alt={subKeyName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-400">
                              <Camera size={24} />
                              <span className="text-xs font-semibold">터치하여 사진 등록</span>
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

        {/* 4️⃣ 설문조사 */}
        {surveyForm && surveyForm.questions && surveyForm.questions.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-800 mb-2 ml-1">설문조사</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-[#fefce8] p-4 border-b border-[#fef08a]">
                <h3 className="font-bold text-sm text-gray-800">{surveyForm.title}</h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">설문에 응답해주시면 감사하겠습니다.</p>
              </div>
              
              <div className="p-5 space-y-6">
                {surveyForm.questions.map((q: any, qIdx: number) => (
                  <div key={qIdx}>
                    <p className="text-sm font-bold text-gray-800 mb-3">{qIdx + 1}. {q.question}</p>
                    
                    {q.type === 'MULTIPLE_CHOICE' ? (
                      <div className="flex flex-col gap-2">
                        {q.options.map((opt: string, oIdx: number) => (
                          <label key={oIdx} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                            <input 
                              type="radio" 
                              name={`question_${qIdx}`}
                              value={opt} 
                              className="w-4 h-4 text-blue-600"
                              checked={surveyAnswers[qIdx] === opt}
                              onChange={() => setSurveyAnswers({ ...surveyAnswers, [qIdx]: opt })}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <textarea 
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500 bg-gray-50"
                        rows={3}
                        placeholder="자유롭게 입력해주세요..."
                        value={surveyAnswers[qIdx] || ""}
                        onChange={(e) => setSurveyAnswers({ ...surveyAnswers, [qIdx]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 5️⃣ 고객 서명 */}
        <section>
          <h2 className="text-sm font-bold text-gray-800 mb-2 ml-1">고객 확인 및 서명</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            
            {/* 💡 연도, 월, 일 입력 상자의 테두리를 명확한 회색(border-slate-300)으로 적용 */}
            <div className="flex flex-wrap items-center gap-2">
              <input type="text" value={signYear} onChange={(e) => setSignYear(e.target.value)} className="w-16 p-1.5 text-center text-sm border border-slate-300 rounded-lg bg-gray-50 outline-none" /> 년
              <input type="text" value={signMonth} onChange={(e) => setSignMonth(e.target.value)} className="w-12 p-1.5 text-center text-sm border border-slate-300 rounded-lg bg-gray-50 outline-none" /> 월
              <input type="text" value={signDay} onChange={(e) => setSignDay(e.target.value)} className="w-12 p-1.5 text-center text-sm border border-slate-300 rounded-lg bg-gray-50 outline-none" /> 일
            </div>
            
            {/* 성명 입력 상자 테두리 회색 통일 */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">성명:</span>
              <input type="text" value={signName} onChange={(e) => setSignName(e.target.value)} className="flex-1 p-2 text-sm border border-slate-300 rounded-lg bg-gray-50 outline-none" placeholder="이름 입력" />
            </div>

            {/* 서명 확인/수정 */}
            {signatureUrl ? (
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
                <img src={signatureUrl} alt="서명" className="h-10 object-contain" />
                <div className="flex gap-2">
                  <button onClick={() => setIsSignModalOpen(true)} className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">재서명</button>
                  <button onClick={() => setSignatureUrl("")} className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">삭제</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsSignModalOpen(true)}
                className="w-full py-3 bg-gray-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <PenTool size={16} /> 서명 패드 열기
              </button>
            )}
          </div>
        </section>
        
        {/* 하단 통합 저장 버튼 */}
        <div className="pt-2">
          <button 
            onClick={handleSaveAll}
            disabled={saving}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
            모든 내용 한 번에 저장하기
          </button>
        </div>

      </main>

      {/* 서명 입력 모달 창 */}
      {isSignModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <PenTool className="text-blue-600" size={18} /> 서명 패드
              </h3>
              <button onClick={() => setIsSignModalOpen(false)} className="text-gray-400 p-1"><X size={20} /></button>
            </div>
            <p className="text-xs text-gray-500 text-center">아래 영역에 손가락으로 서명해 주세요.</p>

            <div className="border border-gray-300 rounded-xl overflow-hidden bg-gray-50">
              <canvas
                ref={canvasRef}
                width={320}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="touch-none w-full bg-white"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button onClick={clearSignature} className="text-xs font-bold text-gray-500 flex items-center gap-1 bg-gray-100 px-3 py-2 rounded-lg">
                <RotateCcw size={14} /> 지우기
              </button>
              <div className="flex gap-2">
                <button onClick={() => setIsSignModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg">취소</button>
                <button onClick={saveSignatureFromModal} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm">입력 완료</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}