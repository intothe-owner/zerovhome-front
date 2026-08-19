// src/app/register/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import RegisterForm from "./RegisterForm";

const fetchMemberSettings = async (router: any) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/member-settings`);
  const json = await res.json();
  if (json.success) {
    if (json.data.memberSystemMode === "NONE") {
      alert("현재 회원가입을 받고 있지 않습니다.");
      router.push("/login");
      throw new Error("회원가입 중단됨");
    }
    return json.data;
  }
  throw new Error("설정 로드 실패");
};

export default function RegisterPage() {
  const router = useRouter();

  // 💡 useQuery로 설정 데이터 페칭
  const { data: settings, isLoading } = useQuery({
    queryKey: ['memberSettings'],
    queryFn: () => fetchMemberSettings(router),
    retry: false,
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  return (
    <div className="min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors flex justify-center pt-34">
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

        <RegisterForm settings={settings} />
      </div>
    </div>
  );
}