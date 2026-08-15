"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, List, Save, Settings, X } from "lucide-react";

interface ExtraField {
  fieldName: string;
  inputType: "text" | "number" | "url" | "email" | "radio" | "checkbox" | "select";
  options: string; 
}

interface BoardConfig {
  id: number;
  tableName: string;
  boardName: string;
  boardType: "GENERAL" | "GALLERY" | "FAQ";
  categories: string; 
  listCount: number;
  pageSize: number;
  readLevel: number;
  writeLevel: number;
  deleteLevel: number;
  useComment: boolean;
  commentWriteLevel: number;
  showOnMain: boolean;
  exposureOrder: number;
  useCaptcha: boolean;
  useExtraFields: boolean;
  extraFields: ExtraField[]; 
  galleryCols: number;
  galleryRows: number;
  useVideo: boolean;
  videoAutoPlay: boolean;
  mainExposureCount: number;
  fileUploadCount: number;
  useEditor: boolean;
  // ✨ 신규: 푸시 알림 사용 여부 필드 추가
  usePush: boolean; 
}

const initialFormState: Partial<BoardConfig> = {
  tableName: "", boardName: "", boardType: "GENERAL", categories: "", 
  listCount: 10, pageSize: 10, readLevel: 1, writeLevel: 1, deleteLevel: 1,
  useComment: false, commentWriteLevel: 1, showOnMain: false, exposureOrder: 0,
  useCaptcha: true, useExtraFields: false, extraFields: [], 
  galleryCols: 3, galleryRows: 3, useVideo: false, videoAutoPlay: false,
  mainExposureCount: 5, fileUploadCount: 2, useEditor: true,
  // ✨ 신규: 푸시 알림 기본값 설정
  usePush: false, 
};

