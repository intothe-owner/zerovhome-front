// src/app/(admin)/admin/popups/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, List, Save, Image as ImageIcon } from "lucide-react";

export default function PopupManager() {
  const [popups, setPopups] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"LIST" | "FORM">("LIST");
  const [isEditing, setIsEditing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const initialForm = {
    id: null, title: "", type: "LAYER", positionX: "CENTER", positionY: "CENTER",
    startDate: "", endDate: "", content: "", isActive: true, attachmentUrl: ""
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchPopups = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/popups`);
    const json = await res.json();
    if (json.success) setPopups(json.data);
  };

  useEffect(() => { fetchPopups(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && key !== 'attachmentUrl') submitData.append(key, String(value));
    });
    if (file) submitData.append("attachment", file);

    const url = isEditing ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/popups/${formData.id}` : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/popups`;
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, { method, body: submitData });
    if (res.ok) {
      alert("저장되었습니다.");
      setViewMode("LIST");
      fetchPopups();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/popups/${id}`, { method: "DELETE" });
    if (res.ok) fetchPopups();
  };

  // 날짜 포맷팅 헬퍼 (YYYY-MM-DDTHH:mm 포맷으로 변환)
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const inputClass = "w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">팝업 관리</h2>
          <p className="text-sm text-slate-500 mt-1">사이트에 노출되는 레이어 및 윈도우 팝업을 관리합니다.</p>
        </div>
        <button 
          onClick={() => {
            if (viewMode === "FORM") { setViewMode("LIST"); } 
            else { setFormData(initialForm); setIsEditing(false); setFile(null); setViewMode("FORM"); }
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm"
        >
          {viewMode === "FORM" ? <List size={16}/> : <Plus size={16}/>}
          {viewMode === "FORM" ? "목록으로" : "새 팝업 등록"}
        </button>
      </div>

      {viewMode === "LIST" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold">제목</th>
                <th className="p-4 font-bold">타입/상태</th>
                <th className="p-4 font-bold">노출 기간</th>
                <th className="p-4 font-bold text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {popups.map(p => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-bold">{p.title}</td>
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs mr-2">{p.type}</span>
                    <span className={`px-2 py-1 rounded text-xs text-white ${p.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}>
                      {p.isActive ? '사용중' : '중지'}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    {new Date(p.startDate).toLocaleString()} ~ <br/>
                    {new Date(p.endDate).toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => { 
                      setFormData({...p, startDate: formatDateForInput(p.startDate), endDate: formatDateForInput(p.endDate)}); 
                      setIsEditing(true); setViewMode("FORM"); 
                    }} className="text-indigo-600 mr-3"><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === "FORM" && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block font-bold mb-1">팝업 제목</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className={inputClass} />
            </div>

            <div>
              <label className="block font-bold mb-1">팝업 타입</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className={inputClass}>
                <option value="LAYER">레이어 팝업 (페이지 내부)</option>
                <option value="WINDOW">윈도우 팝업 (새 창)</option>
              </select>
            </div>
            
            <div className="flex items-center gap-4 mt-6">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-600">
                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-5 h-5 accent-emerald-500" />
                팝업 활성화
              </label>
            </div>

            {/* 위치 설정 (그리드 직관성 제공) */}
            <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block font-bold mb-3 text-slate-700">팝업 위치 설정 (레이어 팝업 시 적용)</label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <span className="text-xs text-slate-500 block mb-1">가로 위치 (X)</span>
                  <select value={formData.positionX} onChange={e => setFormData({...formData, positionX: e.target.value})} className={inputClass}>
                    <option value="LEFT">좌측 (Left)</option>
                    <option value="CENTER">중앙 (Center)</option>
                    <option value="RIGHT">우측 (Right)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <span className="text-xs text-slate-500 block mb-1">세로 위치 (Y)</span>
                  <select value={formData.positionY} onChange={e => setFormData({...formData, positionY: e.target.value})} className={inputClass}>
                    <option value="TOP">상단 (Top)</option>
                    <option value="CENTER">중앙 (Center)</option>
                    <option value="BOTTOM">하단 (Bottom)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 노출 기간 */}
            <div>
              <label className="block font-bold mb-1">시작 일시</label>
              <input type="datetime-local" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required className={inputClass} />
            </div>
            <div>
              <label className="block font-bold mb-1">종료 일시</label>
              <input type="datetime-local" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} required className={inputClass} />
            </div>

            <div className="col-span-2 border-t border-slate-100 pt-4">
              <label className="block font-bold mb-1">내용 작성 (HTML 지원)</label>
              {/* 여기에 추후 Toast UI 등 에디터를 씌울 수 있습니다 */}
              <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} rows={6} className={inputClass} placeholder="<p>팝업 내용을 입력하세요.</p>"></textarea>
            </div>

            <div className="col-span-2">
              <label className="block font-bold mb-1">단일 이미지 첨부 (옵션)</label>
              <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="text-sm" />
              {formData.attachmentUrl && <img src={formData.attachmentUrl} className="h-20 mt-2 rounded border object-contain" alt="첨부" />}
            </div>
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-black">
            {isEditing ? "팝업 수정하기" : "새 팝업 등록하기"}
          </button>
        </form>
      )}
    </div>
  );
}