"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { CheckCircle2, ChevronRight, ChevronLeft, Loader2, ArrowLeft, RotateCcw } from "lucide-react";

export default function MobileRetryPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false); // 제출(채점) 여부

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  useEffect(() => {
    const fetchIncorrectQuestions = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/questions/exams/${sessionId}/incorrect`);
        if (res.data.ok) {
          setQuestions(res.data.data);
        }
      } catch (err) {
        alert("오답 문제를 불러오는데 실패했거나 틀린 문제가 없습니다.");
        router.back();
      }
    };
    if (sessionId) fetchIncorrectQuestions();
  }, [sessionId, router, API_BASE_URL]);

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    if (isSubmitted) return; // 제출 후에는 클릭 방지
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) {
      if (!confirm("아직 풀지 않은 문제가 있습니다. 채점하시겠습니까?")) return;
    }
    // 프론트엔드 단에서 즉시 채점 모드로 전환
    setIsSubmitted(true);
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
        <p className="text-slate-500 font-bold">오답 노트 준비 중...</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  // 현재 문제의 채점 결과
  const isCorrect = answers[currentQ.id] === currentQ.answer;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto w-full">
      {/* 상단 헤더 및 진행률 */}
      <header className="bg-white p-4 border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="text-slate-600 active:bg-slate-100 p-1 rounded-full">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <RotateCcw className="text-rose-500" size={20} />
            오답 다시 풀기
          </h1>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-slate-700 text-sm">문제 {currentIndex + 1}</span>
          <span className="text-rose-500 font-bold text-sm">{currentIndex + 1} / {questions.length}</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-rose-500 h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </header>

      {/* 문제 영역 */}
      <div className="flex-1 overflow-y-auto p-5 pb-24">
        {/* 채점 결과 표시 (제출 후에만 노출) */}
        {isSubmitted && (
          <div className={`mb-4 inline-block px-3 py-1 rounded-lg text-sm font-black border ${
            isCorrect ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-rose-100 text-rose-700 border-rose-300"
          }`}>
            {isCorrect ? "정답입니다!" : "오답입니다."}
          </div>
        )}

        <h3 className="text-lg font-bold text-slate-800 mb-6 leading-relaxed break-keep">
          {currentIndex + 1}. {currentQ.content}
        </h3>

        <div className="space-y-3">
          {currentQ.options.map((opt: string, idx: number) => {
            const isSelected = answers[currentQ.id] === idx;
            const isRealAnswer = currentQ.answer === idx;
            
            // 스타일 결정 로직
            let btnStyle = "border-slate-200 bg-white";
            let circleStyle = "bg-slate-200 text-slate-600";

            if (!isSubmitted) {
              if (isSelected) {
                btnStyle = "border-indigo-600 bg-indigo-50";
                circleStyle = "bg-indigo-600 text-white";
              }
            } else {
              // 제출 후 화면
              if (isRealAnswer) {
                btnStyle = "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-400 ring-offset-1";
                circleStyle = "bg-emerald-500 text-white";
              } else if (isSelected && !isRealAnswer) {
                btnStyle = "border-rose-300 bg-rose-50 opacity-60";
                circleStyle = "bg-rose-400 text-white";
              }
            }

            return (
              <div
                key={idx}
                onClick={() => handleSelectOption(currentQ.id, idx)}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  !isSubmitted && "active:scale-[0.99] cursor-pointer"
                } ${btnStyle}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${circleStyle}`}>
                    {idx + 1}
                  </div>
                  <span className={`font-medium break-keep ${isSubmitted && isSelected && !isRealAnswer ? "line-through text-rose-500" : "text-slate-700"}`}>
                    {opt}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 해설 표시 (제출 후에만 노출) */}
        {isSubmitted && currentQ.explanation && (
          <div className="mt-6 p-4 bg-white rounded-xl border border-slate-200 text-slate-700 text-sm leading-relaxed shadow-sm">
            <strong className="text-slate-900 block mb-1">💡 해설</strong> 
            {currentQ.explanation}
          </div>
        )}
      </div>

      {/* 하단 고정 버튼 */}
      <div className="bg-white border-t border-slate-200 p-4 fixed bottom-0 w-full max-w-md flex justify-between gap-3">
        <button
          onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
          disabled={currentIndex === 0}
          className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-1 active:bg-slate-200 transition-colors"
        >
          <ChevronLeft size={20} /> 이전
        </button>

        {!isSubmitted && currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            className="flex-1 py-3.5 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-1 active:bg-emerald-700 transition-colors"
          >
            <CheckCircle2 size={20} /> 빠른 채점
          </button>
        ) : (
          <button
            onClick={() => {
              if (currentIndex === questions.length - 1) router.back();
              else setCurrentIndex((p) => Math.min(questions.length - 1, p + 1));
            }}
            className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-1 active:bg-indigo-700 transition-colors"
          >
            {currentIndex === questions.length - 1 ? "학습 종료" : "다음"} <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}