"use client";

import {
  ChangeEvent,
  MouseEvent,
  TouchEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Phone, Camera, Loader2 } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// --- Utility Functions ---
function maskRrn(rrn?: string | null) {
  if (!rrn) return "-";
  if (rrn.length <= 6) return rrn;
  return `${rrn.slice(0, 6)}******`;
}

function buildImageUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = process.env.NEXT_PUBLIC_S3_BASE_URL ?? "";
  if (!base) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

type PhotoFieldKey = "addressImage" | "beforeImage" | "duringImage" | "afterImage";

const PHOTO_LABELS: { key: PhotoFieldKey; label: string }[] = [
  { key: "addressImage", label: "주소" },
  { key: "beforeImage", label: "작업전" },
  { key: "duringImage", label: "작업중" },
  { key: "afterImage", label: "작업후" },
];

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-gray-50 px-4 py-3">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function PhoneDetailRow({ label, value, color = "blue" }: { label: string; value: string | null | undefined; color?: "blue" | "green" }) {
  const isGreen = color === "green";
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-500">{label}</div>
        <div className="mt-1 break-words text-sm font-semibold text-gray-900">{value || "-"}</div>
      </div>
      {value && (
        <a
          href={`tel:${value}`}
          className={`ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all active:scale-90 ${isGreen ? "bg-green-100 text-green-600 shadow-sm" : "bg-blue-100 text-blue-600 shadow-sm"
            }`}
        >
          <Phone size={18} />
        </a>
      )}
    </div>
  );
}

