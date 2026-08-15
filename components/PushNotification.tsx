"use client";

import { useEffect, useState } from "react";
import { messaging, onMessage } from "@/lib/firebase";
import { Bell, X } from "lucide-react"; // ✨ lucide-react 아이콘 추가

export default function PushNotification() {
  // 화면에 띄울 알림 데이터를 관리하는 State
  const [notification, setNotification] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    if (!messaging) return;

    // 포그라운드(앱을 켜둔 상태)에서 푸시 메시지 수신
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("포그라운드 푸시 수신:", payload);
      
      if (payload.notification) {
        // alert 대신 State에 알림 데이터를 저장하여 UI를 렌더링
        setNotification({
          title: payload.notification.title || "새로운 알림",
          body: payload.notification.body || "",
        });

        // 💡 4초(4000ms) 후에 자동으로 알림창이 닫히도록 설정
        setTimeout(() => {
          setNotification(null);
        }, 4000);
      }
    });

    return () => unsubscribe();
  }, []);

  // 알림 데이터가 없으면 아무것도 렌더링하지 않음
  if (!notification) return null;

  return (
    // ✨ 화면 우측 하단에 고정되는 알림 UI (Tailwind CSS 애니메이션 적용)
    <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-slate-800 text-white px-5 py-4 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 w-80 max-w-[calc(100vw-2rem)] border border-slate-700">
      <div className="bg-indigo-500/20 p-2 rounded-full shrink-0">
        <Bell className="w-5 h-5 text-indigo-400" />
      </div>
      
      <div className="flex-1 pt-0.5">
        <h4 className="text-sm font-bold text-white leading-tight">
          {notification.title}
        </h4>
        <p className="text-xs text-slate-300 mt-1.5 leading-snug line-clamp-2">
          {notification.body}
        </p>
      </div>

      <button 
        onClick={() => setNotification(null)}
        className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors shrink-0"
        title="닫기"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}