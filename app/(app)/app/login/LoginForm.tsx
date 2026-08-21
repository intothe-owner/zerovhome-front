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
      // 💡 통신 시작 전, 안드로이드에서 미리 세팅된 FCM 토큰과 기기 ID를 빼옵니다.
      const win = window as any;
      const fcmToken = win.Android?.getFcmToken ? win.Android.getFcmToken() : null;
      const deviceId = win.Android?.getDeviceId ? win.Android.getDeviceId() : null;
      alert(fcmToken);
      alert(deviceId);

      // ID, PW와 함께 안드로이드 기기 정보를 하나로 묶습니다.
      const payload = {
        ...formData,
        deviceToken: fcmToken,
        deviceId: deviceId
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // 한 번에 전송!
      });
      
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "로그인에 실패했습니다.");
      }
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      setSuccessMessage(`${data.user.name}님 환영합니다!`);

      setTimeout(() => {
        window.location.href = "/app";
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