"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, List, Award, FileText, Image as ImageIcon, UploadCloud, Loader2 } from "lucide-react";

export default function CertificationManager() {
  const [certifications, setCertifications] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"LIST" | "FORM">("LIST");
  const [isEditing, setIsEditing] = useState(false);
  
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // ✨ 로딩 및 업로드 진행률 상태 추가
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const initialForm = {
    id: null, 
    title: "", 
    issuer: "", 
    issueDate: "", 
    description: "", 
    isActive: true, 
    imageUrl: ""
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchCertifications = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/certifications`);
      const json = await res.json();
      if (json.success) setCertifications(json.data);
    } catch (error) {
      console.error("인증서 목록 로딩 실패:", error);
    }
  };

  useEffect(() => { fetchCertifications(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditing && !file) {
      alert("인증서 파일을 첨부해주세요.");
      return;
    }

    const submitData = new FormData();
    
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && key !== 'imageUrl' && key !== 'id') {
        submitData.append(key, String(value));
      }
    });

    if (file) submitData.append("file", file);

    const url = isEditing 
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/certifications/${formData.id}` 
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/certifications`;
      
    const method = isEditing ? "PUT" : "POST";

    // 💡 Fetch 대신 XMLHttpRequest(XHR)를 사용하여 업로드 진행률 추적
    setIsSubmitting(true);
    setUploadProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);

    // 진행률 업데이트 이벤트
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
      }
    };

    // 요청 성공 완료 시
    xhr.onload = () => {
      setIsSubmitting(false);
      setUploadProgress(100);
      
      if (xhr.status >= 200 && xhr.status < 300) {
        alert("저장되었습니다.");
        setViewMode("LIST");
        fetchCertifications();
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          alert(`저장 실패: ${err.message || '알 수 없는 오류'}`);
        } catch (parseError) {
          alert("저장 실패: 서버 오류가 발생했습니다.");
        }
      }
    };

    // 통신 에러 발생 시
    xhr.onerror = () => {
      setIsSubmitting(false);
      console.error("저장 중 오류 발생");
      alert("서버와 통신 중 오류가 발생했습니다.");
    };

    // 데이터 전송 시작
    xhr.send(submitData);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까? (연결된 파일도 함께 삭제됩니다)")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/certifications/${id}`, { method: "DELETE" });
      if (res.ok) fetchCertifications();
    } catch (error) {
      console.error("삭제 실패:", error);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (droppedFile.type === "application/pdf" || droppedFile.type.startsWith("image/")) {
        setFile(droppedFile);
      } else {
        alert("PDF 또는 이미지 파일만 첨부 가능합니다.");
      }
    }
  };

  const inputClass = "w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Award className="text-indigo-600" size={28} />
            인증·인허가 관리
          </h2>
          <p className="text-sm text-slate-500 mt-1">기업의 주요 인증서, 인허가증, 특허증 등을 등록하고 관리합니다.</p>
        </div>
        <button 
          onClick={() => {
            if (viewMode === "FORM") { 
              setViewMode("LIST"); 
            } else { 
              setFormData(initialForm); 
              setIsEditing(false); 
              setFile(null); 
              setViewMode("FORM"); 
            }
          }}
          disabled={isSubmitting} // 등록 중일 때 뒤로가기 버튼 비활성화
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {viewMode === "FORM" ? <List size={16}/> : <Plus size={16}/>}
          {viewMode === "FORM" ? "목록으로" : "새 인증서 등록"}
        </button>
      </div>

      {viewMode === "LIST" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold w-24 text-center">이미지</th>
                <th className="p-4 font-bold">인증·인허가명</th>
                <th className="p-4 font-bold">발급기관</th>
                <th className="p-4 font-bold">발급일자</th>
                <th className="p-4 font-bold text-center">상태</th>
                <th className="p-4 font-bold text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {certifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    등록된 인증·인허가 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                certifications.map(cert => (
                  <tr key={cert.id} className="border-b border-slate-100 hover:bg-slate-50 align-middle">
                    <td className="p-4 text-center">
                      {cert.imageUrl ? (
                        <div className="w-16 h-16 rounded border bg-white flex items-center justify-center overflow-hidden mx-auto shadow-sm">
                          <img src={cert.imageUrl} alt={cert.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded border bg-slate-100 text-slate-300 flex items-center justify-center mx-auto">
                          <ImageIcon size={24} />
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-bold text-slate-800">{cert.title}</td>
                    <td className="p-4 text-slate-600">{cert.issuer || '-'}</td>
                    <td className="p-4 text-slate-600">{cert.issueDate || '-'}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cert.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        {cert.isActive ? '노출' : '숨김'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => { 
                          setFormData({...cert}); 
                          setIsEditing(true); 
                          setViewMode("FORM"); 
                        }} className="text-indigo-600 hover:text-indigo-800 transition"><Edit2 size={18}/></button>
                        <button onClick={() => handleDelete(cert.id)} className="text-red-500 hover:text-red-700 transition"><Trash2 size={18}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === "FORM" && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6 relative">
          
          {/* 전송 중 폼을 희미하게 만들고 클릭 방지 레이어 덮기 */}
          {isSubmitting && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 rounded-2xl cursor-not-allowed"></div>
          )}

          <div className="grid grid-cols-2 gap-6 relative z-0">
            {/* 인증명 */}
            <div className="col-span-2 md:col-span-1">
              <label className="block font-bold mb-1.5 text-slate-800">인증 및 인허가명 <span className="text-red-500">*</span></label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className={inputClass} placeholder="예: 벤처기업확인서, ISO9001" disabled={isSubmitting} />
            </div>

            {/* 발급기관 */}
            <div className="col-span-2 md:col-span-1">
              <label className="block font-bold mb-1.5 text-slate-800">발급 기관</label>
              <input type="text" value={formData.issuer} onChange={e => setFormData({...formData, issuer: e.target.value})} className={inputClass} placeholder="예: 중소벤처기업부" disabled={isSubmitting} />
            </div>

            {/* 발급일자 */}
            <div className="col-span-2 md:col-span-1">
              <label className="block font-bold mb-1.5 text-slate-800">발급 일자</label>
              <input type="date" value={formData.issueDate} onChange={e => setFormData({...formData, issueDate: e.target.value})} className={inputClass} disabled={isSubmitting} />
            </div>

            {/* 노출 여부 */}
            <div className="col-span-2 md:col-span-1 flex items-center mt-7">
              <label className={`flex items-center gap-2 font-bold ${isSubmitting ? 'text-slate-400 cursor-not-allowed' : 'text-emerald-600 cursor-pointer'}`}>
                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-5 h-5 accent-emerald-500" disabled={isSubmitting} />
                사용자 페이지에 노출하기
              </label>
            </div>

            {/* 상세 설명 */}
            <div className="col-span-2">
              <label className="block font-bold mb-1.5 text-slate-800">상세 설명 및 비고</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className={inputClass} placeholder="추가적인 설명이 필요하다면 입력해주세요." disabled={isSubmitting}></textarea>
            </div>

            {/* 파일 첨부 영역 */}
            <div className="col-span-2">
              <label className="block font-bold mb-2 text-slate-800">인증서 파일 첨부 <span className="text-red-500">*</span></label>
              <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                <FileText size={14}/> 
                PDF 파일을 업로드하면 서버에서 <b>자동으로 고화질 이미지로 변환</b>하여 최적화된 형태로 저장합니다.
              </p>

              <div 
                className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all duration-200 ${
                  isDragging 
                    ? "bg-indigo-50 border-indigo-500" 
                    : "bg-slate-50 border-slate-300 hover:bg-slate-100"
                } ${isSubmitting ? "opacity-50 pointer-events-none" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  id="fileDropzone"
                  accept="application/pdf, image/*" 
                  onChange={e => setFile(e.target.files?.[0] || null)} 
                  className="hidden" 
                  disabled={isSubmitting}
                />
                <label htmlFor="fileDropzone" className="flex flex-col items-center cursor-pointer w-full h-full text-center">
                  <UploadCloud size={40} className={`mb-3 ${isDragging ? "text-indigo-600" : "text-slate-400"}`} />
                  <span className="font-bold text-slate-700 text-sm mb-1">
                    클릭하여 파일을 선택하거나 이곳으로 드래그 하세요
                  </span>
                  <span className="text-xs text-slate-500">지원 형식: PDF, JPG, PNG, GIF</span>
                </label>
              </div>

              {/* 업로드된 파일 표시 */}
              {file ? (
                <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="text-indigo-600" size={24} />
                    <div>
                      <p className="text-sm font-bold text-indigo-900">{file.name}</p>
                      <p className="text-xs text-indigo-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  {!isSubmitting && (
                    <button type="button" onClick={() => setFile(null)} className="text-red-500 hover:text-red-700 font-bold text-sm bg-white px-3 py-1.5 rounded border border-red-200">
                      삭제
                    </button>
                  )}
                </div>
              ) : formData.imageUrl && (
                <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200 inline-block">
                  <p className="text-xs font-bold text-slate-500 mb-2">현재 등록된 이미지</p>
                  <img src={formData.imageUrl} className="h-40 rounded border object-contain bg-white shadow-sm" alt="현재 등록된 인증서" />
                </div>
              )}
            </div>
          </div>

          {/* ✨ 제출 버튼 및 프로그레스 바 래퍼 */}
          <div className="mt-8 relative z-20">
            {/* 프로그레스 바 (제출 중일 때만 표시) */}
            {isSubmitting && (
              <div className="w-full bg-slate-100 rounded-full h-2.5 mb-4 border border-slate-200 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-3 font-bold py-3.5 rounded-lg transition text-lg ${
                isSubmitting 
                  ? "bg-slate-400 text-white cursor-not-allowed" 
                  : "bg-slate-900 text-white hover:bg-black"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>{isEditing ? "수정 중..." : "등록 중..."} {uploadProgress}%</span>
                </>
              ) : (
                isEditing ? "인증서 정보 수정하기" : "새 인증서 등록하기"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}