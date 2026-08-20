"use client";

import { ChangeEvent, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Phone, Camera, Loader2, FileText, Download } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// --- Utility Functions ---
type ReportCategory = "AIR_CONDITIONER" | "AIR_PURIFIER";

type PhotoFieldKey = "entranceImage" | "workImage1" | "workImage2" | "beforeImage1" | "afterImage1" | "beforeImage2" | "afterImage2";

const PHOTO_FIELDS: { key: PhotoFieldKey; label: string; fullWidth?: boolean }[] = [
  { key: "entranceImage", label: "입구 전경", fullWidth: true },
  { key: "workImage1", label: "작업 진행 사진 1" },
  { key: "workImage2", label: "작업 진행 사진 2" },
  { key: "beforeImage1", label: "작업 전 (Set 1)" },
  { key: "afterImage1", label: "작업 후 (Set 1)" },
  { key: "beforeImage2", label: "작업 전 (Set 2)" },
  { key: "afterImage2", label: "작업 후 (Set 2)" },
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
        <a href={`tel:${value}`} className={`ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all active:scale-90 ${isGreen ? "bg-green-100 text-green-600 shadow-sm" : "bg-blue-100 text-blue-600 shadow-sm"}`}>
          <Phone size={18} />
        </a>
      )}
    </div>
  );
}