export default function BoardConfigManager() {
  const [configs, setConfigs] = useState<BoardConfig[]>([]);
  const [viewMode, setViewMode] = useState<"LIST" | "FORM">("LIST");
  const [formData, setFormData] = useState<Partial<BoardConfig>>(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/board-configs`);
      const json = await res.json();
      if (json.success) setConfigs(json.data);
    } catch (error) {
      console.error("게시판 설정 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfigs(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      const isNumberField = ['listCount', 'pageSize', 'readLevel', 'writeLevel', 'deleteLevel', 'commentWriteLevel', 'galleryCols', 'galleryRows', 'mainExposureCount', 'fileUploadCount', 'exposureOrder'].includes(name);
      setFormData(prev => ({ ...prev, [name]: isNumberField ? Number(value) : value }));
    }
  };

  const handleAddExtraField = () => {
    setFormData(prev => ({ ...prev, extraFields: [...(prev.extraFields || []), { fieldName: "", inputType: "text", options: "" }] }));
  };

  const handleExtraFieldChange = (index: number, key: keyof ExtraField, value: string) => {
    setFormData(prev => {
      const newFields = [...(prev.extraFields || [])];
      newFields[index] = { ...newFields[index], [key]: value };
      return { ...prev, extraFields: newFields };
    });
  };

  const handleRemoveExtraField = (index: number) => {
    setFormData(prev => {
      const newFields = [...(prev.extraFields || [])];
      newFields.splice(index, 1);
      return { ...prev, extraFields: newFields };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/board-configs/${formData.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/board-configs`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        alert(isEditing ? "수정되었습니다." : "생성되었습니다.");
        setViewMode("LIST");
        fetchConfigs();
      } else { alert("오류: " + json.message); }
    } catch (error) { alert("서버와 통신 중 오류가 발생했습니다."); } 
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 이 게시판 설정을 삭제하시겠습니까? (관련 게시물도 삭제될 수 있습니다)")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/board-configs/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        alert("삭제되었습니다.");
        fetchConfigs();
      }
    } catch (error) { alert("삭제 중 오류가 발생했습니다."); }
  };

  const openCreateForm = () => { setFormData(initialFormState); setIsEditing(false); setViewMode("FORM"); };
  const openEditForm = (config: BoardConfig) => { setFormData({ ...config, extraFields: config.extraFields || [] }); setIsEditing(true); setViewMode("FORM"); };

  const inputClass = "w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm disabled:bg-slate-100 disabled:text-slate-500 cursor-pointer";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1.5";

  const renderLevelOptions = () => {
    const options = [];
    options.push(<option key={1} value={1}>Level 1 (비회원 가능)</option>);
    for (let i = 2; i <= 10; i++) { options.push(<option key={i} value={i}>Level {i} 이상</option>); }
    return options;
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">게시판 환경 설정</h2>
          <p className="text-sm text-slate-500 mt-1">사이트 내 다양한 게시판의 종류, 세부 권한 및 기능을 상세하게 관리합니다.</p>
        </div>
        <div className="flex-shrink-0">
          {viewMode === "FORM" ? (
            <button onClick={() => setViewMode("LIST")} className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition"><List size={16} /> 목록으로 돌아가기</button>
          ) : (
            <button onClick={openCreateForm} className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-bold shadow-md transition"><Plus size={16} /> 새 게시판 만들기</button>
          )}
        </div>
      </div>

      {viewMode === "LIST" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <th className="py-3.5 px-4 font-bold text-center w-16">No</th>
                  <th className="py-3.5 px-4 font-bold text-left">게시판 이름</th>
                  <th className="py-3.5 px-4 font-bold text-center">타입</th>
                  <th className="py-3.5 px-4 font-bold text-center">메인 노출 (순서)</th>
                  <th className="py-3.5 px-4 font-bold text-center">읽기/쓰기/삭제 권한</th>
                  <th className="py-3.5 px-4 font-bold text-center w-32">관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-10 text-center text-slate-500 font-bold">데이터를 불러오는 중입니다...</td></tr>
                ) : configs.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-slate-500 font-bold">생성된 게시판이 없습니다.</td></tr>
                ) : (
                  configs.map((config, index) => (
                    <tr key={config.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 text-center text-slate-400 font-medium">{index + 1}</td>
                      <td className="py-4 px-4 font-bold text-slate-800">{config.boardName}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold ${config.boardType === 'GALLERY' ? 'bg-emerald-100 text-emerald-700' : config.boardType === 'FAQ' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>{config.boardType}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {config.showOnMain ? <span className="text-blue-600 font-bold">노출됨 (순서: {config.exposureOrder})</span> : <span className="text-slate-400">비노출</span>}
                      </td>
                      <td className="py-4 px-4 text-center text-slate-500 text-xs font-medium">Lv.{config.readLevel} / Lv.{config.writeLevel} / Lv.{config.deleteLevel}</td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => openEditForm(config)} className="p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition" title="수정"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(config.id)} className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-md transition" title="삭제"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === "FORM" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">1. 기본 정보</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>게시판 아이디 (영문)</label>
                <input type="text" name="tableName" required value={formData.tableName} onChange={handleChange} disabled={isEditing} placeholder="예: notice" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm disabled:bg-slate-100 disabled:text-slate-500" />
              </div>
              <div>
                <label className={labelClass}>게시판 이름</label>
                <input type="text" name="boardName" required value={formData.boardName} onChange={handleChange} placeholder="예: 자유게시판" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
              </div>
              <div>
                <label className={labelClass}>게시판 타입</label>
                <select name="boardType" value={formData.boardType} onChange={handleChange} className={inputClass}>
                  <option value="GENERAL">일반 게시판 (목록형)</option>
                  <option value="GALLERY">갤러리 게시판 (이미지 중심)</option>
                  <option value="FAQ">FAQ 게시판 (토글형)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>카테고리</label>
                <input type="text" name="categories" value={formData.categories || ""} onChange={handleChange} placeholder="예: 공지,이벤트,일반 (쉼표로 구분)" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">2. 메인 페이지 노출 및 권한 설정</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="md:col-span-3 flex flex-wrap items-center gap-6 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="showOnMain" checked={formData.showOnMain} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                  <span className="text-sm font-bold text-slate-800">메인 화면에 노출</span>
                </label>
                {formData.showOnMain && (
                  <>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-bold text-slate-700">노출 순서 (낮을수록 위)</label>
                      <input type="number" name="exposureOrder" value={formData.exposureOrder} onChange={handleChange} className="w-20 border border-slate-300 rounded-lg p-1.5 text-sm text-center" />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-bold text-slate-700">메인 노출 개수</label>
                      <input type="number" name="mainExposureCount" min="1" max="20" value={formData.mainExposureCount} onChange={handleChange} className="w-20 border border-slate-300 rounded-lg p-1.5 text-sm text-center" />
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className={labelClass}>읽기 권한</label>
                <select name="readLevel" value={formData.readLevel} onChange={handleChange} className={inputClass}>{renderLevelOptions()}</select>
              </div>
              <div>
                <label className={labelClass}>쓰기 권한</label>
                <select name="writeLevel" value={formData.writeLevel} onChange={handleChange} className={inputClass}>{renderLevelOptions()}</select>
              </div>
              <div>
                <label className={labelClass}>삭제 권한</label>
                <select name="deleteLevel" value={formData.deleteLevel} onChange={handleChange} className={inputClass}>{renderLevelOptions()}</select>
              </div>
              <div>
                <label className={labelClass}>페이지당 목록 수</label>
                <input type="number" name="listCount" min="1" max="100" value={formData.listCount} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
              </div>
              <div>
                <label className={labelClass}>페이징 사이즈</label>
                <input type="number" name="pageSize" min="1" max="20" value={formData.pageSize} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">3. 기능 및 첨부파일 설정</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="useEditor" checked={formData.useEditor} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                  <span className="text-sm font-bold text-slate-700">에디터 사용 여부 (WYSIWYG 및 이미지 첨부)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="useComment" checked={formData.useComment} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                  <span className="text-sm font-bold text-slate-700">댓글 사용 여부</span>
                </label>
                {formData.useComment && (
                  <div className="pl-6">
                    <label className={labelClass}>댓글 쓰기 권한</label>
                    <select name="commentWriteLevel" value={formData.commentWriteLevel} onChange={handleChange} className={inputClass}>
                      {renderLevelOptions()}
                    </select>
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="useCaptcha" checked={formData.useCaptcha} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                  <span className="text-sm font-bold text-slate-700">비회원 자동등록방지 (Captcha) 사용</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="useExtraFields" checked={formData.useExtraFields} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                  <span className="text-sm font-bold text-slate-700">추가 필드(Extra Fields) 사용</span>
                </label>
                {/* ✨ 신규: 새 글 작성 시 푸시 알림 발송 체크박스 */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="usePush" checked={formData.usePush || false} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                  <span className="text-sm font-bold text-indigo-700">새 글 작성 시 푸시 알림 발송 (레벨 10 최고관리자 대상)</span>
                </label>
              </div>
              
              <div>
                <label className={labelClass}>최대 파일 첨부 개수</label>
                <input type="number" name="fileUploadCount" min="0" max="10" value={formData.fileUploadCount} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
              </div>
            </div>

            {formData.useExtraFields && (
              <div className="px-6 pb-6 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-800">동적 추가 필드 설정</h4>
                  <button type="button" onClick={handleAddExtraField} className="flex items-center gap-1 bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-900 transition">
                    <Plus size={14} /> 필드 추가
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.extraFields?.map((field, index) => (
                    <div key={index} className="flex flex-col md:flex-row md:items-end gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg relative">
                      <div className="w-full md:w-64 flex-shrink-0">
                        <label className="block text-xs font-bold text-slate-600 mb-1">필드명</label>
                        <input type="text" value={field.fieldName} onChange={(e) => handleExtraFieldChange(index, "fieldName", e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:border-indigo-500" />
                      </div>
                      <div className="w-full md:w-48 flex-shrink-0">
                        <label className="block text-xs font-bold text-slate-600 mb-1">입력 폼 타입</label>
                        <select value={field.inputType} onChange={(e) => handleExtraFieldChange(index, "inputType", e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:border-indigo-500">
                          <option value="text">텍스트 (Text)</option>
                          <option value="number">숫자 (Number)</option>
                          <option value="url">링크 (URL)</option>
                          <option value="email">이메일 (Email)</option>
                          <option value="radio">라디오 (Radio)</option>
                          <option value="checkbox">체크박스 (Checkbox)</option>
                          <option value="select">셀렉트 박스 (Select)</option>
                        </select>
                      </div>
                      <div className="w-full flex-1">
                        {["radio", "checkbox", "select"].includes(field.inputType) && (
                          <>
                            <label className="block text-xs font-bold text-slate-600 mb-1">옵션 목록 (쉼표 구분)</label>
                            <input type="text" value={field.options} onChange={(e) => handleExtraFieldChange(index, "options", e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:border-indigo-500" />
                          </>
                        )}
                      </div>
                      <div className="flex-shrink-0 pb-0.5">
                        <button type="button" onClick={() => handleRemoveExtraField(index)} className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded-md transition shadow-sm"><X size={18} /></button>
                      </div>
                    </div>
                  ))}
                  {(!formData.extraFields || formData.extraFields.length === 0) && (
                    <p className="text-xs text-slate-400 text-center py-4">등록된 필드가 없습니다. 우측 상단의 '필드 추가' 버튼을 눌러주세요.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {formData.boardType === "GALLERY" && (
            <div className="bg-emerald-50/50 rounded-2xl shadow-sm border border-emerald-200 overflow-hidden">
              <div className="bg-emerald-100/50 px-6 py-4 border-b border-emerald-200">
                <h3 className="text-lg font-bold text-emerald-800">4. 갤러리 전용 설정</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>갤러리 가로 열 (Cols) 개수</label>
                  <input type="number" name="galleryCols" min="1" max="10" value={formData.galleryCols} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm" />
                </div>
                <div>
                  <label className={labelClass}>갤러리 세로 행 (Rows) 개수</label>
                  <input type="number" name="galleryRows" min="1" max="20" value={formData.galleryRows} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm" />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 pb-10">
            <button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-indigo-500/30 disabled:opacity-70">
              <Save size={20} />
              {isSaving ? "저장 중..." : (isEditing ? "수정 내용 저장" : "게시판 생성하기")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}