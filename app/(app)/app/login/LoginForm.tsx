"use client";

import { useState } from "react";
import { Lock, Mail, User, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

interface LoginFormProps {
  settings: any;
}

export default function LoginForm({ settings }: LoginFormProps) {
  const router = useRouter();
  const isEmailId = settings?.useEmailAsLoginId;
  
  const [formData, setFormData] = useState({ loginId: "", password: "" });
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

  const loginMutation = useMutation({
    mutationFn: async () => {
      // Auth 로그인 API 호출[cite: 7, 9]
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "로그인에 실패했습니다.");
      }
      return data;
    },
    onSuccess: async (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      setSuccessMessage(`${data.user.name}님 환영합니다!`);

      // 💡 [안드로이드 브릿지 통신 및 FCM 토큰 저장]
      const win = window as any;
      if (win.AndroidBridge) {
        try {
          // 1. 안드로이드 네이티브에서 FCM 토큰과 기기 ID 획득
          const fcmToken = win.AndroidBridge.getFcmToken ? win.AndroidBridge.getFcmToken() : null;
          const deviceId = win.AndroidBridge.getDeviceId ? win.AndroidBridge.getDeviceId() : "unknown";

          // 2. 토큰이 존재하면 백엔드 DB(MemberDevice 테이블)에 저장 API 호출[cite: 2, 9]
          if (fcmToken) {
            await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/token`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                memberId: data.user.id,
                deviceToken: fcmToken,
                deviceType: "ANDROID",
                deviceId: deviceId
              }),
            });
          }

          // 3. 앱에 로그인 성공 이벤트 전달 (선택사항)
          if (win.AndroidBridge.postMessage) {
            win.AndroidBridge.postMessage(JSON.stringify({
              type: "LOGIN_SUCCESS",
              memberId: data.user.id
            }));
          }
        } catch (error) {
          console.error("푸시 토큰 연동 중 오류 발생:", error);
        }
      }

      setTimeout(() => {
        router.replace("/");
      }, 1000);
    },
    onError: (error: any) => {
      setErrorMessage(error.message || "서버 통신 오류가 발생했습니다.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    loginMutation.mutate();
  };

  // 모바일 입력 필드 스타일
  const inputClass = "w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-[15px] dark:text-white";
  const labelClass = "block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelClass}>
          {isEmailId ? "이메일" : "아이디"}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isEmailId ? <Mail size={18} className="text-slate-400" /> : <User size={18} className="text-slate-400" />}
          </div>
          <input 
            type="text" 
            required 
            value={formData.loginId}
            onChange={(e) => handleChange("loginId", e.target.value)}
            className={inputClass}
            placeholder={isEmailId ? "example@email.com" : "아이디 입력"}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2 px-1">
          <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">비밀번호</label>
          <Link href="#" className="text-[12px] font-bold text-indigo-600 dark:text-indigo-400">
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
            className={inputClass}
            placeholder="비밀번호 입력"
          />
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-[13px] font-bold">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="flex items-center gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-600 dark:text-emerald-400 text-[13px] font-bold">
          <CheckCircle2 size={18} className="flex-shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      <div className="pt-2">
        <button 
          type="submit" 
          disabled={loginMutation.isPending}
          className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors text-[16px] disabled:opacity-70"
        >
          {loginMutation.isPending && <Loader2 className="animate-spin" size={20} />}
          {loginMutation.isPending ? "로그인 중..." : "로그인"}
        </button>
      </div>
    </form>
  );
}