export default function SeniorCenterDetail() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = Number(Array.isArray(params?.id) ? params.id[0] : params?.id);

  // 1. 상세 정보 조회 (React Query)[cite: 9]
  const { data: item, isLoading, isError, error } = useQuery({
    queryKey: ["senior-detail", id],
    queryFn: async () => {
      const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/senior/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  const [activePhotoTab, setActivePhotoTab] = useState<ReportCategory>("AIR_CONDITIONER");
  const [message, setMessage] = useState<string>("");
  const [workName, setWorkName] = useState<string>("");

  useEffect(() => {
    if (item?.workName) setWorkName(item.workName);
  }, [item?.workName]);

  // 2. 사진 상태 및 업로드 (React Query)[cite: 8]
  const uploadPhotosMutation = useMutation({
    mutationFn: async ({ category, fieldName, file }: { category: ReportCategory, fieldName: string, file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fieldName", fieldName);

      const { data } = await axios.put(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/senior-centers/${id}/reports/${category}/photos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      setMessage("사진이 업로드되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["senior-detail", id] });
    },
    onError: (err: any) => {
      setMessage(err.response?.data?.message || "사진 저장에 실패했습니다.");
    }
  });

  const handleFileChange = (category: ReportCategory, fieldName: PhotoFieldKey) => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setMessage("");
    uploadPhotosMutation.mutate({ category, fieldName, file });
  };

  // 3. 보고서 다운로드 (모달 상태)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState("노인장애인 복지과");
  const [pdfLoading, setPdfLoading] = useState<Record<ReportCategory, boolean>>({ AIR_CONDITIONER: false, AIR_PURIFIER: false });

  // PDF 생성 및 다운로드 API (앱 브릿지 호환)[cite: 8]
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

  const handleGeneratePdf = async (category: ReportCategory) => {
    if (!item?.id) return;
    setPdfLoading(prev => ({ ...prev, [category]: true }));

    try {
      const queryParams = new URLSearchParams();
      queryParams.append("org", selectedOrg);
      if (workName) queryParams.append("workName", workName);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/senior-centers/${id}/reports/${category}/pdf?${queryParams.toString()}`);
      
      if (!res.ok) throw new Error("PDF 다운로드에 실패했습니다.");

      const blob = await res.blob();
      const fileName = `${selectedOrg}_${item.name}_${category === "AIR_CONDITIONER" ? "에어컨" : "공기청정기"}_작업보고서.pdf`;
      await downloadBlobFile(blob, fileName);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || "PDF 다운로드 실패");
    } finally {
      setPdfLoading(prev => ({ ...prev, [category]: false }));
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
  }

  if (isError || !item) {
    return <div className="p-10 text-center text-red-500">데이터를 불러오지 못했습니다.</div>;
  }

  const isCanceled = item.isCancel;
  const currentImages = activePhotoTab === "AIR_CONDITIONER" ? (item.acReportImages || {}) : (item.purifierReportImages || {});

  return (
    <div className="min-h-screen bg-gray-50 pb-36 text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur px-4 h-14 flex items-center justify-between">
        <button onClick={() => router.back()}><ChevronLeft className="h-6 w-6 text-gray-800" /></button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">경로당 상세정보</h1>
        <div className="w-6" />
      </header>

      <main className="mx-auto w-full max-w-md px-4 py-6 space-y-6">
        {isCanceled && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-red-700 font-bold text-sm">
            취소된 작업입니다. 수정할 수 없습니다.
          </div>
        )}

        <section className={`space-y-3 ${isCanceled ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">경로당 기본 정보</h2>
          </div>
          <DetailRow label="경로당명" value={item.name} />
          <DetailRow label="행정동 / 연번" value={`${item.dong || "-"} / NO.${item.seq}`} />
          <DetailRow label="도로명 주소" value={item.roadAddress} />
          <PhoneDetailRow label="경로당 전화번호" value={item.centerPhone} color="blue" />
          <div className="grid grid-cols-2 gap-3">
            <DetailRow label="면적" value={item.area ? `${item.area}㎡` : "-"} />
            <DetailRow label="작업일자" value={`${item.programYear}년`} />
          </div>
          <DetailRow label="기기 설치 현황" value={
            <div className="flex gap-2 flex-wrap mt-1">
              <span className="bg-white border border-gray-200 px-2 py-1.5 rounded-lg text-[11px]">천장형: {item.acCeilingCount || 0}</span>
              <span className="bg-white border border-gray-200 px-2 py-1.5 rounded-lg text-[11px]">스탠드: {item.acStandCount || 0}</span>
              <span className="bg-white border border-gray-200 px-2 py-1.5 rounded-lg text-[11px]">벽걸이: {item.acWallCount || 0}</span>
              <span className="bg-purple-50 border border-purple-100 text-purple-700 px-2 py-1.5 rounded-lg text-[11px] font-bold">공기청정기: {item.airPurifierCount || 0}</span>
            </div>
          } />
          <DetailRow label="담당자 성명" value={item.managerName || "-"} />
          <PhoneDetailRow label="담당자 연락처" value={item.managerPhone} color="green" />

          {/* 작업자 이름 입력 필드 */}
          <div className="rounded-xl bg-gray-50 px-4 py-3 border border-gray-100 mt-2">
            <label htmlFor="worker-name" className="text-xs font-bold text-gray-600">작업자 이름 (보고서 출력용)</label>
            <input
              id="worker-name"
              type="text"
              value={workName}
              onChange={(e) => setWorkName(e.target.value)}
              placeholder="예: 홍길동"
              className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm outline-none focus:border-blue-500"
            />
          </div>
        </section>

        {/* 현장 사진 업로드 */}
        {!isCanceled && (
          <section className="mt-8 border-t border-gray-100 pt-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">현장 사진 관리</h2>
              <p className="mt-1 text-xs text-gray-500">카테고리별로 현장 사진을 업로드하세요. (자동저장)</p>
            </div>

            <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
              <button onClick={() => setActivePhotoTab("AIR_CONDITIONER")} className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${activePhotoTab === "AIR_CONDITIONER" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                에어컨
              </button>
              <button onClick={() => setActivePhotoTab("AIR_PURIFIER")} className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${activePhotoTab === "AIR_PURIFIER" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                공기청정기
              </button>
            </div>

            {message && <div className="mb-4 rounded-xl px-4 py-3 text-sm border border-blue-200 bg-blue-50 text-blue-700 font-bold">{message}</div>}

            <div className="grid grid-cols-2 gap-4">
              {PHOTO_FIELDS.map((field) => {
                const url = currentImages[field.key];
                return (
                  <div key={field.key} className={field.fullWidth ? "col-span-2" : ""}>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <p className="text-xs font-bold text-gray-700">{field.label}</p>
                      </div>
                      <div className="relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
                        {url ? (
                          <img src={url} alt={field.label} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center text-gray-400 gap-1">
                            <Camera size={24} />
                            <span className="text-[10px] font-bold">사진 선택</span>
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleFileChange(activePhotoTab, field.key)} className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* 하단 고정 액션 버튼 */}
      {!isCanceled && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/95 pb-safe backdrop-blur-md">
          <div className="mx-auto flex max-w-md flex-col gap-2 px-4 py-3">
            <div className="flex gap-2 w-full">
              <button onClick={() => setIsModalOpen(true)} disabled={pdfLoading["AIR_CONDITIONER"]} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition active:scale-95 disabled:bg-gray-300">
                {pdfLoading["AIR_CONDITIONER"] ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                에어컨 보고서
              </button>
              
              <button onClick={() => handleGeneratePdf("AIR_PURIFIER")} disabled={pdfLoading["AIR_PURIFIER"]} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-blue-600 bg-white py-3 text-sm font-bold text-blue-600 transition active:scale-95 disabled:border-gray-300 disabled:text-gray-400">
                {pdfLoading["AIR_PURIFIER"] ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                공기청정기 보고서
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 에어컨 보고서 기관 선택 모달창 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">기관 선택</h3>
              <p className="text-xs text-gray-500 mt-1">{item.name} - 에어컨 보고서</p>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">제출할 기관을 선택해주세요</label>
              <select value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-bold text-gray-700 focus:border-blue-500 outline-none bg-white">
                <option value="노인장애인 복지과">노인장애인 복지과</option>
                <option value="해운대구청">해운대구청</option>
              </select>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">취소</button>
              <button type="button" onClick={() => handleGeneratePdf("AIR_CONDITIONER")} disabled={pdfLoading["AIR_CONDITIONER"]} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400">
                {pdfLoading["AIR_CONDITIONER"] ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                다운로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}