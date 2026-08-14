"use client";

import { useState } from "react";
import { Lock, Mail, User, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm({ settings }: { settings: any }) {
  const isEmailId = settings.useEmailAsLoginId;
  const router = useRouter();
  
  const [formData, setFormData] = useState({ loginId: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  // 상태 메시지 표시용 State
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 입력 시 기존 에러 메시지 초기화
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
        // 성공 시 로컬 스토리지에 토큰 저장
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // 성공 메시지 출력 후 메인으로 이동
        setSuccessMessage(`${data.user.name}님 환영합니다! 메인 화면으로 이동합니다.`);
        setTimeout(() => {
          window.location.href = "/";
        }, 1000); // 1초 대기 후 이동
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