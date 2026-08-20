"use client";

import {
  ChangeEvent,
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Download, ChevronLeft, List, Loader2, Save, FileText, Camera, AlertCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

type LatestWorkReportItem = {
    id: number;
    householdId: number;
    dongName?: string | null;
    residentName?: string | null;
    agencyName?: string | null;
    companyName?: string | null;
    companyPhone?: string | null;
    jobName?: string | null;
    workDate?: string | null;
    workerName?: string | null;
    address?: string | null;
    memo?: string | null;
    pdfPath?: string | null;
};

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
  return "[RRN Redacted]";
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

interface HouseholdDetail {
  id: number;
  programYear: number;
  listType: string;
  localNo: number;
  categoryCode: number;
  dong: string;
  benefitType: string;
  name: string;
  rrn: string;
  phone: string | null;
  proxyPhone: string | null;
  roadAddress: string;
  detailAddress: string | null;
  rank: number;
  totalScore: number;
  photos: {
    addressImage: string | null;
    beforeImage: string | null;
    duringImage: string | null;
    afterImage: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminDetailUI() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const householdId = params.id;

  // --- React Query: 상세 정보 조회 ---
  const { data: detailData, isLoading, isError } = useQuery<{ item: HouseholdDetail }>({
    queryKey: ["household", householdId],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/households/${householdId}`);
      if (!res.ok) {
        throw new Error("대상자 정보를 불러오는데 실패했습니다.");
      }
      return res.json();
    },
    enabled: !!householdId,
  });

  const item = detailData?.item;

  // --- React Query: 활성 설문 조회 ---
  const { data: activeSurveyData } = useQuery({
    queryKey: ["activeSurvey"],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/survey/active`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("설문 정보를 불러오지 못했습니다.");
      }
      return res.json();
    },
  });

  const activeSurvey = activeSurveyData?.item;
  const parsedQuestions = activeSurvey 
    ? (typeof activeSurvey.questions === "string" ? JSON.parse(activeSurvey.questions) : activeSurvey.questions)
    : [];

  // --- React Query: 기존 설문 응답 조회 ---
  const { data: surveyResponseData } = useQuery({
    queryKey: ["surveyResponse", householdId],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/survey/response/household/${householdId}`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("설문 응답을 불러오지 못했습니다.");
      }
      return res.json();
    },
    enabled: !!householdId,
  });

  // --- 상태 관리 ---
  const [files, setFiles] = useState<LocalFileState>({ addressImage: null, beforeImage: null, duringImage: null, afterImage: null });
  const [previewUrls, setPreviewUrls] = useState<PreviewState>({ addressImage: null, beforeImage: null, duringImage: null, afterImage: null });
  const [message, setMessage] = useState<string>("");
  
  // 서버 사진 URL 초기 프리뷰 동기화
  useEffect(() => {
    if (item?.photos) {
      setPreviewUrls({
        addressImage: item.photos.addressImage || null,
        beforeImage: item.photos.beforeImage || null,
        duringImage: item.photos.duringImage || null,
        afterImage: item.photos.afterImage || null,
      });
    }
  }, [item]);

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

  // 기존 응답 데이터가 있으면 폼에 반영
  useEffect(() => {
    const resp = surveyResponseData?.item;
    if (resp) {
      if (resp.surveyMonth) setSurveyMonth(String(resp.surveyMonth));
      if (resp.surveyDay) setSurveyDay(String(resp.surveyDay));
      if (resp.respondentName) setSurveyName(resp.respondentName);
      if (resp.signaturePath) setSignatureDataUrl(resp.signaturePath);

      if (Array.isArray(resp.answers)) {
        const newSelected: Record<number, number> = {};
        const newSubjective: Record<number, string> = {};
        resp.answers.forEach((ans: any, idx: number) => {
          const qId = ans.questionId ?? idx + 1;
          if (ans.selectedOptionNo != null) {
            newSelected[qId] = ans.selectedOptionNo;
          }
          if (ans.subjectiveAnswer != null) {
            newSubjective[qId] = ans.subjectiveAnswer;
          }
        });
        setSelectedAnswers(newSelected);
        setSubjectiveAnswers(newSubjective);
      }
    } else if (item?.name) {
      setSurveyName(item.name);
    }
  }, [surveyResponseData, item]);

  // 서명 모달 상태
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // 초기화 날짜 설정
  useEffect(() => {
    const today = new Date();
    if (!surveyMonth) setSurveyMonth(`${today.getMonth() + 1}`);
    if (!surveyDay) setSurveyDay(`${today.getDate()}`);
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setReportWorkDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // --- 사진 업로드 Mutation ---
  const photoUploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/households/${householdId}/photos`, {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "사진 업로드에 실패했습니다.");
      return data;
    },
    onSuccess: () => {
      setMessage("이미지가 성공적으로 저장되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["household", householdId] });
      setFiles({ addressImage: null, beforeImage: null, duringImage: null, afterImage: null });
    },
    onError: (error: Error) => {
      setMessage(error.message);
    },
  });

  // --- 설문 제출 Mutation ---
  const submitSurveyMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/survey/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "설문 저장에 실패했습니다.");
      return data;
    },
    onSuccess: () => {
      alert("설문이 성공적으로 저장되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["surveyResponse", householdId] });
    },
    onError: (error: Error) => {
      alert(`설문 저장 실패: ${error.message}`);
    },
  });

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
      setMessage("업로드할 새로운 이미지를 먼저 선택해 주세요.");
      return;
    }

    const formData = new FormData();
    if (files.addressImage) formData.append("addressImage", files.addressImage);
    if (files.beforeImage) formData.append("beforeImage", files.beforeImage);
    if (files.duringImage) formData.append("duringImage", files.duringImage);
    if (files.afterImage) formData.append("afterImage", files.afterImage);

    photoUploadMutation.mutate(formData);
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

  const handleGeneratePdf = async () => {
    if (!item?.id) return;
    if (!reportJobName.trim() || !reportWorkDate.trim() || !reportWorkerName.trim()) {
      alert("필수 입력값을 모두 채워주세요.");
      return;
    }
    try {
      setPdfLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/work-reports/${item.id}/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobName: reportJobName.trim(),
          workDate: reportWorkDate,
          workerName: reportWorkerName.trim(),
          memo: reportMemo.trim(),
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || "PDF 생성에 실패했습니다.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${item.dong}${item.name}보고서.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setIsPdfModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "PDF 생성에 실패했습니다.");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSubmitSurvey = () => {
    if (!activeSurvey) {
      alert("등록된 활성 설문이 없습니다.");
      return;
    }
    if (!surveyName.trim() || !signatureDataUrl) {
      alert("성명과 서명을 모두 입력해 주세요.");
      return;
    }

    const formattedAnswers = parsedQuestions.map((q: any, idx: number) => {
      const qId = q.id ?? idx + 1;
      if (q.type === "multiple") {
        return {
          questionId: qId,
          type: "multiple",
          selectedOptionNo: selectedAnswers[qId] ?? null,
        };
      } else {
        return {
          questionId: qId,
          type: "subjective",
          subjectiveAnswer: subjectiveAnswers[qId] ?? "",
        };
      }
    });

    const payload = {
      householdId: Number(householdId),
      surveyId: activeSurvey.id,
      surveyMonth,
      surveyDay,
      surveyName,
      signatureDataUrl,
      reportMemo,
      answers: formattedAnswers,
    };

    submitSurveyMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-600" size={36} />
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="mx-auto text-red-500 mb-2" size={36} />
        <p className="text-lg font-bold text-slate-800">데이터를 불러오지 못했습니다.</p>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative pb-12 pt-6 px-4 sm:px-6">
      
      {/* 상단 요약 카드 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">연번</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-800">{item.localNo}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">명단 구분</p>
          <p className="mt-2 text-2xl font-extrabold text-indigo-600 bg-indigo-50 inline-block px-3 py-1 rounded-lg">
            {labelListType(item.listType)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">순위</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-800">{item.rank}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">총점</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-800">{item.totalScore}</p>
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
              onClick={() => router.back()}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
            >
              <ChevronLeft size={16} /> 뒤로가기
            </button>
            <Link
              href="/admin/clean/cleanup"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 transition-all"
            >
              <List size={16} /> 목록으로
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50">
            <h2 className="text-base font-extrabold mb-4 text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>기본 정보
            </h2>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-3 border-b border-slate-200 pb-3">
                <span className="text-slate-500 font-bold">사업연도</span>
                <span className="col-span-2 font-medium text-slate-900">{item.programYear}년</span>
              </div>
              <div className="grid grid-cols-3 gap-3 border-b border-slate-200 pb-3">
                <span className="text-slate-500 font-bold">동 / 구분코드</span>
                <span className="col-span-2 font-medium text-slate-900">{item.dong} / {item.categoryCode}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 border-b border-slate-200 pb-3">
                <span className="text-slate-500 font-bold">수급형태</span>
                <span className="col-span-2 font-medium text-slate-900">{item.benefitType}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <span className="text-slate-500 font-bold">등록일시</span>
                <span className="col-span-2 font-medium text-slate-900">{formatDateTime(item.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50">
            <h2 className="text-base font-extrabold mb-4 text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>개인 및 연락처 정보
            </h2>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-3 border-b border-slate-200 pb-3">
                <span className="text-slate-500 font-bold">성명 / 주민번호</span>
                <span className="col-span-2 font-medium text-slate-900">{item.name} / {maskRrn(item.rrn)}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 border-b border-slate-200 pb-3">
                <span className="text-slate-500 font-bold">휴대폰 / 대리인</span>
                <span className="col-span-2 font-medium text-slate-900">{item.phone || "-"} / {item.proxyPhone || "-"}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 border-b border-slate-200 pb-3">
                <span className="text-slate-500 font-bold">도로명주소</span>
                <span className="col-span-2 font-medium text-slate-900 leading-tight">{item.roadAddress}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <span className="text-slate-500 font-bold">상세주소</span>
                <span className="col-span-2 font-medium text-slate-900">{item.detailAddress || "-"}</span>
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
            <p className="mt-1 text-sm text-slate-500">주소, 작업전, 작업중, 작업후 이미지를 각 1장씩 등록할 수 있습니다.</p>
          </div>
          <button
            type="button"
            onClick={handleSavePhotos}
            disabled={photoUploadMutation.isPending}
            className="inline-flex items-center gap-2 justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-all"
          >
            {photoUploadMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
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
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-bold text-xs backdrop-blur-sm">
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange(key)} />
                    {preview ? "사진 변경" : "사진 선택"}
                  </label>
                </div>

                {preview && (
                  <a
                    href={preview}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                  >
                    <Download size={14} /> 원본 보기
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 설문조사 응답 (DB 연동) */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-slate-900">설문조사 응답</h2>
          <p className="mt-1 text-sm text-slate-500">등록된 설문 문항에 응답을 기록합니다.</p>
        </div>

        {!activeSurvey ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            등록된 활성 설문조사가 없습니다. 설문 관리 페이지에서 설문을 먼저 등록해 주세요.
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-300 bg-slate-50/50 p-4 md:p-8">
            <div className="mx-auto max-w-[700px] border border-slate-200 bg-white shadow-sm px-6 py-8 md:px-10 md:py-10">
              <div className="inline-block bg-indigo-50 border border-indigo-100 px-4 py-2 text-center text-lg md:text-xl font-extrabold leading-tight text-indigo-900 mb-6">
                {activeSurvey.title}
              </div>

              {activeSurvey.intro && (
                <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 text-sm md:text-[15px] leading-7 text-slate-700 font-medium whitespace-pre-wrap mb-8">
                  {activeSurvey.intro}
                </div>
              )}

              <div className="space-y-8">
                {parsedQuestions.map((question: any, index: number) => {
                  const qId = question.id ?? index + 1;
                  return (
                    <div key={qId}>
                      <div className="text-[16px] font-bold leading-7 text-slate-900 mb-3">
                        {index + 1}. {question.question}
                      </div>
                      
                      {question.type === "multiple" ? (
                        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {question.options?.map((optionText: string, optIdx: number) => {
                              const optionNo = optIdx + 1;
                              return (
                                <label key={optionNo} className="flex items-center gap-2.5 text-[15px] text-slate-700 cursor-pointer font-medium p-1 hover:bg-slate-100 rounded">
                                  <input
                                    type="radio"
                                    name={`survey-q-${qId}`}
                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                    checked={selectedAnswers[qId] === optionNo}
                                    onChange={() => setSelectedAnswers((prev) => ({ ...prev, [qId]: optionNo }))}
                                  />
                                  <span>({optionNo}) {optionText}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <textarea
                          value={subjectiveAnswers[qId] || ""}
                          onChange={(e) => setSubjectiveAnswers((prev) => ({ ...prev, [qId]: e.target.value }))}
                          rows={4}
                          className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500"
                          placeholder="내용을 입력해 주세요."
                        />
                      )}
                    </div>
                  );
                })}
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
        )}

        {activeSurvey && (
          <div className="mt-6 text-right">
            <button
              type="button"
              onClick={handleSubmitSurvey}
              disabled={submitSurveyMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
            >
              {submitSurveyMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              설문 저장하기
            </button>
          </div>
        )}
      </section>

      {/* --- 모달: 서명 입력 --- */}
      {isSignatureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-lg font-extrabold text-slate-900">서명 입력</h3>
              <button onClick={() => setIsSignatureModalOpen(false)} className="text-slate-400 hover:text-slate-700">&times;</button>
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