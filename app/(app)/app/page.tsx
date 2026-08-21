"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const Home = () => {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // 💡 컴포넌트 마운트 시 로컬 스토리지에서 토큰 확인
    const token = localStorage.getItem("token");

    if (!token) {
      // 토큰이 없으면 로그인 페이지로 리다이렉트
      // 웹뷰에서 안드로이드 뒤로가기 버튼(백스택) 꼬임을 방지하기 위해 replace 사용
      router.replace("/app/login");
    } else {
      // 토큰이 있으면 인증 확인 상태 해제 후 화면 렌더링
      setIsCheckingAuth(false);
    }
  }, [router]);

  // 인증 확인 중일 때는 깜빡임(Flash) 방지를 위해 로딩 화면 표시
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="-mt-16 min-h-[100dvh] bg-gray-50 text-gray-900 flex flex-col items-center justify-center px-5">
      {/* 헤더 타이틀 */}
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          현장 업무 시스템
        </h1>
        <p className="mt-2 text-sm text-gray-500 font-medium">
          진행하실 사업을 선택해 주세요
        </p>
      </div>

      {/* 버튼 영역 */}
      <div className="w-full max-w-md space-y-4">
        <Link 
          href="/app/clean"
          className="flex flex-col items-center justify-center w-full rounded-2xl bg-blue-600 p-8 shadow-lg shadow-blue-200 transition-all active:scale-95 hover:bg-blue-700"
        >
          <span className="text-xl font-black text-white">클린UP 사업</span>
          <span className="mt-1 text-sm font-medium text-blue-100">
            취약계층 주거환경 개선
          </span>
        </Link>

        <Link 
          href="/app/senior"
          className="flex flex-col items-center justify-center w-full rounded-2xl bg-emerald-600 p-8 shadow-lg shadow-emerald-200 transition-all active:scale-95 hover:bg-emerald-700"
        >
          <span className="text-xl font-black text-white">경로당 사업</span>
          <span className="mt-1 text-sm font-medium text-emerald-100">
            냉방기 및 공기청정기 클린UP
          </span>
        </Link>
      </div>
    </div>
  );
};

export default Home;