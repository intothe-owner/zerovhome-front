"use client";

import { useEffect, useState } from "react";
import { onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase";
import { Bell, X } from "lucide-react";

export default function PushNotification() {
  const [notification, setNotification] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    const setupMessaging = async () => {
      const messaging = await getFirebaseMessaging();
      if (!messaging) return; // 브라우저가 지원하지 않으면 멈춤

      const unsubscribe = onMessage(messaging, (payload) => {
        
        if (payload.notification) {
          setNotification({
            title: payload.notification.title || "새로운 알림",
            body: payload.notification.body || "",
          });
          setTimeout(() => setNotification(null), 4000);
        }
      });

      return () => unsubscribe();
    };

    setupMessaging();
  }, []);

  if (!notification) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-slate-800 text-white px-5 py-4 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 w-80 max-w-[calc(100vw-2rem)] border border-slate-700">
      <div className="bg-indigo-500/20 p-2 rounded-full shrink-0">
        <Bell className="w-5 h-5 text-indigo-400" />
      </div>
      <div className="flex-1 pt-0.5">
        <h4 className="text-sm font-bold text-white leading-tight">{notification.title}</h4>
        <p className="text-xs text-slate-300 mt-1.5 leading-snug line-clamp-2">{notification.body}</p>
      </div>
      <button onClick={() => setNotification(null)} className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}