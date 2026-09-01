"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Play, History, ChevronRight, BookOpen, Loader2 } from "lucide-react";

export default function AppQuestionMainPage() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  const handleStartMockTest = async () => {
    if (confirm("새로운 60문제 랜덤 모의고사를 시작하시겠습니까?")) {
      try {
        setIsStarting(true);
        const res = await axios.post(`${API_BASE_URL}/api/questions/exams/start`, {
          examTitle: "전기기능사 랜덤 모의고사",
        });
        
        if (res.data.ok) {
          const sessionId = res.data.data.id;
          // 모바일 앱용 문제 풀이 경로로 이동
          router.push(`/app/questions/solve/${sessionId}`);
        }
      } catch (error) {
        alert("모의고사 생성에 실패했습니다. 다시 시도해주세요.");
        setIsStarting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 모바일 상단 헤더 */}
      <header className="bg-white px-5 py-4 border-b border-slate-200 sticky top-0 z-10 flex items-center gap-2 shadow-sm">
        <BookOpen className="text-indigo-600" size={24} />
        <h1 className="text-xl font-extrabold text-slate-800">CBT 시험장</h1>
      </header>

      {/* 메인 콘텐츠 영역 (모바일에 맞춘 여백 및 레이아웃) */}
      <main className="flex-1 p-5 space-y-6 max-w-md mx-auto w-full">
        
        {/* 안내 배너 */}
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-6 text-white shadow-md">
          <h2 className="text-2xl font-bold mb-2">실전처럼 대비하세요!</h2>
          <p className="text-indigo-100 text-sm leading-relaxed mb-4">
            실제 시험과 동일하게 60문제가 무작위로 출제되며, 보기 순서도 매번 변경됩니다.
          </p>
        </div>

        {/* 메인 액션 버튼 그룹 */}
        <div className="space-y-4">
          
          {/* 모의고사 응시 버튼 */}
          <button
            onClick={handleStartMockTest}
            disabled={isStarting}
            className="w-full bg-white border-2 border-indigo-100 rounded-2xl p-5 flex items-center justify-between text-left hover:border-indigo-500 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                {isStarting ? <Loader2 size={24} className="animate-spin" /> : <Play size={24} className="ml-1" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">모의고사 응시</h3>
                <p className="text-slate-500 text-sm mt-0.5">랜덤 60문제 바로 시작하기</p>
              </div>
            </div>
            <ChevronRight className="text-slate-300" size={24} />
          </button>

          {/* 응시 이력 버튼 */}
          <Link
            href="/app/questions/history"
            className="w-full bg-white border-2 border-slate-100 rounded-2xl p-5 flex items-center justify-between text-left hover:border-slate-300 hover:shadow-md transition-all active:scale-[0.98] block"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center shrink-0">
                <History size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">내 응시 이력</h3>
                <p className="text-slate-500 text-sm mt-0.5">이전 점수 및 오답 노트 확인</p>
              </div>
            </div>
            <ChevronRight className="text-slate-300" size={24} />
          </Link>
          
        </div>
      </main>
    </div>
  );
}