"use client";

import {
  ChangeEvent,
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Download, ChevronLeft, List, Loader2, Save, FileText, Camera } from "lucide-react";

// --- 유틸 함수 ---
function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(date);
}

function maskRrn(rrn?: string | null) {
  if (!rrn) return "-";
  if (rrn.length <= 6) return rrn;
  return `${rrn.slice(0, 6)}-*******`;
}

function labelListType(value?: string) {
  if (value === "SELECTED") return "선정자";
  if (value === "WAITLIST") return "대기자";
  return value ?? "-";
}

type PhotoFieldKey = "addressImage" | "beforeImage" | "duringImage" | "afterImage";
type LocalFileState = Record<PhotoFieldKey, File | null>;
type PreviewState = Record<PhotoFieldKey, string | null>;

const PHOTO_LABELS: { key: PhotoFieldKey; label: string }[] = [
  { key: "addressImage", label: "주소" },
  { key: "beforeImage", label: "작업전" },
  { key: "duringImage", label: "작업중" },
  { key: "afterImage", label: "작업후" },
];

export default function AdminDetailUI() {
  // --- UI 테스트용 Mock 데이터 ---
  const mockItem = {
    id: 1024,
    localNo: "2026-001",
    listType: "SELECTED",
    rank: 1,
    totalScore: 85,
    programYear: 2026,
    categoryCode: "A-01",
    dong: "반송1동",
    benefitType: "기초생활수급자",
    createdAt: "2026-08-18T10:30:00Z",
    name: "김어르신",
    rrn: "450101-1234567",
    phone: "010-1234-5678",
    proxyPhone: "010-9876-5432",
    roadAddress: "부산광역시 해운대구 반송로 123",
    detailAddress: "1층 101호",
  };

  const mockSurvey = {
    title: "2026년 해운대구 냉방기 클린UP 건강프로젝트 사업 만족도조사",
    intro: "안녕하세요?\n본 설문의 목적은 사업 만족도 조사를 통해 더 나은 서비스를 제공하고 의견을 반영하기 위함입니다.",
    questions: [
      { id: 1, type: "multiple", question: "냉방기 청소 서비스에 만족하십니까?", options: [{ optionNo: 1, optionText: "매우 만족" }, { optionNo: 2, optionText: "만족" }, { optionNo: 3, optionText: "보통" }, { optionNo: 4, optionText: "불만족" }, { optionNo: 5, optionText: "매우 불만족" }] },
      { id: 2, type: "subjective", question: "기타 건의사항을 적어주세요." }
    ]
  };

  // --- 상태 관리 ---
  const [files, setFiles] = useState<LocalFileState>({ addressImage: null, beforeImage: null, duringImage: null, afterImage: null });
  const [previewUrls, setPreviewUrls] = useState<PreviewState>({ addressImage: null, beforeImage: null, duringImage: null, afterImage: null });
  const [message, setMessage] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // PDF 관련 상태
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [reportJobName, setReportJobName] = useState("냉방기 청소");
  const [reportWorkDate, setReportWorkDate] = useState("");
  const [reportWorkerName, setReportWorkerName] = useState("홍길동");
  const [reportMemo, setReportMemo] = useState("");

  // 설문조사 관련 상태
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [subjectiveAnswers, setSubjectiveAnswers] = useState<Record<number, string>>({});
  const [surveyMonth, setSurveyMonth] = useState("");
  const [surveyDay, setSurveyDay] = useState("");
  const [surveyName, setSurveyName] = useState("");
  const [isSurveySaving, setIsSurveySaving] = useState(false);

  // 서명 모달 상태
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // --- 초기화 로직 ---
  useEffect(() => {
    const today = new Date();
    setSurveyMonth(`${today.getMonth() + 1}`);
    setSurveyDay(`${today.getDate()}`);
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setReportWorkDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // --- 사진 핸들러 ---
  const handleFileChange = (field: PhotoFieldKey) => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setMessage("");
    setFiles((prev) => ({ ...prev, [field]: file }));
    setPreviewUrls((prev) => {
      const oldUrl = prev[field];
      if (oldUrl?.startsWith("blob:")) URL.revokeObjectURL(oldUrl);
      return { ...prev, [field]: file ? URL.createObjectURL(file) : null };
    });
  };

  const handleSavePhotos = () => {
    if (!files.addressImage && !files.beforeImage && !files.duringImage && !files.afterImage) {
      setMessage("업로드할 이미지를 먼저 선택해 주세요.");
      return;
    }
    setIsUploading(true);
    setTimeout(() => {
      setMessage("이미지가 성공적으로 저장되었습니다. (UI 테스트)");
      setIsUploading(false);
    }, 1000);
  };

  // --- 서명 캔버스 핸들러 ---
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 3;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    if (signatureDataUrl) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = signatureDataUrl;
    }
  };

  useEffect(() => {
    if (!isSignatureModalOpen) return;
    const timer = window.setTimeout(resizeCanvas, 0);
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [isSignatureModalOpen, signatureDataUrl]);

  const getCanvasPoint = (e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0] ?? e.changedTouches[0];
      if (!touch) return null;
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const point = getCanvasPoint(e);
    if (!canvas || !ctx || !point) return;
    isDrawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const point = getCanvasPoint(e);
    if (!canvas || !ctx || !point) return;
    if ("touches" in e) e.preventDefault();
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const endDrawing = () => { isDrawingRef.current = false; };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setSignatureDataUrl("");
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignatureDataUrl(canvas.toDataURL("image/png"));
    setIsSignatureModalOpen(false);
  };

  // --- 액션 핸들러 ---
  const handleGeneratePdf = () => {
    if (!reportJobName || !reportWorkDate || !reportWorkerName) {
      alert("필수 입력값을 모두 채워주세요.");
      return;
    }
    setPdfLoading(true);
    setTimeout(() => {
      alert("PDF 다운로드가 완료되었습니다. (UI 테스트)");
      setPdfLoading(false);
      setIsPdfModalOpen(false);
    }, 1500);
  };

  const handleSubmitSurvey = () => {
    if (!surveyName.trim() || !signatureDataUrl) {
      alert("성명과 서명을 모두 입력해 주세요.");
      return;
    }
    setIsSurveySaving(true);
    setTimeout(() => {
      alert("설문이 성공적으로 저장되었습니다. (UI 테스트)");
      setIsSurveySaving(false);
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative pb-12 pt-6 px-4 sm:px-6">
      
      {/* 상단 요약 카드 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">연번</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-800">{mockItem.localNo}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">명단 구분</p>
          <p className="mt-2 text-2xl font-extrabold text-indigo-600 bg-indigo-50 inline-block px-3 py-1 rounded-lg mt-1">
            {labelListType(mockItem.listType)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">순위</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-800">{mockItem.rank}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">총점</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-800">{mockItem.totalScore}</p>
        </div>
      </section>

      {/* 대상자 상세보기 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">대상자 상세보기</h1>
            <p className="mt-1 text-sm text-slate-500">냉방기 클린UP 대상자 상세 정보입니다.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 shadow-sm transition-all"
            >
              <FileText size={16} /> 작업보고서 (PDF)
            </button>
            <button
              onClick={() => alert("뒤로가기 (UI 테스트)")}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
            >
              <ChevronLeft size={16} /> 뒤로가기
            </button>
            <button
              onClick={() => alert("목록으로 (UI 테스트)")}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 transition-all"
            >
              <List size={16} /> 목록으로
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* 기본 정보 */}
          <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50">
            <h2 className="text-base font-extrabold mb-4 text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>기본 정보
            </h2>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-3 border-b border-slate-200 pb-3">
                <span className="text-slate-500 font-bold">사업연도</span>
                <span className="col-span-2 font-medium text-slate-900">{mockItem.programYear}년</span>
              </div>
              <div className="grid grid-cols-3 gap-3 border-b border-slate-200 pb-3">
                <span className="text-slate-500 font-bold">동 / 구분코드</span>
                <span className="col-span-2 font-medium text-slate-900">{mockItem.dong} / {mockItem.categoryCode}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 border-b border-slate-200 pb-3">
                <span className="text-slate-500 font-bold">수급형태</span>
                <span className="col-span-2 font-medium text-slate-900">{mockItem.benefitType}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <span className="text-slate-500 font-bold">등록일시</span>
                <span className="col-span-2 font-medium text-slate-900">{formatDateTime(mockItem.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* 개인/연락처 정보 */}
          <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50">
            <h2 className="text-base font-extrabold mb-4 text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>개인 및 연락처 정보
            </h2>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-3 border-b border-slate-200 pb-3">
                <span className="text-slate-500 font-bold">성명 / 주민번호</span>
                <span className="col-span-2 font-medium text-slate-900">{mockItem.name} / {maskRrn(mockItem.rrn)}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 border-b border-slate-200 pb-3">
                <span className="text-slate-500 font-bold">휴대폰 / 대리인</span>
                <span className="col-span-2 font-medium text-slate-900">{mockItem.phone} / {mockItem.proxyPhone}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 border-b border-slate-200 pb-3">
                <span className="text-slate-500 font-bold">도로명주소</span>
                <span className="col-span-2 font-medium text-slate-900 leading-tight">{mockItem.roadAddress}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <span className="text-slate-500 font-bold">상세주소</span>
                <span className="col-span-2 font-medium text-slate-900">{mockItem.detailAddress}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 현장 사진 첨부 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">현장 사진 첨부</h2>
            <p className="mt-1 text-sm text-slate-500">
              주소, 작업전, 작업중, 작업후 이미지를 각 1장씩 등록할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSavePhotos}
            disabled={isUploading}
            className="inline-flex items-center gap-2 justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-all"
          >
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            이미지 일괄 저장
          </button>
        </div>

        {message && (
          <div className={`mb-6 rounded-xl px-4 py-3 text-sm font-bold ${message.includes("성공") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PHOTO_LABELS.map(({ key, label }) => {
            const preview = previewUrls[key];
            return (
              <div key={key} className="rounded-2xl border border-slate-200 p-4 bg-slate-50 group">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-800">{label} 사진</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-slate-200">1장 한정</span>
                </div>

                <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white aspect-[4/3] flex items-center justify-center group-hover:border-indigo-300 transition-colors">
                  {preview ? (
                    <img src={preview} alt={label} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-300">
                      <Camera size={32} />
                      <span className="text-[11px] font-bold text-slate-400">사진 없음</span>
                    </div>
                  )}
                  {/* 파일 업로드 오버레이 */}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-bold text-xs backdrop-blur-sm">
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange(key)} />
                    {preview ? "사진 변경" : "사진 선택"}
                  </label>
                </div>

                {preview && (
                  <button className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                    <Download size={14} /> 다운로드
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 설문조사 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-slate-900">설문조사 응답</h2>
          <p className="mt-1 text-sm text-slate-500">등록된 설문 문항에 응답을 기록합니다.</p>
        </div>

        <div className="rounded-2xl border border-slate-300 bg-slate-50/50 p-4 md:p-8">
          <div className="mx-auto max-w-[700px] border border-slate-200 bg-white shadow-sm px-6 py-8 md:px-10 md:py-10">
            <div className="inline-block bg-indigo-50 border border-indigo-100 px-4 py-2 text-center text-lg md:text-xl font-extrabold leading-tight text-indigo-900 mb-6">
              {mockSurvey.title}
            </div>

            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 text-sm md:text-[15px] leading-7 text-slate-700 font-medium whitespace-pre-wrap mb-8">
              {mockSurvey.intro}
            </div>

            <div className="space-y-8">
              {mockSurvey.questions.map((question, index) => (
                <div key={question.id}>
                  <div className="text-[16px] font-bold leading-7 text-slate-900 mb-3">
                    {index + 1}. {question.question}
                  </div>
                  
                  {question.type === "multiple" ? (
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {question.options?.map((option) => (
                          <label key={option.optionNo} className="flex items-center gap-2.5 text-[15px] text-slate-700 cursor-pointer font-medium p-1 hover:bg-slate-100 rounded">
                            <input
                              type="radio"
                              name={`mock-q-${question.id}`}
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                              checked={selectedAnswers[question.id] === option.optionNo}
                              onChange={() => setSelectedAnswers((prev) => ({ ...prev, [question.id]: option.optionNo }))}
                            />
                            <span>({option.optionNo}) {option.optionText}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <textarea
                      value={subjectiveAnswers[question.id] || ""}
                      onChange={(e) => setSubjectiveAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                      rows={4}
                      className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500"
                      placeholder="내용을 입력해 주세요."
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-slate-200">
              <div className="bg-slate-100 px-4 py-2 text-[15px] font-bold text-center text-slate-800 rounded-lg mb-6">
                본 서비스에 대한 의견을 확인합니다.
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-3 text-[15px] font-bold text-slate-800">
                <span>{new Date().getFullYear()}년</span>
                <input
                  type="text"
                  maxLength={2}
                  value={surveyMonth}
                  onChange={(e) => setSurveyMonth(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-12 border-b-2 border-slate-400 bg-transparent px-1 py-1 text-center outline-none focus:border-indigo-600"
                  placeholder="월"
                />
                <span>월</span>
                <input
                  type="text"
                  maxLength={2}
                  value={surveyDay}
                  onChange={(e) => setSurveyDay(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-12 border-b-2 border-slate-400 bg-transparent px-1 py-1 text-center outline-none focus:border-indigo-600"
                  placeholder="일"
                />
                <span>일</span>
                <span className="ml-4">성명:</span>
                <input
                  type="text"
                  value={surveyName}
                  onChange={(e) => setSurveyName(e.target.value)}
                  className="w-24 border-b-2 border-slate-400 bg-transparent px-2 py-1 text-center outline-none focus:border-indigo-600"
                  placeholder="이름"
                />
                <button
                  type="button"
                  onClick={() => setIsSignatureModalOpen(true)}
                  className="ml-2 inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  (서명 입력)
                </button>
              </div>

              {signatureDataUrl && (
                <div className="mt-6 flex justify-center">
                  <div className="relative inline-block border-2 border-dashed border-slate-300 p-2 rounded-xl bg-slate-50">
                    <img src={signatureDataUrl} alt="서명" className="h-16 object-contain" />
                    <button onClick={() => setSignatureDataUrl("")} className="absolute -top-2 -right-2 bg-slate-800 text-white w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center hover:bg-slate-900">&times;</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 text-right">
          <button
            type="button"
            onClick={handleSubmitSurvey}
            disabled={isSurveySaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
          >
            {isSurveySaving && <Loader2 size={16} className="animate-spin" />}
            설문 저장하기
          </button>
        </div>
      </section>

      {/* --- 모달: 서명 입력 --- */}
      {isSignatureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-lg font-extrabold text-slate-900">서명 입력</h3>
              <button onClick={() => setIsSignatureModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                &times;
              </button>
            </div>
            <div className="p-6">
              <p className="mb-4 text-sm font-bold text-slate-500">아래 영역에 마우스나 손가락으로 서명해 주세요.</p>
              <div className="overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
                <canvas
                  ref={canvasRef}
                  className="block h-[240px] w-full touch-none cursor-crosshair"
                  onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={endDrawing} onMouseLeave={endDrawing}
                  onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={endDrawing}
                />
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={clearSignature} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  지우기
                </button>
                <button onClick={saveSignature} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 shadow-sm">
                  서명 저장 적용
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 모달: PDF 생성 --- */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">작업보고서 PDF 생성</h3>
                <p className="mt-0.5 text-xs font-bold text-slate-500">입력된 정보를 기반으로 보고서를 만듭니다.</p>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">작업명 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={reportJobName}
                  onChange={(e) => setReportJobName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">작업일자 <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={reportWorkDate}
                    onChange={(e) => setReportWorkDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">작업자 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={reportWorkerName}
                    onChange={(e) => setReportWorkerName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">특이사항 메모</label>
                <textarea
                  rows={3}
                  value={reportMemo}
                  onChange={(e) => setReportMemo(e.target.value)}
                  placeholder="보고서 하단에 출력될 메모를 입력하세요."
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-xs font-bold text-indigo-800 leading-tight">
                위 정보와 앞서 등록한 [현장 사진 4장] 및 [설문조사 결과]를 종합하여 하나의 PDF 문서로 다운로드합니다.
              </div>
            </div>
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end gap-2">
              <button
                onClick={() => setIsPdfModalOpen(false)}
                disabled={pdfLoading}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleGeneratePdf}
                disabled={pdfLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                {pdfLoading && <Loader2 size={16} className="animate-spin" />}
                {pdfLoading ? "생성 중..." : "다운로드"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}