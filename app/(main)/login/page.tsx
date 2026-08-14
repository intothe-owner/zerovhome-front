"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Loader2, ArrowRight } from "lucide-react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/member-settings`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {

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
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 md:p-10 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
        
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
            로그인
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            서비스 이용을 위해 로그인해 주세요.
          </p>
        </div>

        
        <LoginForm settings="{settings}"/>
       

        {/* 소셜 로그인 (활성화된 것만 표시) */}
        {(settings?.useKakaoLogin || settings?.useNaverLogin || settings?.useGoogleLogin) && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">SNS 계정으로 간편 로그인</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              {settings.useKakaoLogin && (
                <button className="w-full flex items-center justify-center px-4 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-bold text-[#371d1e] bg-[#FEE500] hover:bg-[#FEE500]/90 transition-colors">
                  카카오 로그인
                </button>
              )}
              {settings.useNaverLogin && (
                <button className="w-full flex items-center justify-center px-4 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#03C75A] hover:bg-[#03C75A]/90 transition-colors">
                  네이버 로그인
                </button>
              )}
              {settings.useGoogleLogin && (
                <button className="w-full flex items-center justify-center px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                  Google 로그인
                </button>
              )}
            </div>
          </div>
        )}

        {settings?.memberSystemMode === "ALL" && (
          <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-700 pt-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              아직 계정이 없으신가요?
            </p>
            <Link href="/register" className="mt-2 inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              회원가입 하러 가기 <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}