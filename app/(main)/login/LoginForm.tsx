"use client";

import { useState } from "react";
import { Lock, Mail, User, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { messaging, getToken } from "@/lib/firebase";
import Link from "next/link";

// 💡 (선택) 클라이언트에서 FCM 토큰을 가져오는 가상의 함수
// 실제 구현 시 Firebase Client SDK의 getToken() 메서드를 사용해야 합니다.
// 실제 FCM 토큰 발급 함수로 교체
const fetchFCMTokenFromBrowser = async () => {
  if (!messaging) return null;
  
  try {
    // 1. 브라우저 알림 권한 요청
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("알림 권한이 허용되지 않았습니다.");
      return null;
    }

    // 2. Firebase 콘솔에서 발급받은 VAPID 키를 넣고 토큰 발급
    const currentToken = await getToken(messaging, { 
      vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY // "B...어쩌고" 하는 긴 문자열
    });

    if (currentToken) {
      return currentToken;
    } else {
      console.warn("토큰을 가져올 수 없습니다.");
      return null;
    }
  } catch (error) {
    console.error("토큰 발급 중 에러:", error);
    return null;
  }
};

export default function LoginForm({ settings }: { settings: any }) {
  const isEmailId = settings.useEmailAsLoginId;
  const router = useRouter();
  
  const [formData, setFormData] = useState({ loginId: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const clearMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleChange = (field: string, value: string) => {
    clearMessages();
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // 💡 1. 유저 레벨이 정확히 어떤 타입/값으로 들어오는지 확인
        console.log("확인용 로그 - 유저 레벨:", data.user.level, typeof data.user.level);

        // 만약 문자열 "10"으로 들어올 수도 있으니 Number()로 변환해서 체크해 봅니다.
        if (Number(data.user.level) === 10) {
          console.log("레벨 10 통과! 토큰 발급 로직 진입");
          try {
            const fcmToken = await fetchFCMTokenFromBrowser();
            console.log("발급받은 fcmToken:", fcmToken);
            
            if (fcmToken) {
              console.log("백엔드로 POST /token 요청 시작...");
              const tokenRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/token`, {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${data.token}` 
                },
                body: JSON.stringify({
                  memberId: data.user.id,
                  deviceToken: fcmToken,
                  deviceType: "WEB",
                  deviceId: "browser-unique-id" 
                }),
              });
              
              // 💡 2. 백엔드 응답 결과 확인
              const tokenData = await tokenRes.json();
              console.log("백엔드 /token 응답 결과:", tokenData);
            }
          } catch (tokenError) {
            console.error("프론트엔드 푸시 토큰 처리 중 에러 발생:", tokenError);
          }
        }
        
        setSuccessMessage(`${data.user.name}님 환영합니다!`);
        // (디버깅을 위해 잠시 딜레이를 넉넉하게 주거나 주석 처리하여 페이지가 바로 안 넘어가게 하세요)
        setTimeout(() => {
          window.location.href = "/";
        }, 3000); 
      } else {
        setErrorMessage(data.message || "로그인에 실패했습니다.");
      }
    } catch (error) {
      setErrorMessage("서버와 통신할 수 없습니다. 네트워크 상태를 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
          {isEmailId ? "이메일" : "아이디"}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isEmailId ? <Mail size={18} className="text-slate-400" /> : <User size={18} className="text-slate-400" />}
          </div>
          <input 
            type={isEmailId ? "email" : "text"} 
            required 
            value={formData.loginId}
            onChange={(e) => handleChange("loginId", e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm dark:text-white"
            placeholder={isEmailId ? "example@email.com" : "아이디를 입력하세요"}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">비밀번호</label>
          <Link href="#" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            비밀번호 찾기
          </Link>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock size={18} className="text-slate-400" />
          </div>
          <input 
            type="password" 
            required 
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm dark:text-white"
            placeholder="비밀번호를 입력하세요"
          />
        </div>
      </div>

      {/* --- 에러 및 성공 메시지 출력 영역 --- */}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 size={18} className="flex-shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      <button 
        type="submit" 
        disabled={isLoading}
        className="flex items-center justify-center gap-2 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-70 mt-2"
      >
        {isLoading && <Loader2 className="animate-spin" size={18} />}
        {isLoading ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}