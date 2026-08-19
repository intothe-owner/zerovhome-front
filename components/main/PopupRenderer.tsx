// src/app/components/main/PopupRenderer.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

export default function PopupRenderer() {
  const [popups, setPopups] = useState<any[]>([]);
  const [closedPopups, setClosedPopups] = useState<number[]>([]);
  const [todayHideMap, setTodayHideMap] = useState<Record<number, boolean>>({});
  
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") {
      setPopups([]);
      return;
    }

    const fetchActivePopups = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/popups/active`);
        const json = await res.json();
        if (json.success) {
          const now = new Date().getTime();
          const validPopups = json.data.filter((p: any) => {
            const hideUntil = localStorage.getItem(`popup_hide_${p.id}`);
            if (hideUntil && now < Number(hideUntil)) {
              return false;
            }

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

  const closePopup = (id: number) => {
    setClosedPopups(prev => [...prev, id]);
  };

  const handleTodayHideChange = (id: number, checked: boolean) => {
    setTodayHideMap(prev => ({ ...prev, [id]: checked }));
  };

  const handleFinalClose = (id: number) => {
    if (todayHideMap[id]) {
      const expiresAt = new Date().getTime() + 24 * 60 * 60 * 1000;
      localStorage.setItem(`popup_hide_${id}`, String(expiresAt));
    }
    closePopup(id);
  };

  // 💡 모바일은 중앙 고정, 데스크탑(md 이상)은 지정된 위치로 오버라이드
  const getPositionClasses = (posX: string, posY: string) => {
    // 모바일 기본: 화면 정중앙 배치
    let classes = "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ";
    
    // 데스크탑 Y축
    if (posY === "TOP") {
      classes += "md:top-10 md:bottom-auto md:translate-y-0 ";
    } else if (posY === "BOTTOM") {
      classes += "md:bottom-10 md:top-auto md:translate-y-0 ";
    } else {
      classes += "md:top-1/2 md:bottom-auto md:-translate-y-1/2 ";
    }

    // 데스크탑 X축
    if (posX === "LEFT") {
      classes += "md:left-10 md:right-auto md:translate-x-0 ";
    } else if (posX === "RIGHT") {
      classes += "md:right-10 md:left-auto md:translate-x-0 ";
    } else {
      classes += "md:left-1/2 md:right-auto md:-translate-x-1/2 ";
    }

    return classes;
  };

  if (pathname !== "/") return null;

  // 열려있는 팝업만 필터링
  const activePopups = popups.filter(p => !closedPopups.includes(p.id));

  return (
    <>
      {/* 💡 모바일용 반투명 검정 배경 (활성화된 팝업이 1개라도 있으면 렌더링) */}
      {activePopups.length > 0 && (
        <div className="fixed inset-0 bg-black/60 z-[99] md:hidden" />
      )}

      {activePopups.map(popup => (
        <div 
          key={popup.id} 
          className={`fixed z-[100] bg-white shadow-2xl overflow-hidden flex flex-col
            /* 모바일 사이즈 및 둥근 테두리 적용 */
            w-[90%] max-w-[400px] rounded-xl
            /* 데스크탑 사이즈 및 테두리 원상복구 */
            md:w-auto md:max-w-[450px] md:min-w-[300px] md:rounded-none md:border md:border-slate-200
            ${getPositionClasses(popup.positionX, popup.positionY)}
          `}
        >
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
      ))}
    </>
  );
}