"use client";

import {
  useCleanUpHouseholdDetail,
  useUploadCleanUpHouseholdPhotos,
} from "@/hooks/useCleanUpHousehold";
import { useActiveSurvey, useSurveyResponseByHousehold } from "@/hooks/useSurvey";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChangeEvent,
  MouseEvent,
  TouchEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronLeft, Phone } from "lucide-react"



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

type PhotoFieldKey =
  | "addressImage"
  | "beforeImage"
  | "duringImage"
  | "afterImage";

type LocalFileState = Record<PhotoFieldKey, File | null>;
type PreviewState = Record<PhotoFieldKey, string | null>;

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

const PHOTO_LABELS: { key: PhotoFieldKey; label: string }[] = [
  { key: "addressImage", label: "주소" },
  { key: "beforeImage", label: "작업전" },
  { key: "duringImage", label: "작업중" },
  { key: "afterImage", label: "작업후" },
];

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-gray-50 px-4 py-3">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-gray-900">
        {value}
      </div>
    </div>
  );
}
function PhoneDetailRow({
  label,
  value,
  color = "blue", // 아이콘 색상 테마 (blue 또는 green)
}: {
  label: string;
  value: string | null | undefined;
  color?: "blue" | "green";
}) {
  const isGreen = color === "green";
  
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-500">{label}</div>
        <div className="mt-1 break-words text-sm font-semibold text-gray-900">
          {value || "-"}
        </div>
      </div>
      
      {value && (
        <a
          href={`tel:${value}`}
          className={`ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all active:scale-90 ${
            isGreen 
              ? "bg-green-100 text-green-600 shadow-sm" 
              : "bg-blue-100 text-blue-600 shadow-sm"
          }`}
        >
          <Phone size={18} />
        </a>
      )}
    </div>
  );
}
const MobileDetailPage = () => {
  const params = useParams();
  const router = useRouter();

  const id = useMemo(() => {
    const raw = Array.isArray(params?.id) ? params.id[0] : params?.id;
    return Number(raw);
  }, [params]);

  const { data, isLoading, isError, error } = useCleanUpHouseholdDetail(id);
  const uploadMutation = useUploadCleanUpHouseholdPhotos();

  const item = data?.item;

  const fullAddress = useMemo(() => {
    if (!item) return "-";
    return [item.roadAddress, item.detailAddress].filter(Boolean).join(" ") || "-";
  }, [item]);

  const [files, setFiles] = useState<LocalFileState>({
    addressImage: null,
    beforeImage: null,
    duringImage: null,
    afterImage: null,
  });

  const [previewUrls, setPreviewUrls] = useState<PreviewState>({
    addressImage: null,
    beforeImage: null,
    duringImage: null,
    afterImage: null,
  });

  const [message, setMessage] = useState<string>("");

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [savedWorkReportId, setSavedWorkReportId] = useState<number | null>(null);
  const [savedPdfPath, setSavedPdfPath] = useState<string | null>(null);

  const [reportAgencyName] = useState("해운대구청 창조도시과");
  const [reportCompanyName] = useState("(주)제로브이");
  const [reportCompanyPhone] = useState("051-545-1150");

  const [reportJobName, setReportJobName] = useState("김남관");
  const [reportWorkDate, setReportWorkDate] = useState("해운대구 취약계층 에어컨 클린UP");
  const [reportWorkerName, setReportWorkerName] = useState("");
  const [reportMemo, setReportMemo] = useState("");

  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((url) => {
        if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);

  const handleFileChange =
    (field: PhotoFieldKey) => (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;

      setMessage("");

      setFiles((prev) => ({
        ...prev,
        [field]: file,
      }));

      setPreviewUrls((prev) => {
        const oldUrl = prev[field];
        if (oldUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(oldUrl);
        }

        return {
          ...prev,
          [field]: file ? URL.createObjectURL(file) : null,
        };
      });
    };

  const handleSavePhotos = async () => {
    if (!item?.id) return;

    if (
      !files.addressImage &&
      !files.beforeImage &&
      !files.duringImage &&
      !files.afterImage
    ) {
      setMessage("업로드할 이미지를 먼저 선택해 주세요.");
      return;
    }

    try {
      setMessage("");

      await uploadMutation.mutateAsync({
        id: item.id,
        addressImage: files.addressImage,
        beforeImage: files.beforeImage,
        duringImage: files.duringImage,
        afterImage: files.afterImage,
      });

      setMessage("이미지가 저장되었습니다.");

      setFiles({
        addressImage: null,
        beforeImage: null,
        duringImage: null,
        afterImage: null,
      });

      const inputs = document.querySelectorAll<HTMLInputElement>(
        'input[type="file"][data-household-photo-input="true"]'
      );
      inputs.forEach((input) => {
        input.value = "";
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "이미지 저장에 실패했습니다.");
    }
  };

  const activeSurveyQuery = useActiveSurvey();
  const survey = activeSurveyQuery.data?.item;
  const surveyResponseQuery = useSurveyResponseByHousehold(item?.id);
  const savedSurveyResponse = surveyResponseQuery.data?.item;

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [subjectiveAnswers, setSubjectiveAnswers] = useState<Record<number, string>>(
    {}
  );
  const [surveyMonth, setSurveyMonth] = useState<string>("");
  const [surveyDay, setSurveyDay] = useState<string>("");
  const [surveyName, setSurveyName] = useState<string>("");

  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(()=>{
    const date = new Date();
    setSurveyMonth(`${date.getMonth()+1}`);
    setSurveyDay(`${date.getDate()}`);
    const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
    setReportWorkDate(`${yyyy}.${mm}.${dd}`);
  },[])

  useEffect(() => {
    if (!savedSurveyResponse) return;

    const answerMap: Record<number, number> = {};
    const subjectiveMap: Record<number, string> = {};

    savedSurveyResponse.answers?.forEach((answer) => {
      if (answer.selectedOptionNo != null) {
        answerMap[answer.questionId] = answer.selectedOptionNo;
      }

      if (answer.subjectiveAnswer != null) {
        subjectiveMap[answer.questionId] = answer.subjectiveAnswer;
      }
    });

    setSelectedAnswers(answerMap);
    setSubjectiveAnswers(subjectiveMap);
    setSurveyMonth(String(savedSurveyResponse.surveyMonth ?? ""));
    setSurveyDay(String(savedSurveyResponse.surveyDay ?? ""));
    setSurveyName(savedSurveyResponse.respondentName ?? "");

    if (savedSurveyResponse.signaturePath) {
      setSignatureDataUrl(buildImageUrl(savedSurveyResponse.signaturePath) ?? "");
    }
  }, [savedSurveyResponse]);

  const handleSelectRadio = (questionId: number, optionNo: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionNo,
    }));
  };

  const handleSubjectiveChange = (questionId: number, value: string) => {
    setSubjectiveAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const openSignatureModal = () => {
    setIsSignatureModalOpen(true);
  };

  const closeSignatureModal = () => {
    setIsSignatureModalOpen(false);
  };

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

    if (signatureDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = signatureDataUrl;
    }
  };

  useEffect(() => {
    if (!isSignatureModalOpen) return;

    const timer = window.setTimeout(() => {
      resizeCanvas();
    }, 0);

    const handleResize = () => resizeCanvas();
    window.addEventListener("resize", handleResize);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [isSignatureModalOpen, signatureDataUrl]);

  const getCanvasPoint = (
    e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0] ?? e.changedTouches[0];
      if (!touch) return null;

      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (
    e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const point = getCanvasPoint(e);

    if (!canvas || !ctx || !point) return;

    isDrawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (
    e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const point = getCanvasPoint(e);

    if (!canvas || !ctx || !point) return;

    if ("touches" in e) {
      e.preventDefault();
    }

    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const endDrawing = () => {
    isDrawingRef.current = false;
  };

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

    const dataUrl = canvas.toDataURL("image/png");
    setSignatureDataUrl(dataUrl);
    setIsSignatureModalOpen(false);
  };

  const handleSubmitSurvey = async () => {
    if (!item?.id || !survey?.id) {
      alert("대상자 또는 설문 정보가 없습니다.");
      return;
    }

    if (!surveyMonth || !surveyDay || !surveyName.trim()) {
      alert("날짜와 성명을 입력해 주세요.");
      return;
    }

    if (!signatureDataUrl) {
      alert("서명을 입력해 주세요.");
      return;
    }

    const answers = survey.questions.map((question) => ({
      questionId: question.id,
      type: question.type,
      selectedOptionNo:
        question.type === "multiple"
          ? selectedAnswers[question.id] ?? null
          : null,
      subjectiveAnswer:
        question.type === "subjective"
          ? subjectiveAnswers[question.id] ?? ""
          : null,
    }));

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/survey/submit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          householdId: item.id,
          surveyId: survey.id,
          surveyMonth,
          surveyDay,
          surveyName,
          signatureDataUrl,
          reportMemo,
          answers,
        }),
      }
    );

    const json = await res.json();

    if (!res.ok) {
      alert(json.message || "설문 저장에 실패했습니다.");
      return;
    }

    alert("설문이 저장되었습니다.");
  };

  const fetchLatestWorkReport = async (
    householdId: number
  ): Promise<LatestWorkReportItem | null> => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/work-reports/household/${householdId}/latest`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!res.ok) {
      if (res.status === 404) return null;
      const json = await res.json().catch(() => null);
      throw new Error(json?.message || "작업보고서 정보를 불러오지 못했습니다.");
    }

    const json = await res.json();
    return json?.item ?? null;
  };

  const makePdfFileName = (dong?: string | null, name?: string | null) => {
    const safeDong = dong?.trim() ?? "";
    const safeName = name?.trim() ?? "";

    const base = `${safeDong}${safeName}보고서`.replace(/\s+/g, "");
    return base ? `${base}.pdf` : "작업보고서.pdf";
  };

  const parseFileNameFromDisposition = (
    disposition: string | null,
    dong?: string | null,
    name?: string | null
  ) => {
    if (disposition) {
      const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      if (utfMatch?.[1]) {
        return decodeURIComponent(utfMatch[1]);
      }

      const asciiMatch = disposition.match(/filename="([^"]+)"/i);
      if (asciiMatch?.[1]) {
        return asciiMatch[1];
      }
    }

    return makePdfFileName(dong, name);
  };
  const isAndroidAppWebView = () => {
    if (typeof window === "undefined") return false;
    return !!(window as any).AndroidBlobDownloader;
  };

  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("base64 변환 실패"));
      };
      reader.onerror = () => reject(new Error("파일 읽기 실패"));
      reader.readAsDataURL(blob);
    });
  const downloadBlobFile = async (blob: Blob, fileName: string) => {
    // 1) 앱 내 안드로이드 WebView면 네이티브 브리지 사용
    if (isAndroidAppWebView()) {
      try {
        const base64 = await blobToBase64(blob);
        const mimeType = blob.type || "application/octet-stream";

        (window as any).AndroidBlobDownloader.saveBase64File(
          base64,
          mimeType,
          fileName
        );
        return;
      } catch (err) {
        console.error(err);
        alert("앱 내 다운로드 처리에 실패했습니다.");
        return;
      }
    }

    // 2) 일반 모바일웹/브라우저는 기존 방식 유지
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!item?.id) return;

    let cancelled = false;

    const run = async () => {
      try {
        const latest = await fetchLatestWorkReport(item.id);
        if (!latest || cancelled) return;

        setSavedWorkReportId(latest.id ?? null);
        setSavedPdfPath(latest.pdfPath ?? null);

        setReportJobName(latest.jobName ?? "");
        setReportWorkDate(latest.workDate ?? "");
        setReportWorkerName(latest.workerName ?? "");
        setReportMemo(latest.memo ?? "");
      } catch (err) {
        console.error(err);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [item?.id]);

  const openPdfModal = () => {
    if (!item) return;
    if (!reportWorkDate) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      setReportWorkDate(`${yyyy}-${mm}-${dd}`);
    }
    handleGeneratePdf();
    //setIsPdfModalOpen(true);
  };

  const closePdfModal = () => {
    if (pdfLoading) return;
    setIsPdfModalOpen(false);
  };

  const handleGeneratePdf = async () => {
    if (!item?.id) return;

    if (!reportJobName.trim()) {
      alert("작업명을 입력해 주세요.");
      return;
    }

    if (!reportWorkDate.trim()) {
      alert("작업일자를 입력해 주세요.");
      return;
    }

    if (!reportWorkerName.trim()) {
      alert("작업자를 입력해 주세요.");
      return;
    }

    try {
      setPdfLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/work-reports/${item.id}/pdf`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobName: reportJobName.trim(),
            workDate: reportWorkDate,
            workerName: reportWorkerName.trim(),
            memo: reportMemo.trim(),
          }),
        }
      );

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || "PDF 생성에 실패했습니다.");
      }

      const blob = await res.blob();
      const fileName = parseFileNameFromDisposition(
        res.headers.get("Content-Disposition"),
        item?.dong,
        item?.name
      );

      await downloadBlobFile(blob, fileName);

      const latest = await fetchLatestWorkReport(item.id);
      if (latest) {
        setSavedWorkReportId(latest.id ?? null);
        setSavedPdfPath(latest.pdfPath ?? null);
        setReportJobName(latest.jobName ?? "");
        setReportWorkDate(latest.workDate ?? "");
        setReportWorkerName(latest.workerName ?? "");
        setReportMemo(latest.memo ?? "");
      }

      setIsPdfModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "PDF 생성에 실패했습니다.");
    } finally {
      setPdfLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="relative flex h-14 items-center justify-between px-4">
          {/* 1. 뒤로가기 버튼 */}
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="h-6 w-6 text-gray-800" />
          </button>

          {/* 2. 중앙 제목 (절대 위치로 고정) */}
          <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">
            대상자 상세
          </h1>

          {/* 3. 오른쪽 버튼 그룹 (PDF + 목록) */}
          <div className="flex items-center gap-2">
            <button
              onClick={openPdfModal}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700"
            >
              PDF
            </button>
            <Link
              href="/mobile"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700"
            >
              목록
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 py-4 space-y-4">
        {/* <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">연번</p>
            <p className="mt-1 text-lg font-bold">{item?.localNo ?? "-"}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">명단 구분</p>
            <p className="mt-1 text-lg font-bold">{labelListType(item?.listType)}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">순위</p>
            <p className="mt-1 text-lg font-bold">{item?.rank ?? "-"}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">총점</p>
            <p className="mt-1 text-lg font-bold">{item?.totalScore ?? "-"}</p>
          </div>
        </section> */}

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-bold">대상자 상세보기</h2>
              <p className="mt-1 text-sm text-gray-500">
                냉방기 클린UP 대상자 상세 정보입니다.
              </p>
            </div>
          </div>


          {isLoading ? (
            <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              상세 정보를 불러오는 중입니다.
            </div>
          ) : isError ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error instanceof Error
                ? error.message
                : "상세 정보를 불러오지 못했습니다."}
            </div>
          ) : !item ? (
            <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              데이터가 없습니다.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              

              <div className="rounded-2xl border border-gray-200 p-4">
                <h3 className="mb-3 text-base font-bold">개인/연락처 정보</h3>
                <div className="space-y-2">
                  <DetailRow label="성명" value={item.name ?? "-"} />
                  <DetailRow label="주민번호" value={maskRrn(item.rrn)} />
                  <PhoneDetailRow label="휴대폰" value={item.phone || "-"} />
                  <PhoneDetailRow label="대리인 연락처" value={item.proxyPhone || "-"} />
                  <DetailRow label="도로명주소" value={item.roadAddress || "-"} />
                  <DetailRow label="상세주소" value={item.detailAddress || "-"} />
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 space-y-2">
            <h2 className="text-lg font-bold">현장 사진 첨부</h2>
            <p className="text-sm text-gray-500">
              주소, 작업전, 작업중, 작업후 이미지를 각 1장씩 등록할 수 있습니다.
            </p>


          </div>

          

          {item ? (
            <div className="grid grid-cols-1 gap-4">
              {PHOTO_LABELS.map(({ key, label }) => {
                const preview = previewUrls[key];
                const saved = buildImageUrl(item.photos?.[key]);
                const imageSrc = preview || saved;

                return (
                  <div
                    key={key}
                    className="rounded-2xl border border-gray-200 bg-white p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-900">{label}</h3>
                      <span className="text-xs text-gray-500">1장만 가능</span>
                    </div>

                    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={label}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm text-gray-400">
                          이미지가 없습니다.
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        data-household-photo-input="true"
                        onChange={handleFileChange(key)}
                        className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                      />
                      <p className="text-xs text-gray-500">
                        JPG, PNG 등 이미지 파일 1장만 선택하세요.
                      </p>
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={handleSavePhotos}
                disabled={!item || uploadMutation.isPending}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {uploadMutation.isPending ? "저장 중..." : "이미지 저장"}
              </button>
              {message ? (
            <div
              className={`mb-4 rounded-xl px-4 py-3 text-sm ${message.includes("실패") || message.includes("먼저")
                  ? "border border-red-200 bg-red-50 text-red-700"
                  : "border border-green-200 bg-green-50 text-green-700"
                }`}
            >
              {message}
            </div>
          ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              상세 데이터를 먼저 불러와 주세요.
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 space-y-2">
            <h2 className="text-lg font-bold">설문조사</h2>
            <p className="text-sm text-gray-500">
              등록된 설문 문항에 응답할 수 있습니다.
            </p>
          </div>

          {activeSurveyQuery.isLoading ||
            (item?.id ? surveyResponseQuery.isLoading : false) ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              설문 정보를 불러오는 중입니다.
            </div>
          ) : activeSurveyQuery.isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {activeSurveyQuery.error instanceof Error
                ? activeSurveyQuery.error.message
                : "설문 정보를 불러오지 못했습니다."}
            </div>
          ) : !survey ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              등록된 설문이 없습니다.
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="inline-block rounded-lg bg-yellow-100 px-3 py-2 text-base font-extrabold leading-tight">
                {survey.title}
              </div>

              <div className="mt-4 rounded-xl bg-gray-100 px-4 py-4 text-sm leading-7 whitespace-pre-wrap text-gray-700">
                {survey.intro || "설문 안내 문구가 없습니다."}
              </div>

              <div className="mt-6 space-y-6">
                {survey.questions?.length ? (
                  survey.questions.map((question, index) => (
                    <div key={question.id}>
                      <div className="text-sm font-semibold leading-7 text-gray-900">
                        {question.type === "multiple"
                          ? `${index + 1}. ${question.question}`
                          : question.question}
                      </div>

                      {question.type === "multiple" ? (
                        <div className="mt-3 rounded-xl border border-gray-300 px-4 py-3">
                          <div className="space-y-2">
                            {question.options?.map((option) => (
                              <label
                                key={option.id}
                                className="flex items-start gap-2 text-sm text-gray-800"
                              >
                                <input
                                  type="radio"
                                  name={`question-${question.id}`}
                                  className="mt-1 h-4 w-4"
                                  checked={
                                    selectedAnswers[question.id] === option.optionNo
                                  }
                                  onChange={() =>
                                    handleSelectRadio(question.id, option.optionNo)
                                  }
                                />
                                <span>
                                  ({option.optionNo}) {option.optionText}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <textarea
                            value={subjectiveAnswers[question.id] || ""}
                            onChange={(e) =>
                              handleSubjectiveChange(question.id, e.target.value)
                            }
                            rows={5}
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
                            placeholder="내용을 입력해 주세요."
                          />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                    등록된 설문 문항이 없습니다.
                  </div>
                )}
                {/* 메모 */}
                {survey.questions?.length ? (
                <div className="mt-8 border-t border-dashed border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] text-blue-600">
                        Tip
                      </span>
                      남기실 메모 (선택)
                    </label>
                  </div>
                  
                  <div className="relative group">
                    <select
                      value={reportMemo}
                      onChange={(e) => setReportMemo(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    >
                      <option value="" className="text-gray-400">--- 메모 내용을 선택해주세요 ---</option>
                      <option value="에어컨 세척해 주셔서 감사합니다.">1. 에어컨 세척해 주셔서 감사합니다.</option>
                      <option value="내년에도 선정되면 좋겠어요">2. 내년에도 선정되면 좋겠어요</option>
                      <option value="구청 담당자님 감사합니다.">3. 구청 담당자님 감사합니다.</option>
                      <option value="구청장님 감사합니다.">4. 구청장님 감사합니다.</option>
                      <option value="기사님 감사합니다.">5. 기사님 감사합니다.</option>
                    </select>
                    
                    {/* 셀렉트 박스 화살표 커스텀 아이콘 */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 group-focus-within:text-blue-500">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                  
                  <p className="mt-2 text-[11px] text-gray-500 px-1">
                    * 위 문구 중 하나를 선택하면 보고서 메모에 자동으로 입력됩니다.
                  </p>
                </div>
              ) : null}
              </div>

              <div className="mt-6 rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-800">
                본 서비스에 대한 의견을 확인합니다.
              </div>

              <div className="mt-4 space-y-3 rounded-xl border border-gray-200 p-4">
                <input
                    type="text"
                    value={reportWorkerName}
                    onChange={(e) => setReportWorkerName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none"
                    placeholder="서비스담당"
                />
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <span>{new Date().getFullYear()}년</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={surveyMonth}
                    onChange={(e) =>
                      setSurveyMonth(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-center text-sm outline-none"
                    placeholder="월"
                  />

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={surveyDay}
                    onChange={(e) =>
                      setSurveyDay(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-center text-sm outline-none"
                    placeholder="일"
                  />
                </div>

                <input
                  type="text"
                  value={surveyName}
                  onChange={(e) => setSurveyName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none"
                  placeholder="성명"
                />

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={openSignatureModal}
                    className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700"
                  >
                    서명 입력
                  </button>
                  
                  {signatureDataUrl ? (
                    <img
                      src={signatureDataUrl}
                      alt="서명 미리보기"
                      className="h-16 w-full rounded-xl border border-gray-300 bg-white object-contain"
                    />
                  ) : null}
                  
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmitSurvey}
            className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
          >
            설문 저장하기
          </button>
        </section>
      </main>

      {isSignatureModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50">
          <div className="flex min-h-screen items-end justify-center sm:items-center">
            <div className="flex h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
                <h3 className="text-base font-bold text-gray-900">서명 입력</h3>
                <button
                  type="button"
                  onClick={closeSignatureModal}
                  className="rounded-lg px-3 py-1 text-sm font-medium text-gray-500"
                >
                  닫기
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <p className="mb-3 text-sm text-gray-500">
                  아래 영역에 손가락이나 마우스로 서명해 주세요.
                </p>

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
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700"
                  >
                    지우기
                  </button>
                  <button
                    type="button"
                    onClick={saveSignature}
                    className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
                  >
                    서명 저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* {isPdfModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/50">
          <div className="flex min-h-screen items-end justify-center sm:items-center">
            <div className="flex h-[94dvh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl">
              <div className="flex items-start justify-between border-b border-gray-200 px-4 py-4">
                <div className="pr-3">
                  <h3 className="text-base font-bold text-gray-900">
                    PDF 작업보고서 생성
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    작업정보를 입력한 후 PDF 파일을 생성합니다.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closePdfModal}
                  className="rounded-lg px-3 py-1 text-sm font-medium text-gray-500"
                >
                  닫기
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      기관명
                    </label>
                    <input
                      type="text"
                      value={reportAgencyName}
                      disabled
                      className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-700"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      회사명
                    </label>
                    <input
                      type="text"
                      value={reportCompanyName}
                      disabled
                      className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-700"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      전화번호
                    </label>
                    <input
                      type="text"
                      value={reportCompanyPhone}
                      disabled
                      className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-700"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      작업명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={reportJobName}
                      onChange={(e) => setReportJobName(e.target.value)}
                      placeholder="예: 청소 작업"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      작업일자 <span className="text-red-500">*</span>
                    </label>
                    {reportWorkDate}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      작업자 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={reportWorkerName}
                      onChange={(e) => setReportWorkerName(e.target.value)}
                      placeholder="예: 김남관"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      주소
                    </label>
                    <input
                      type="text"
                      value={fullAddress}
                      disabled
                      className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-700"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      메모
                    </label>
                    <textarea
                      rows={5}
                      value={reportMemo}
                      onChange={(e) => setReportMemo(e.target.value)}
                      placeholder="추가 메모가 있으면 입력해 주세요."
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    저장된 현장 사진(주소 / 작업전 / 작업중 / 작업후)과 설문조사
                    내용을 기준으로 PDF가 생성됩니다.
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 p-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={closePdfModal}
                    disabled={pdfLoading}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100"
                  >
                    취소
                  </button>

                  <button
                    type="button"
                    onClick={handleGeneratePdf}
                    disabled={pdfLoading}
                    className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {pdfLoading ? "PDF 생성 중..." : "PDF 파일 생성"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default MobileDetailPage;