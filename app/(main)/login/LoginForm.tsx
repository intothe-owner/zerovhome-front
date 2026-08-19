// src/app/login/LoginForm.tsx
"use client";

import { useState } from "react";
import { Lock, Mail, User, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";

interface LoginFormProps {
  settings: any;
}

export default function LoginForm({ settings }: LoginFormProps) {
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

  // 💡 로그인 뮤테이션 정의
  const loginMutation = useMutation({
    mutationFn: async () => {
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
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      setSuccessMessage(`${data.user.name}님 환영합니다! 메인 화면으로 이동합니다.`);
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    },
    onError: (error: any) => {
      setErrorMessage(error.message || "서버와 통신할 수 없습니다. 네트워크 상태를 확인해주세요.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    loginMutation.mutate();
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
            type="text" 
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

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-bold">
          <CheckCircle2 size={18} className="flex-shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      <button 
        type="submit" 
        disabled={loginMutation.isPending}
        className="flex items-center justify-center gap-2 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-70 mt-2"
      >
        {loginMutation.isPending && <Loader2 className="animate-spin" size={18} />}
        {loginMutation.isPending ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}