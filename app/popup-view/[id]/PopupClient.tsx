// src/app/(main)/popup-view/[id]/PopupClient.tsx
"use client";

import { useEffect, useState } from "react";

export default function PopupClient({ id }: { id: string }) {
  const [popup, setPopup] = useState<any>(null);
  const [todayHide, setTodayHide] = useState(false);

  useEffect(() => {
    const fetchPopup = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/popups`);
        const json = await res.json();
        if (json.success) {
          const found = json.data.find((p: any) => String(p.id) === id);
          if (found) setPopup(found);
        }
      } catch (e) {
        console.error("팝업 데이터를 불러오는데 실패했습니다.", e);
      }
    };
    fetchPopup();
  }, [id]);

  const handleClose = () => {
    if (todayHide) {
      const expiresAt = new Date().getTime() + 24 * 60 * 60 * 1000;
      localStorage.setItem(`popup_hide_${id}`, String(expiresAt));
    }
    window.close();
  };

  if (!popup) return <div className="p-8 text-center text-sm text-slate-500">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <div className="bg-slate-900 text-white flex justify-between items-center p-3">
          <h4 className="font-bold text-sm truncate pr-4">{popup.title}</h4>
        </div>
        
        <div className="p-4">
          {popup.attachmentUrl && (
            <img src={popup.attachmentUrl} alt="팝업 이미지" className="w-full mb-4 object-contain max-h-[300px]" />
          )}
          <div dangerouslySetInnerHTML={{ __html: popup.content }} className="text-sm text-slate-700 leading-relaxed" />
        </div>
      </div>

      <div className="bg-slate-50 border-t border-slate-200 p-3 flex justify-between items-center text-xs">
        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
          <input 
            type="checkbox" 
            checked={todayHide} 
            onChange={(e) => setTodayHide(e.target.checked)}
            className="w-4 h-4 accent-indigo-600 rounded" 
          />
          오늘 하루 동안 보지 않기
        </label>
        
        <button 
          onClick={handleClose} 
          className="font-bold text-slate-700 bg-white border border-slate-300 px-3 py-1 rounded hover:bg-slate-100 transition"
        >
          창 닫기
        </button>
      </div>
    </div>
  );
}