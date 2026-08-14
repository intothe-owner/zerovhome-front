"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Upload, ImageIcon } from "lucide-react";

export default function SiteSettingsPage() {
  const [formData, setFormData] = useState({
    siteName: "",
    metaKeywords: "",
    metaDescription: "",
    companyName: "",
    address: "",
    contactNumber: "",
    displayMode: "RESPONSIVE",
    themeMode: "LIGHT",
    nightModeStartTime: "18:00",
    nightModeEndTime: "06:00",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [faviconPreview, setFaviconPreview] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 데이터 불러오기
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/settings`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const s = (val: string | null) => val || "";
          setFormData({
            siteName: s(json.data.siteName),
            metaKeywords: s(json.data.metaKeywords),
            metaDescription: s(json.data.metaDescription),
            companyName: s(json.data.companyName),
            address: s(json.data.address),
            contactNumber: s(json.data.contactNumber),
            displayMode: json.data.displayMode || "RESPONSIVE",
            themeMode: json.data.themeMode || "LIGHT",
            nightModeStartTime: json.data.nightModeStartTime ? json.data.nightModeStartTime.substring(0, 5) : "18:00",
            nightModeEndTime: json.data.nightModeEndTime ? json.data.nightModeEndTime.substring(0, 5) : "06:00",
          });
          if (json.data.logoUrl) setLogoPreview(json.data.logoUrl);
          if (json.data.faviconUrl) setFaviconPreview(json.data.faviconUrl);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "favicon") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    if (type === "logo") {
      setLogoFile(file);
      setLogoPreview(previewUrl);
    } else {
      setFaviconFile(file);
      setFaviconPreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const submitData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      submitData.append(key, value);
    });

    if (logoFile) submitData.append("logo", logoFile);
    if (faviconFile) submitData.append("favicon", faviconFile);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/settings`, {
        method: "PUT",
        body: submitData,
      });
      if (res.ok) alert("사이트 설정이 성공적으로 저장되었습니다.");
      else alert("저장 실패!");
    } catch (error) {
      alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="flex h-64 items-center justify-center text-indigo-600">
      <Loader2 className="animate-spin mr-2" size={24} /> 데이터를 불러오는 중...
    </div>
  );

  const inputClass = "w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1.5";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-slate-900">사이트 설정</h2>
        <p className="text-sm text-slate-500 mt-1">웹사이트의 기본 정보, 메타태그, 회사정보 및 디자인 테마를 관리합니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* 1. 기본 정보 및 SEO */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-800">1. 기본 정보 및 SEO</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className={labelClass}>사이트명 <span className="text-red-500">*</span></label>
              <input type="text" name="siteName" value={formData.siteName} onChange={handleChange} required className={inputClass} placeholder="예: ZeroV 통합 플랫폼" />
            </div>
            <div>
              <label className={labelClass}>메타태그 키워드 (Keywords)</label>
              <input type="text" name="metaKeywords" value={formData.metaKeywords} onChange={handleChange} placeholder="웹제작, CMS, 관리솔루션" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>메타태그 설명 (Description)</label>
              <input type="text" name="metaDescription" value={formData.metaDescription} onChange={handleChange} placeholder="사이트 요약 설명" className={inputClass} />
            </div>
          </div>
        </div>

        {/* 2. 회사 정보 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-800">2. 회사 정보</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>회사명 (상호)</label>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className={inputClass} placeholder="인투더 (IntoThe)" />
            </div>
            <div>
              <label className={labelClass}>대표 연락처</label>
              <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className={inputClass} placeholder="02-000-0000" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>회사 주소</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputClass} placeholder="서울특별시 강남구..." />
            </div>
          </div>
        </div>

        {/* 3. 디자인 및 테마 설정 (로고, 파비콘, 디스플레이, 테마 모드) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-800">3. 디자인 및 테마 설정</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* 로고 파일 첨부 */}
            <div>
              <label className={labelClass}>로고 이미지</label>
              <div className="mt-2 flex items-center gap-4">
                <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="로고 미리보기" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <ImageIcon className="text-slate-400" size={32} />
                  )}
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                    <Upload size={16} /> 파일 선택
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "logo")} />
                  </label>
                  <p className="mt-2 text-xs text-slate-500">권장: PNG, SVG</p>
                </div>
              </div>
            </div>

            {/* 파비콘 파일 첨부 */}
            <div>
              <label className={labelClass}>파비콘 이미지</label>
              <div className="mt-2 flex items-center gap-4">
                <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 overflow-hidden">
                  {faviconPreview ? (
                    <img src={faviconPreview} alt="파비콘 미리보기" className="w-12 h-12 object-contain" />
                  ) : (
                    <ImageIcon className="text-slate-400" size={32} />
                  )}
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                    <Upload size={16} /> 파일 선택
                    <input type="file" accept=".ico,.png" className="hidden" onChange={(e) => handleFileChange(e, "favicon")} />
                  </label>
                  <p className="mt-2 text-xs text-slate-500">권장: 32x32px (ICO, PNG)</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 border-t border-slate-100 pt-2"></div>

            {/* 화면 표시 모드 (4가지 모두 반영) */}
            <div>
              <label className={labelClass}>화면 표시 모드 (Display Mode)</label>
              <select name="displayMode" value={formData.displayMode} onChange={handleChange} className={inputClass}>
                <option value="RESPONSIVE">반응형 (RESPONSIVE)</option>
                <option value="PC_ONLY">PC 화면 고정 (PC_ONLY)</option>
                <option value="MOBILE_ONLY">모바일 화면 고정 (MOBILE_ONLY)</option>
                <option value="ADAPTIVE">적응형 PC/모바일 분리 (ADAPTIVE)</option>
              </select>
            </div>

            {/* 테마 모드 (4가지 모두 반영: LIGHT, DARK, AUTO_TIME, MENUAL) */}
            <div>
              <label className={labelClass}>테마 모드 (Theme Mode)</label>
              <select name="themeMode" value={formData.themeMode} onChange={handleChange} className={inputClass}>
                <option value="LIGHT">라이트 모드 (LIGHT)</option>
                <option value="DARK">다크 모드 (DARK)</option>
                <option value="AUTO_TIME">시간에 따라 자동 전환 (AUTO_TIME)</option>
                <option value="MENUAL">수동 선택 (MENUAL)</option>
              </select>
            </div>

            {/* 자동 시간 설정 선택 시에만 노출 */}
            {formData.themeMode === "AUTO_TIME" && (
              <div className="md:col-span-2 flex gap-6 p-5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-indigo-900 mb-1">야간 모드 시작 시간</label>
                  <input type="time" name="nightModeStartTime" value={formData.nightModeStartTime} onChange={handleChange} className={inputClass} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-indigo-900 mb-1">야간 모드 종료 시간</label>
                  <input type="time" name="nightModeEndTime" value={formData.nightModeEndTime} onChange={handleChange} className={inputClass} />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end pt-2 pb-10">
          <button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-indigo-500/30 disabled:opacity-70">
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? "저장 중..." : "설정 저장하기"}
          </button>
        </div>
      </form>
    </div>
  );
}