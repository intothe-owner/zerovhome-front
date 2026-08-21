"use client";

import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SignupForm from "./SignupForm";

// MemberSetting 데이터를 가져와 폼을 동적으로 구성[cite: 4, 5]
const fetchMemberSettings = async (router: any) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/member-settings`);
  const json = await res.json();
  if (json.success) {
    if (json.data.memberSystemMode === "NONE") {
      alert("현재 회원가입을 받고 있지 않습니다.");
      router.push("/login"); // 하이브리드 앱의 로그인 라우트로 이동
      throw new Error("회원가입 중단됨");
    }
    return json.data;
  }
  throw new Error("설정 로드 실패");
};

export default function AppSignupPage() {
  const router = useRouter();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['memberSettings'],
    queryFn: () => fetchMemberSettings(router),
    retry: false,
  });

  if (isLoading) return (
    <div className="flex h-[100dvh] items-center justify-center bg-white dark:bg-slate-900">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  return (
    // 하이브리드 앱에 맞춰 100dvh 및 전체 너비(w-full) 사용, 카드형 그림자 제거[cite: 5]
    <div className="min-h-[100dvh] w-full bg-white dark:bg-slate-900 transition-colors pb-10">
      <div className="w-full px-5 pt-8 pb-12 space-y-6">
        
        <div className="text-center border-b border-slate-100 dark:border-slate-800 pb-6">
          <ShieldCheck className="mx-auto h-10 w-10 text-indigo-600 dark:text-indigo-400" />
          <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            회원가입
          </h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 break-keep">
            {settings?.useApproval 
              ? "가입 후 관리자의 승인이 완료되어야 로그인이 가능합니다."
              : "기본 정보를 입력하고 서비스를 바로 이용해 보세요."}
          </p>
        </div>

        <SignupForm settings={settings} />
      </div>
    </div>
  );
}