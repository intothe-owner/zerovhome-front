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
import { ChevronLeft, Phone, Camera, FileText } from "lucide-react";
import Link from "next/link";

function maskRrn(rrn?: string | null) {
  if (!rrn) return "-";
  if (rrn.length <= 6) return rrn;
  return `${rrn.slice(0, 6)}******`;
}

type PhotoFieldKey =
  | "addressImage"
  | "beforeImage"
  | "duringImage"
  | "afterImage";

type PreviewState = Record<PhotoFieldKey, string | null>;

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
  color = "blue",
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

export default function MobileDetailPureUI() {
  const router = useRouter();

  // UI 테스트용 목(Mock) 대상자 데이터
  const item = {
    id: 1,
    localNo: "2026-001",
    name: "홍길동",
    rrn: "900101-1234567",
    phone: "010-1234-5678",
    proxyPhone: "010-9876-5432",
    roadAddress: "부산광역시 해운대구 반송로 123",
    detailAddress: "101호",
    dong: "반송동",
    photos: {
      addressImage: null,
      beforeImage: null,
      duringImage: null,
      afterImage: null,
    }
  };

  const fullAddress = useMemo(() => {
    return [item.roadAddress, item.detailAddress].filter(Boolean).join(" ") || "-";
  }, [item]);

  // 사진 미리보기 상태
  const [previewUrls, setPreviewUrls] = useState<PreviewState>({
    addressImage: null,
    beforeImage: null,
    duringImage: null,
    afterImage: null,
  });

  const [message, setMessage] = useState<string>("");

  // 파일 선택 핸들러 (UI 테스트용 로컬 프리뷰)
  const handleFileChange = (field: PhotoFieldKey) => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setMessage("");

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

  const handleSavePhotos = () => {
    setMessage("현장 사진이 성공적으로 저장되었습니다. (UI 테스트)");
  };

  // UI 테스트용 목 설문 데이터
  const survey = {
    id: 1,
    title: "2026년 해운대구 냉방기 클린UP 사업 만족도조사",
    intro: "본 설문의 목적은 사업 만족도 조사를 통해 더 나은 서비스를 제공하고 의견을 반영하기 위함입니다.",
    questions: [
      {
        id: 1,
        type: "multiple",
        question: "서비스 만족도에 대해 어떻게 생각하십니까?",
        options: [
          { id: 1, optionNo: 1, optionText: "매우 만족" },
          { id: 2, optionNo: 2, optionText: "만족" },
          { id: 3, optionNo: 3, optionText: "보통" },
        ]
      },
      {
        id: 2,
        type: "subjective",
        question: "기타 건의사항이나 개선할 점을 적어주세요.",
      }
    ]
  };

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [subjectiveAnswers, setSubjectiveAnswers] = useState<Record<number, string>>({});
  const [surveyMonth, setSurveyMonth] = useState<string>("");
  const [surveyDay, setSurveyDay] = useState<string>("");
  const [surveyName, setSurveyName] = useState<string>("");
  const [reportMemo, setReportMemo] = useState<string>("");
  const [reportWorkerName, setReportWorkerName] = useState<string>("김남관");

  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const date = new Date();
    setSurveyMonth(`${date.getMonth() + 1}`);
    setSurveyDay(`${date.getDate()}`);
  }, []);

  const handleSelectRadio = (questionId: number, optionNo: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionNo }));
  };

  const handleSubjectiveChange = (questionId: number, value: string) => {
    setSubjectiveAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

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
  };

  useEffect(() => {
    if (!isSignatureModalOpen) return;
    const timer = window.setTimeout(() => resizeCanvas(), 0);
    return () => window.clearTimeout(timer);
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
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const point = getCanvasPoint(e);
    if (!canvas || !ctx || !point) return;

    isDrawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
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
    const dataUrl = canvas.toDataURL("image/png");
    setSignatureDataUrl(dataUrl);
    setIsSignatureModalOpen(false);
  };

  const handleSubmitSurvey = () => {
    alert("설문이 저장되었습니다. (UI 테스트)");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950 pb-20">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="relative flex h-14 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="h-6 w-6 text-gray-800" />
          </button>

          <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">
            대상자 상세
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => alert("PDF 생성 모달 오픈 (UI 테스트)")}
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
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-bold">대상자 상세보기</h2>
              <p className="mt-1 text-sm text-gray-500">
                냉방기 클린UP 대상자 상세 정보입니다.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-gray-200 p-4">
              <h3 className="mb-3 text-base font-bold">개인/연락처 정보</h3>
              <div className="space-y-2">
                <DetailRow label="성명" value={item.name} />
                <DetailRow label="주민번호" value={maskRrn(item.rrn)} />
                <PhoneDetailRow label="휴대폰" value={item.phone} />
                <PhoneDetailRow label="대리인 연락처" value={item.proxyPhone} />
                <DetailRow label="도로명주소" value={item.roadAddress} />
                <DetailRow label="상세주소" value={item.detailAddress} />
              </div>
            </div>
          </div>
        </section>

        {/* 현장 사진 첨부 섹션 */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 space-y-2">
            <h2 className="text-lg font-bold">현장 사진 첨부</h2>
            <p className="text-sm text-gray-500">
              주소, 작업전, 작업중, 작업후 이미지를 각 1장씩 등록할 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {PHOTO_LABELS.map(({ key, label }) => {
              const imageSrc = previewUrls[key];

              return (
                <div key={key} className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900">{label}</h3>
                    <span className="text-xs text-gray-500">1장만 가능</span>
                  </div>

                  <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50">
                    {imageSrc ? (
                      <img src={imageSrc} alt={label} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-gray-400 gap-1">
                        <Camera size={24} />
                        <span className="text-xs">이미지가 없습니다.</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange(key)}
                      className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                    />
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={handleSavePhotos}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white active:scale-95 transition"
            >
              이미지 저장
            </button>

            {message && (
              <div className="rounded-xl px-4 py-3 text-sm border border-green-200 bg-green-50 text-green-700 font-bold">
                {message}
              </div>
            )}
          </div>
        </section>

        {/* 설문조사 섹션 */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 space-y-2">
            <h2 className="text-lg font-bold">설문조사</h2>
            <p className="text-sm text-gray-500">
              등록된 설문 문항에 응답할 수 있습니다.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="inline-block rounded-lg bg-yellow-100 px-3 py-2 text-base font-extrabold leading-tight">
              {survey.title}
            </div>

            <div className="mt-4 rounded-xl bg-gray-100 px-4 py-4 text-sm leading-7 text-gray-700">
              {survey.intro}
            </div>

            <div className="mt-6 space-y-6">
              {survey.questions.map((question, index) => (
                <div key={question.id}>
                  <div className="text-sm font-semibold leading-7 text-gray-900">
                    {index + 1}. {question.question}
                  </div>

                  {question.type === "multiple" ? (
                    <div className="mt-3 rounded-xl border border-gray-300 px-4 py-3">
                      <div className="space-y-2">
                        {question.options?.map((option) => (
                          <label key={option.id} className="flex items-start gap-2 text-sm text-gray-800 cursor-pointer">
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              className="mt-1 h-4 w-4"
                              checked={selectedAnswers[question.id] === option.optionNo}
                              onChange={() => handleSelectRadio(question.id, option.optionNo)}
                            />
                            <span>({option.optionNo}) {option.optionText}</span>
                          </label>
                        ))}
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

              {/* 메모 선택 셀렉트 */}
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

              {/* 서명 및 날짜 입력 */}
              <div className="mt-4 space-y-3 rounded-xl border border-gray-200 p-4">
                <input
                  type="text"
                  value={reportWorkerName}
                  onChange={(e) => setReportWorkerName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none"
                  placeholder="서비스담당"
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
                  placeholder="성명"
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
        </section>
      </main>

      {/* 서명 모달 */}
      {isSignatureModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
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

            <div className="p-4">
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
      )}
    </div>
  );
}