export default function MobileDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = Number(Array.isArray(params?.id) ? params.id[0] : params?.id);

  const [message, setMessage] = useState<string>("");

  // ✅ 1. 상세 정보 조회 (React Query)
  const { data: item, isLoading, isError, error } = useQuery({
    queryKey: ["household-detail", id],
    queryFn: async () => {
      const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/households/${id}`);
      return data.item;
    },
    enabled: !!id,
  });

  const fullAddress = useMemo(() => {
    if (!item) return "-";
    return [item.roadAddress, item.detailAddress].filter(Boolean).join(" ") || "-";
  }, [item]);

  // 2. 사진 상태 및 업로드
  const [files, setFiles] = useState<Record<PhotoFieldKey, File | null>>({
    addressImage: null, beforeImage: null, duringImage: null, afterImage: null,
  });
  const [previewUrls, setPreviewUrls] = useState<Record<PhotoFieldKey, string | null>>({
    addressImage: null, beforeImage: null, duringImage: null, afterImage: null,
  });

  // ✅ Mutation API 경로에 /api 추가
  const uploadPhotosMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await axios.put(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/households/${id}/photos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      setMessage("현장 사진이 성공적으로 저장되었습니다.");
      setFiles({ addressImage: null, beforeImage: null, duringImage: null, afterImage: null });
      queryClient.invalidateQueries({ queryKey: ["household-detail", id] });
    },
    onError: (err: any) => {
      setMessage(err.response?.data?.message || "사진 저장에 실패했습니다.");
    }
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
    const hasFiles = Object.values(files).some((file) => file !== null);
    if (!hasFiles) {
      setMessage("업로드할 이미지를 먼저 선택해 주세요.");
      return;
    }

    const formData = new FormData();
    Object.entries(files).forEach(([key, file]) => {
      if (file) formData.append(key, file);
    });

    uploadPhotosMutation.mutate(formData);
  };

  // ✅ 3. 설문조사 상태 및 쿼리 API 경로에 /api 추가
  const { data: survey } = useQuery({
    queryKey: ["active-survey"],
    queryFn: async () => {
      const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/survey/active`);
      return data.item;
    },
  });

  const { data: savedSurveyResponse } = useQuery({
    queryKey: ["survey-response", id],
    queryFn: async () => {
      const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/survey/response/household/${id}`);
      return data.item;
    },
    enabled: !!id,
    retry: false,
  });

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [subjectiveAnswers, setSubjectiveAnswers] = useState<Record<number, string>>({});
  // 💡 수정 포인트: useState 초기값으로 오늘 날짜의 월과 일을 바로 세팅합니다.
  const [surveyMonth, setSurveyMonth] = useState<string>(() => String(new Date().getMonth() + 1));
  const [surveyDay, setSurveyDay] = useState<string>(() => String(new Date().getDate()));
  const [surveyName, setSurveyName] = useState<string>("");
  const [reportMemo, setReportMemo] = useState<string>("");
  const [reportWorkerName, setReportWorkerName] = useState<string>("김남관");

  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);


  useEffect(() => {
    if (!savedSurveyResponse) return;

    const answerMap: Record<number, number> = {};
    const subjectiveMap: Record<number, string> = {};

    savedSurveyResponse.answers?.forEach((answer: any) => {
      if (answer.selectedOptionNo != null) answerMap[answer.questionId] = answer.selectedOptionNo;
      if (answer.subjectiveAnswer != null) subjectiveMap[answer.questionId] = answer.subjectiveAnswer;
    });

    setSelectedAnswers(answerMap);
    setSubjectiveAnswers(subjectiveMap);

    // 값이 존재할 때만 세팅하여 기존 기본값이 날아가지 않도록 방어
    if (savedSurveyResponse.surveyMonth != null) {
      setSurveyMonth(String(savedSurveyResponse.surveyMonth));
    }
    if (savedSurveyResponse.surveyDay != null) {
      setSurveyDay(String(savedSurveyResponse.surveyDay));
    }
    
    if (savedSurveyResponse.respondentName) {
      setSurveyName(savedSurveyResponse.respondentName ?? "");
    }

    if (savedSurveyResponse.signaturePath) {
      setSignatureDataUrl(buildImageUrl(savedSurveyResponse.signaturePath) ?? "");
    }
  }, [savedSurveyResponse]);

  const handleSelectRadio = (questionId: number, optionNo: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionNo }));
  };

  const handleSubjectiveChange = (questionId: number, value: string) => {
    setSubjectiveAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // ✅ 설문 저장 API에 /api 추가
  const handleSubmitSurvey = async () => {
    if (!item?.id || !survey?.id) return alert("대상자 또는 설문 정보가 없습니다.");
    if (!surveyMonth || !surveyDay || !surveyName.trim()) return alert("날짜와 성명을 입력해 주세요.");
    if (!signatureDataUrl) return alert("서명을 입력해 주세요.");

    const answers = survey.questions.map((question: any) => ({
      questionId: question.id,
      type: question.type,
      selectedOptionNo: question.type === "multiple" ? selectedAnswers[question.id] ?? null : null,
      subjectiveAnswer: question.type === "subjective" ? subjectiveAnswers[question.id] ?? "" : null,
    }));

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/survey/submit`, {
        householdId: item.id,
        surveyId: survey.id,
        surveyMonth,
        surveyDay,
        surveyName,
        signatureDataUrl,
        reportMemo,
        answers,
      });
      alert("설문이 저장되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["survey-response", id] });
    } catch (err) {
      alert("설문 저장에 실패했습니다.");
    }
  };

  // --- 서명 캔버스 핸들러 ---
  const openSignatureModal = () => setIsSignatureModalOpen(true);
  const closeSignatureModal = () => setIsSignatureModalOpen(false);

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
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (signatureDataUrl && !signatureDataUrl.startsWith("http")) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = signatureDataUrl;
    }
  };

  useEffect(() => {
    if (isSignatureModalOpen) {
      const timer = window.setTimeout(() => resizeCanvas(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [isSignatureModalOpen]);

  const getCanvasPoint = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
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

  const startDrawing = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d");
    const point = getCanvasPoint(e);
    if (!ctx || !point) return;
    isDrawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    const point = getCanvasPoint(e);
    if (!ctx || !point) return;
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

  // --- PDF 모달 및 다운로드 핸들러 ---
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [reportJobName, setReportJobName] = useState("청소 작업");
  const [reportWorkDate, setReportWorkDate] = useState("");

  const openPdfModal = () => {
    const today = new Date();
    setReportWorkDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`);
    setIsPdfModalOpen(true);
  };

  const closePdfModal = () => setIsPdfModalOpen(false);

  const isAndroidAppWebView = () => typeof window !== "undefined" && !!(window as any).AndroidBlobDownloader;

  const blobToBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("base64 변환 실패"));
    reader.onerror = () => reject(new Error("파일 읽기 실패"));
    reader.readAsDataURL(blob);
  });

  const downloadBlobFile = async (blob: Blob, fileName: string) => {
    if (isAndroidAppWebView()) {
      try {
        const base64 = await blobToBase64(blob);
        (window as any).AndroidBlobDownloader.saveBase64File(base64, blob.type || "application/pdf", fileName);
        return;
      } catch (err) {
        alert("앱 내 다운로드 처리에 실패했습니다.");
        return;
      }
    }
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // ✅ PDF 생성 API 경로에 /api 추가
  const handleGeneratePdf = async () => {
    if (!item?.id) return;
    if (!reportJobName.trim() || !reportWorkDate.trim() || !reportWorkerName.trim()) {
      return alert("작업명, 작업일자, 작업자를 모두 입력해 주세요.");
    }

    try {
      setPdfLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/work-reports/household/${item.id}/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobName: reportJobName.trim(),
          workDate: reportWorkDate,
          workerName: reportWorkerName.trim(),
          memo: reportMemo.trim(),
        }),
      });

      if (!res.ok) throw new Error("PDF 생성에 실패했습니다.");

      const blob = await res.blob();
      const fileName = `${item.dong || ""}_${item.name}_작업보고서.pdf`;
      await downloadBlobFile(blob, fileName);
      setIsPdfModalOpen(false);
    } catch (err: any) {
      alert(err.message || "PDF 생성에 실패했습니다.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
  }

  if (isError || !item) {
    return <div className="p-10 text-center text-red-500">{error instanceof Error ? error.message : "데이터를 찾을 수 없습니다."}</div>;
  }

  const isCanceled = item.isCancel;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur px-4 h-14 flex items-center justify-between">
        <button onClick={() => router.back()}><ChevronLeft className="h-6 w-6 text-gray-800" /></button>
        <h1 className="font-bold">대상자 상세</h1>
        <div className="flex items-center gap-2">
          <button onClick={openPdfModal} className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700">
            PDF
          </button>
          <Link href="/mobile" className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700">
            목록
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 py-4 space-y-4">
        {isCanceled && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-red-700 font-bold text-sm">
            취소된 작업입니다. 수정할 수 없습니다.
          </div>
        )}

        {/* 정보 섹션 */}
        <section className={`rounded-2xl border border-gray-200 bg-white p-4 ${isCanceled ? 'opacity-50 pointer-events-none' : ''}`}>
          <h3 className="font-bold mb-3">개인/연락처 정보</h3>
          <div className="space-y-2">
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">성명</p>
              <p className="font-semibold text-sm">{item.name}</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">휴대폰</p>
              <p className="font-semibold text-sm">{item.phone}</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">주소</p>
              <p className="font-semibold text-sm">{item.roadAddress} {item.detailAddress}</p>
            </div>
          </div>
        </section>

        {/* 사진 섹션 */}
        {!isCanceled && (
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-bold mb-4">현장 사진 첨부</h2>
            <div className="grid grid-cols-1 gap-4">
              {[
                { key: "addressImage", label: "주소" },
                { key: "beforeImage", label: "작업전" },
                { key: "duringImage", label: "작업중" },
                { key: "afterImage", label: "작업후" }
              ].map(({ key, label }) => {
                const imgKey = key as PhotoFieldKey;
                const src = previewUrls[imgKey] || buildImageUrl(item.photos?.[imgKey]);

                return (
                  <div key={key} className="rounded-xl border border-gray-200 p-4">
                    <h3 className="text-sm font-bold mb-2">{label}</h3>
                    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50">
                      {src ? (
                        <img src={src} className="h-full w-full object-cover" alt={label} />
                      ) : (
                        <Camera size={24} className="text-gray-400" />
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={handleFileChange(imgKey)} className="mt-3 block w-full text-sm file:mr-4 file:rounded-lg file:bg-gray-900 file:text-white file:px-3 file:py-1 border-0" />
                  </div>
                );
              })}
            </div>
            <button onClick={handleSavePhotos} disabled={uploadPhotosMutation.isPending} className="w-full mt-4 bg-blue-600 text-white rounded-xl py-3 font-semibold disabled:bg-gray-400">
              {uploadPhotosMutation.isPending ? "저장 중..." : "이미지 저장"}
            </button>
            {message && <div className="mt-3 text-center text-sm font-bold text-blue-600">{message}</div>}
          </section>
        )}

        {/* 설문 저장 섹션 */}
        {!isCanceled && (
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 space-y-2">
              <h2 className="text-lg font-bold">설문조사</h2>
            </div>

            {!survey ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                등록된 설문 문항이 없습니다.
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="inline-block rounded-lg bg-yellow-100 px-3 py-2 text-base font-extrabold leading-tight">
                  {survey.title}
                </div>

                <div className="mt-4 rounded-xl bg-gray-100 px-4 py-4 text-sm leading-7 text-gray-700">
                  {survey.intro}
                </div>

                <div className="mt-6 space-y-6">
                  {survey.questions?.map((question: any, index: number) => (
                    <div key={question.id}>
                      <div className="text-sm font-semibold leading-7 text-gray-900">
                        {index + 1}. {question.question}
                      </div>

                      {question.type === "multiple" ? (
                        <div className="mt-3 rounded-xl border border-gray-300 px-4 py-3">
                          <div className="space-y-2">
                            {/* 💡 수정된 부분: options가 문자열 배열이므로 인덱스(index)를 활용해 optionNo를 생성합니다. */}
                            {question.options?.map((optionText: string, index: number) => {
                              const optionNo = index + 1; // 1부터 시작하는 보기 번호

                              return (
                                <label key={optionNo} className="flex items-start gap-2 text-sm text-gray-800 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`question-${question.id}`}
                                    className="mt-1 h-4 w-4"
                                    checked={selectedAnswers[question.id] === optionNo}
                                    onChange={() => handleSelectRadio(question.id, optionNo)}
                                  />
                                  <span>{optionNo}. {optionText}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <textarea
                            value={subjectiveAnswers[question.id] || ""}
                            onChange={(e) => handleSubjectiveChange(question.id, e.target.value)}
                            rows={4}
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
                            placeholder="내용을 입력해 주세요."
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="mt-8 border-t border-dashed border-gray-200 pt-6">
                    <label className="text-sm font-bold text-gray-900 block mb-2">남기실 메모 (선택)</label>
                    <select
                      value={reportMemo}
                      onChange={(e) => setReportMemo(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
                    >
                      <option value="">--- 메모 내용을 선택해주세요 ---</option>
                      <option value="에어컨 세척해 주셔서 감사합니다.">에어컨 세척해 주셔서 감사합니다.</option>
                      <option value="내년에도 선정되면 좋겠어요">내년에도 선정되면 좋겠어요</option>
                      <option value="구청 담당자님 감사합니다.">구청 담당자님 감사합니다.</option>
                    </select>
                  </div>

                  <div className="mt-4 space-y-3 rounded-xl border border-gray-200 p-4">
                    <input
                      type="text"
                      value={reportWorkerName}
                      onChange={(e) => setReportWorkerName(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none"
                      placeholder="서비스담당 (작업자)"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        maxLength={2}
                        value={surveyMonth}
                        onChange={(e) => setSurveyMonth(e.target.value.replace(/[^0-9]/g, ""))}
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-center text-sm outline-none"
                        placeholder="월"
                      />
                      <input
                        type="text"
                        maxLength={2}
                        value={surveyDay}
                        onChange={(e) => setSurveyDay(e.target.value.replace(/[^0-9]/g, ""))}
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-center text-sm outline-none"
                        placeholder="일"
                      />
                    </div>

                    <input
                      type="text"
                      value={surveyName}
                      onChange={(e) => setSurveyName(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none"
                      placeholder="성명 (서명인)"
                    />

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={openSignatureModal}
                        className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm"
                      >
                        서명 입력
                      </button>

                      {signatureDataUrl && (
                        <img
                          src={signatureDataUrl}
                          alt="서명 미리보기"
                          className="h-16 w-full rounded-xl border border-gray-300 bg-white object-contain"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSubmitSurvey}
                  className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white active:scale-95 transition"
                >
                  설문 저장하기
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      {/* 서명 모달 */}
      {isSignatureModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
              <h3 className="text-base font-bold text-gray-900">서명 입력</h3>
              <button onClick={closeSignatureModal} className="rounded-lg px-3 py-1 text-sm font-medium text-gray-500">닫기</button>
            </div>
            <div className="p-4">
              <div className="overflow-hidden rounded-xl border border-gray-300 bg-white">
                <canvas
                  ref={canvasRef}
                  className="block h-[320px] w-full touch-none bg-white"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={endDrawing}
                  onMouseLeave={endDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={endDrawing}
                />
              </div>
            </div>
            <div className="border-t border-gray-200 p-4">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={clearSignature} className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700">지우기</button>
                <button type="button" onClick={saveSignature} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white">서명 저장</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF 모달 */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
              <h3 className="text-base font-bold text-gray-900">PDF 작업보고서 생성</h3>
              <button onClick={closePdfModal} className="rounded-lg px-3 py-1 text-sm font-medium text-gray-500">닫기</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">작업명 <span className="text-red-500">*</span></label>
                <input type="text" value={reportJobName} onChange={(e) => setReportJobName(e.target.value)} placeholder="예: 청소 작업" className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">작업일자</label>
                <input type="text" value={reportWorkDate} onChange={(e) => setReportWorkDate(e.target.value)} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">작업자 <span className="text-red-500">*</span></label>
                <input type="text" value={reportWorkerName} onChange={(e) => setReportWorkerName(e.target.value)} placeholder="작업자 성명" className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none" />
              </div>
            </div>
            <div className="border-t border-gray-200 p-4">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={closePdfModal} disabled={pdfLoading} className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700">취소</button>
                <button type="button" onClick={handleGeneratePdf} disabled={pdfLoading} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white">
                  {pdfLoading ? "생성 중..." : "PDF 생성"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}