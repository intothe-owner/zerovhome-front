"use client";

import { useState, ChangeEvent, DragEvent, FormEvent, useMemo } from "react";
import { UploadCloud, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

// 백엔드 응답 타입 정의
interface UploadResponse {
  ok: boolean;
  message: string;
  fileName?: string;
  programYear?: number;
  listType?: string;
  totalRows?: number;
  savedRows?: number;
  errorCount?: number;
  errors?: string[];
}

export default function AdminExcelUploadUI() {
  // 폼 상태
  const [file, setFile] = useState<File | null>(null);
  const [programYear, setProgramYear] = useState<number>(2026);
  const [listType, setListType] = useState<string>("SELECTED");
  const [overwrite, setOverwrite] = useState<boolean>(true);
  const [dragActive, setDragActive] = useState(false);

  // 업로드 상태 및 결과 데이터
  const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [resultData, setResultData] = useState<UploadResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const acceptedText = useMemo(() => ".xls, .xlsx", []);

  // React Query Mutation 설정
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // API 경로: 백엔드 주소에 맞춰 수정이 필요할 수 있습니다 (예: process.env.NEXT_PUBLIC_API_BASE_URL + '/import/upload')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/import/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "업로드 중 서버 오류가 발생했습니다.");
      }

      return data as UploadResponse;
    },
    onMutate: () => {
      setUploadStatus("loading");
      setResultData(null);
      setErrorMessage("");
    },
    onSuccess: (data) => {
      setUploadStatus("success");
      setResultData(data);
    },
    onError: (error: Error) => {
      setUploadStatus("error");
      setErrorMessage(error.message);
    },
  });

  // 파일 선택 핸들러
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) return;
    setFile(selected);
  };

  // 드래그 앤 드롭 핸들러
  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0] ?? null;
    if (!dropped) return;
    setFile(dropped);
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  // 실제 업로드 실행 핸들러
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("업로드할 엑셀 파일을 선택해 주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("programYear", programYear.toString());
    formData.append("listType", listType);
    formData.append("overwrite", overwrite.toString());

    uploadMutation.mutate(formData);
  };

  // 공통 Input 클래스
  const inputClass = "w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 bg-white";

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">
      {/* 업로드 중 오버레이 */}
      {uploadStatus === "loading" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={48} />
            <p className="font-bold text-slate-700 text-lg">엑셀 데이터를 처리하고 있습니다...</p>
            <p className="text-sm text-slate-500">창을 닫지 말고 잠시만 기다려주세요.</p>
          </div>
        </div>
      )}

      {/* 헤더 타이틀 영역 */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">냉난방기 클린UP 엑셀 업로드</h2>
          <p className="text-sm text-slate-500 mt-1">
            백엔드 업로드 경로: <span className="font-semibold">/import/upload</span>
          </p>
        </div>

        {/* 상태 초기화 버튼 */}
        <button
          onClick={() => {
            setUploadStatus("idle");
            setFile(null);
            setResultData(null);
            uploadMutation.reset();
          }}
          className="text-sm text-slate-500 hover:text-slate-800 underline"
        >
          초기화 및 새 파일 업로드
        </button>
      </div>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block font-bold mb-1 text-sm text-slate-800">사업연도</label>
            <input
              type="number"
              value={programYear}
              onChange={(e) => setProgramYear(Number(e.target.value))}
              className={inputClass}
              min={2000}
              max={2100}
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-sm text-slate-800">명단 구분</label>
            <select
              value={listType}
              onChange={(e) => setListType(e.target.value)}
              className={inputClass}
            >
              <option value="SELECTED">선정자 (SELECTED)</option>
              <option value="WAITLIST">대기자 (WAITLIST)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold mb-1 text-sm text-slate-800">저장 방식</label>
            <select
              value={overwrite ? "true" : "false"}
              onChange={(e) => setOverwrite(e.target.value === "true")}
              className={inputClass}
            >
              <option value="true">기존 데이터 덮어쓰기</option>
              <option value="false">중복 시 업데이트</option>
            </select>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <label className="block font-bold mb-2 text-sm text-slate-800">엑셀 파일 첨부</label>
          {!file ? (
            <label
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors duration-200 ${
                dragActive
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-300 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <input type="file" accept={acceptedText} onChange={handleFileChange} className="hidden" />
              <UploadCloud size={32} className={`mb-3 ${dragActive ? "text-indigo-500" : "text-slate-400"}`} />
              <p className="text-sm font-bold text-slate-700">파일을 드래그하거나 클릭해서 업로드</p>
              <p className="text-xs text-slate-500 mt-1">지원 형식: {acceptedText}</p>
            </label>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-xl border border-indigo-200 bg-indigo-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
                  <FileSpreadsheet className="text-indigo-600" size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={uploadStatus === "loading" || !file}
          className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          <UploadCloud size={18} />
          {uploadStatus === "loading" ? "업로드 처리 중..." : "엑셀 데이터 업로드"}
        </button>
      </form>

      {/* 상태 요약 3분할 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className={`p-3 rounded-xl ${
            uploadStatus === "loading" ? "bg-amber-100 text-amber-600"
            : uploadStatus === "success" ? "bg-emerald-100 text-emerald-600"
            : uploadStatus === "error" ? "bg-red-100 text-red-600"
            : "bg-slate-100 text-slate-500"
          }`}>
            {uploadStatus === "success" ? <CheckCircle size={24} /> 
             : uploadStatus === "error" ? <AlertCircle size={24} /> 
             : <UploadCloud size={24} />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">업로드 상태</p>
            <p className="text-lg font-extrabold text-slate-800">
              {uploadStatus === "loading" ? "진행 중"
               : uploadStatus === "success" ? "처리 완료"
               : uploadStatus === "error" ? "처리 실패"
               : "대기 중"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <p className="text-sm font-bold text-slate-500">정상 저장 행</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-800">
            {uploadStatus === "success" ? (resultData?.savedRows?.toLocaleString() || 0) : 0}
            <span className="text-sm font-normal text-slate-400 ml-1">건</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <p className="text-sm font-bold text-slate-500">에러 발생 행</p>
          <p className="mt-1 text-2xl font-extrabold text-red-500">
            {uploadStatus === "success" ? (resultData?.errorCount?.toLocaleString() || 0) : 0}
            <span className="text-sm font-normal text-slate-400 ml-1">건</span>
          </p>
        </div>
      </div>

      {/* 결과 상세 영역 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-extrabold text-lg text-slate-800 mb-4">상세 결과 레포트</h3>

        {uploadStatus === "error" && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <span className="font-medium">{errorMessage || "업로드 중 오류가 발생했습니다."}</span>
          </div>
        )}

        {uploadStatus === "success" && resultData && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1">파일명</p>
                <p className="text-sm font-semibold text-slate-800 break-all">{resultData.fileName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1">사업연도</p>
                <p className="text-sm font-semibold text-slate-800">{resultData.programYear}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1">명단 구분</p>
                <p className="text-sm font-semibold text-slate-800">
                  {resultData.listType === "SELECTED" ? "선정자 (SELECTED)" : "대기자 (WAITLIST)"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1">전체 스캔 행</p>
                <p className="text-sm font-semibold text-slate-800">{resultData.totalRows}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-2">처리 결과 메시지</h4>
              <div className="bg-emerald-50 text-emerald-800 text-sm p-4 rounded-xl border border-emerald-100 font-medium">
                {resultData.message}
              </div>
            </div>

            {/* 에러 내역 */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-2">
                에러 로그 목록 <span className="text-slate-500 font-normal">({resultData.errors?.length || 0}건)</span>
              </h4>
              {(resultData.errors?.length ?? 0) > 0 ? (
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <ul className="space-y-2 text-sm text-red-600">
                    {resultData.errors?.map((error, index) => (
                      <li key={`error-${index}`} className="flex items-start gap-2 break-words">
                        <span className="text-red-400 font-bold shrink-0">·</span> {error}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  발견된 에러 내역이 없습니다.
                </div>
              )}
            </div>
          </div>
        )}

        {uploadStatus === "idle" && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500 flex flex-col items-center">
            <FileSpreadsheet size={32} className="text-slate-300 mb-3" />
            아직 업로드된 내역이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}