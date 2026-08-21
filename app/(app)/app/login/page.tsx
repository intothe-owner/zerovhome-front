"use client";

import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import LoginForm from "./LoginForm";

// 로그인 설정 데이터(아이디/이메일 여부, SNS 등) 페칭[cite: 8]
const fetchMemberSettings = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/member-settings`);
  const json = await res.json();
  if (!json.success) throw new Error("설정 정보를 불러오지 못했습니다.");
  return json.data;
};

export default function AppLoginPage() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['memberSettings'],
    queryFn: fetchMemberSettings,
  });

  if (isLoading) return (
    <div className="flex h-[100dvh] items-center justify-center bg-white dark:bg-slate-900">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  return (
    // 모바일 환경에 최적화: 전체 높이 100dvh, 배경색 통일, 카드 그림자 제거[cite: 8]
    <div className="min-h-[100dvh] w-full flex flex-col justify-center bg-white dark:bg-slate-900 px-5 pt-8 pb-12">
      <div className="w-full space-y-8">
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            로그인
          </h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            서비스 이용을 위해 로그인해 주세요.
          </p>
        </div>

        <LoginForm settings={settings} />

        {/* SNS 간편 로그인 영역[cite: 8] */}
        {(settings?.useKakaoLogin || settings?.useNaverLogin || settings?.useGoogleLogin) && (
          <div className="mt-6">
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white dark:bg-slate-900 text-slate-400">SNS 계정으로 간편 로그인</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {settings.useKakaoLogin && (
                <button className="w-full flex items-center justify-center px-4 py-3.5 rounded-xl text-[14px] font-bold text-[#371d1e] bg-[#FEE500] hover:bg-[#FEE500]/90 transition-colors">
                  카카오 로그인
                </button>
              )}
              {settings.useNaverLogin && (
                <button className="w-full flex items-center justify-center px-4 py-3.5 rounded-xl text-[14px] font-bold text-white bg-[#03C75A] hover:bg-[#03C75A]/90 transition-colors">
                  네이버 로그인
                </button>
              )}
              {settings.useGoogleLogin && (
                <button className="w-full flex items-center justify-center px-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl text-[14px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 transition-colors">
                  Google 로그인
                </button>
              )}
            </div>
          </div>
        )}

        {/* 회원가입 이동 영역[cite: 8] */}
        {settings?.memberSystemMode === "ALL" && (
          <div className="mt-8 text-center pt-2">
            <p className="text-[13px] text-slate-500 dark:text-slate-400">
              아직 계정이 없으신가요?
            </p>
            {/* 하이브리드 앱 내 라우팅 경로에 맞게 링크 수정 */}
            <Link href="/(app)/signup" className="mt-2 inline-flex items-center gap-1 font-bold text-[14px] text-indigo-600 dark:text-indigo-400">
              회원가입 하러 가기 <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}