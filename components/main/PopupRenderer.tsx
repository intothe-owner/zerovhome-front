// src/app/components/main/PopupRenderer.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation"; // 💡 현재 경로 감지용 훅
import { X } from "lucide-react";

export default function PopupRenderer() {
  const [popups, setPopups] = useState<any[]>([]);
  const [closedPopups, setClosedPopups] = useState<number[]>([]);
  const [todayHideMap, setTodayHideMap] = useState<Record<number, boolean>>({});
  
  const pathname = usePathname(); // 💡 현재 접속한 URL 경로

  useEffect(() => {
    // 💡 1. 메인 페이지("/")가 아닐 경우에는 팝업을 아예 불러오거나 띄우지 않습니다.
    if (pathname !== "/") {
      setPopups([]);
      return;
    }

    const fetchActivePopups = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/popups/active`);
        const json = await res.json();
        if (json.success) {
          // 💡 2. 로컬 스토리지에서 "오늘 하루 보지 않기" 만료 시간을 검사합니다.
          const now = new Date().getTime();
          const validPopups = json.data.filter((p: any) => {
            const hideUntil = localStorage.getItem(`popup_hide_${p.id}`);
            if (hideUntil && now < Number(hideUntil)) {
              return false; // 아직 24시간이 지나지 않았으므로 노출 안 함
            }

            // WINDOW 타입 팝업 처리
            if (p.type === "WINDOW") {
              window.open(`/popup-view/${p.id}`, `popup_${p.id}`, "width=400,height=500,left=100,top=100");
              return false;
            }
            return true;
          });

          setPopups(validPopups);
        }
      } catch (e) {}
    };

    fetchActivePopups();
  }, [pathname]);

  // 단순 닫기 (이번 브라우저 세션 동안만 안 봄)
  const closePopup = (id: number) => {
    setClosedPopups(prev => [...prev, id]);
  };

  // 💡 3. 하루 동안 보지 않기 체크박스 토글
  const handleTodayHideChange = (id: number, checked: boolean) => {
    setTodayHideMap(prev => ({ ...prev, [id]: checked }));
  };

  // 최종 닫기 버튼 (오늘 하루 보지 않기가 체크되어 있으면 localStorage에 24시간 후 시간 저장)
  const handleFinalClose = (id: number) => {
    if (todayHideMap[id]) {
      const expiresAt = new Date().getTime() + 24 * 60 * 60 * 1000; // 현재 시간 + 24시간
      localStorage.setItem(`popup_hide_${id}`, String(expiresAt));
    }
    closePopup(id);
  };

  const getPositionClasses = (posX: string, posY: string) => {
    let classes = "fixed z-[100] bg-white shadow-2xl border border-slate-200 overflow-hidden ";
    
    // Y축 위치
    if (posY === "TOP") classes += "top-10 ";
    else if (posY === "BOTTOM") classes += "bottom-10 ";
    else classes += "top-1/2 -translate-y-1/2 ";

    // X축 위치
    if (posX === "LEFT") classes += "left-10 ";
    else if (posX === "RIGHT") classes += "right-10 ";
    else classes += "left-1/2 -translate-x-1/2 ";

    classes += "w-full md:w-auto md:max-w-[450px] min-w-[300px]";
    return classes;
  };

  // 메인 페이지가 아니면 렌더링하지 않음
  if (pathname !== "/") return null;

  return (
    <>
      {popups.map(popup => {
        if (closedPopups.includes(popup.id)) return null;

        return (
          <div key={popup.id} className={getPositionClasses(popup.positionX, popup.positionY)}>
            <div className="bg-slate-900 text-white flex justify-between items-center p-3">
              <h4 className="font-bold text-sm truncate pr-4">{popup.title}</h4>
              <button onClick={() => closePopup(popup.id)} className="text-slate-300 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {popup.attachmentUrl && (
                <img src={popup.attachmentUrl} alt="팝업 이미지" className="w-full mb-4 object-contain" />
              )}
              <div dangerouslySetInnerHTML={{ __html: popup.content }} className="text-sm text-slate-700 leading-relaxed" />
            </div>
            
            {/* 💡 하단 제어 바: 하루 동안 보지 않기 체크박스 추가 */}
            <div className="bg-slate-50 border-t border-slate-200 p-3 flex justify-between items-center text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                <input 
                  type="checkbox" 
                  checked={!!todayHideMap[popup.id]} 
                  onChange={(e) => handleTodayHideChange(popup.id, e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded" 
                />
                오늘 하루 동안 보지 않기
              </label>
              
              <button 
                onClick={() => handleFinalClose(popup.id)} 
                className="font-bold text-slate-700 bg-white border border-slate-300 px-3 py-1 rounded hover:bg-slate-100 transition"
              >
                닫기
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}