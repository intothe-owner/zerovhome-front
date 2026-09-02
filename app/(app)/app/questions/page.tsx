"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Play, History, ChevronRight, BookOpen, Loader2, CheckCircle2 } from "lucide-react";

export default function AppQuestionMainPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isStarting, setIsStarting] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  // 카테고리 목록 불러오기
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/questions/categories`);
        if (res.data.ok && res.data.data.length > 0) {
          setCategories(res.data.data);
          setSelectedCategory(res.data.data[0]); // 첫 번째 항목 기본 선택
        }
      } catch (error) {
        console.error("카테고리 불러오기 실패", error);
      }
    };
    fetchCategories();
  }, [API_BASE_URL]);

  const handleStartMockTest = async () => {
    if (!selectedCategory) {
      alert("응시할 시험 회차를 선택해주세요.");
      return;
    }

    if (confirm(`[${selectedCategory}] 모의고사를 시작하시겠습니까?`)) {
      try {
        setIsStarting(true);
        // 선택한 카테고리(examTitle)를 넘겨서 세션 생성
        const res = await axios.post(`${API_BASE_URL}/api/questions/exams/start`, {
          examTitle: selectedCategory, 
        });
        
        if (res.data.ok) {
          const sessionId = res.data.data.id;
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
      <header className="bg-white px-5 py-4 border-b border-slate-200 sticky top-0 z-10 flex items-center gap-2 shadow-sm">
        <BookOpen className="text-indigo-600" size={24} />
        <h1 className="text-xl font-extrabold text-slate-800">CBT 시험장</h1>
      </header>

      <main className="flex-1 p-5 space-y-6 max-w-md mx-auto w-full">
        {/* 회차 선택 영역 추가 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-800">어떤 시험을 응시할까요?</h2>
          
          {categories.length === 0 ? (
            <div className="text-sm text-slate-500 py-2">등록된 시험이 없습니다.</div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)}
                  className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all active:scale-[0.98] ${
                    selectedCategory === cat 
                      ? "border-indigo-600 bg-indigo-50" 
                      : "border-slate-100 bg-white"
                  }`}
                >
                  <span className={`font-bold ${selectedCategory === cat ? "text-indigo-700" : "text-slate-600"}`}>
                    {cat}
                  </span>
                  {selectedCategory === cat && <CheckCircle2 className="text-indigo-600" size={20} />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* 모의고사 응시 버튼 */}
          <button
            onClick={handleStartMockTest}
            disabled={isStarting || categories.length === 0}
            className="w-full bg-indigo-600 text-white rounded-2xl p-5 flex items-center justify-between text-left hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                {isStarting ? <Loader2 size={24} className="animate-spin" /> : <Play size={24} className="ml-1" />}
              </div>
              <div>
                <h3 className="text-lg font-bold">선택한 회차 응시</h3>
                <p className="text-indigo-200 text-sm mt-0.5">랜덤 60문제 바로 시작하기</p>
              </div>
            </div>
            <ChevronRight className="text-white/50" size={24} />
          </button>

          {/* 응시 이력 버튼 */}
          <Link
            href="/app/questions/history"
            className="w-full bg-white border-2 border-slate-100 rounded-2xl p-5 flex items-center justify-between text-left hover:border-slate-300 transition-all active:scale-[0.98] block shadow-sm"
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