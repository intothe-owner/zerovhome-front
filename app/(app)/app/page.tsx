"use client";

import Link from "next/link";

const Home = () => {
  return (
    <div className="-mt-16 min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center justify-center px-5">
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