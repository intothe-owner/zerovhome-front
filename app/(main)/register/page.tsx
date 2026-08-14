"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/member-settings`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          // 가입 차단 모드(LOGIN_ONLY, NONE)일 경우 접근 제한
          if (json.data.memberSystemMode === "NONE") {
            alert("현재 회원가입을 받고 있지 않습니다.");
            router.push("/login");
            return;
          }
          setSettings(json.data);
        }
      })
      .finally(() => setIsLoading(false));
  }, [router]);


  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );


  return (
    <div className="min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors flex justify-center">
      <div className="max-w-2xl w-full space-y-8 bg-white dark:bg-slate-800 p-8 md:p-12 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
        
        <div className="text-center border-b border-slate-200 dark:border-slate-700 pb-8">
          <ShieldCheck className="mx-auto h-12 w-12 text-indigo-600 dark:text-indigo-400" />
          <h2 className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">
            회원가입
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {settings?.useApproval 
              ? "가입 후 관리자의 승인이 완료되어야 로그인이 가능합니다."
              : "기본 정보를 입력하고 서비스를 바로 이용해 보세요."}
          </p>
        </div>

        <RegisterForm settings={settings}/>
      </div>
    </div>
  );
}