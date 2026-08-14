// src/app/(main)/setup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    loginId: "",
    password: "",
    passwordConfirm: "",
    name: "최고관리자"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.passwordConfirm) {
      return alert("비밀번호가 일치하지 않습니다.");
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/setup-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        alert("CMS 최고관리자 설정이 완료되었습니다!\n이제 설정하신 계정으로 로그인해 주세요.");
        window.location.href = "/login"; // 💡 강제 새로고침을 통해 레이아웃의 확인 로직을 다시 태움
      } else {
        alert(data.message);
        setIsLoading(false);
      }
    } catch (error) {
      alert("서버와 통신 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-sm";
  const labelClass = "block text-sm font-extrabold text-slate-800 mb-2";

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12 bg-white">
      <div className="w-full max-w-md">
        
        {/* 상단 안내 영역 */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-100">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">CMS 초기 셋업</h1>
          <p className="text-sm text-slate-500 mt-3 leading-relaxed">
            환영합니다!<br/>시스템을 안전하게 관리하기 위해<br/>최초 1회 <strong className="text-indigo-600">최고관리자(Super Admin)</strong> 계정을 생성해 주세요.
          </p>
        </div>

        {/* 폼 영역 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={labelClass}>관리자 아이디 (이메일 권장)</label>
            <input 
              type="text" 
              name="loginId" 
              required 
              onChange={handleChange} 
              className={inputClass} 
              placeholder="admin@example.com" 
              autoFocus
            />
          </div>

          <div>
            <label className={labelClass}>관리자 이름</label>
            <input 
              type="text" 
              name="name" 
              required 
              value={formData.name}
              onChange={handleChange} 
              className={inputClass} 
              placeholder="표시될 이름을 입력하세요" 
            />
          </div>

          <div>
            <label className={labelClass}>보안 비밀번호</label>
            <input 
              type="password" 
              name="password" 
              required 
              onChange={handleChange} 
              className={inputClass} 
              placeholder="안전한 비밀번호를 입력하세요" 
            />
          </div>

          <div>
            <label className={labelClass}>비밀번호 확인</label>
            <input 
              type="password" 
              name="passwordConfirm" 
              required 
              onChange={handleChange} 
              className={inputClass} 
              placeholder="비밀번호를 한 번 더 입력하세요" 
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isLoading}
              className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 hover:bg-black text-white font-black rounded-xl shadow-lg transition-colors text-lg disabled:opacity-70"
            >
              {isLoading && <Loader2 className="animate-spin" size={20} />}
              최고관리자 계정 생성하기
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}