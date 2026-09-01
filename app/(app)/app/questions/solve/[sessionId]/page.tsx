"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { CheckCircle2, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";

export default function MobileExamSolvePage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  useEffect(() => {
    const fetchRandomTest = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/questions/exams/random-test`);
        if (res.data.ok) {
          setQuestions(res.data.data);
        }
      } catch (err) {
        alert("문제를 불러오는데 실패했습니다.");
        router.push("/app/questions");
      }
    };
    fetchRandomTest();
  }, [router, API_BASE_URL]);

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      if (!confirm("아직 풀지 않은 문제가 있습니다. 그래도 제출하시겠습니까?")) return;
    }

    try {
      setIsSubmitting(true);
      
      // 앞서 수정한 대로 섞인 보기도 함께 서버로 전송합니다.
      const submitData = {
        answers: Object.entries(answers).map(([qId, ansIdx]) => {
          const matchedQuestion = questions.find(q => q.id === Number(qId));
          return {
            questionId: Number(qId),
            submittedAnswer: ansIdx,
            shuffledOptions: matchedQuestion.options 
          };
        }),
      };

      await axios.post(`${API_BASE_URL}/api/questions/exams/${sessionId}/answers`, submitData);
      const res = await axios.post(`${API_BASE_URL}/api/questions/exams/${sessionId}/submit`);
      
      if (res.data.ok) {
        router.push(`/app/questions/result/${sessionId}`);
      }
    } catch (err) {
      alert("제출 중 오류가 발생했습니다.");
      setIsSubmitting(false);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
        <p className="text-slate-500 font-bold">시험지 준비 중...</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto w-full">
      {/* 상단 진행률 바 */}
      <div className="bg-white p-4 border-b border-slate-200 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-slate-700 text-sm">문제 {currentIndex + 1}</span>
          <span className="text-indigo-600 font-bold text-sm">{currentIndex + 1} / {questions.length}</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-600 h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 문제 영역 */}
      <div className="flex-1 overflow-y-auto p-5 pb-24">
        <h3 className="text-lg font-bold text-slate-800 mb-6 leading-relaxed break-keep">
          {currentIndex + 1}. {currentQ.content}
        </h3>

        <div className="space-y-3">
          {currentQ.options.map((opt: string, idx: number) => {
            const isSelected = answers[currentQ.id] === idx;
            return (
              <div
                key={idx}
                onClick={() => handleSelectOption(currentQ.id, idx)}
                className={`p-4 rounded-2xl border-2 transition-all active:scale-[0.99] ${
                  isSelected ? "border-indigo-600 bg-indigo-50" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isSelected ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="text-slate-700 font-medium break-keep">{opt}</span>
                </div>
              </div>
            );
          })}
        </div>
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

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3.5 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-1 active:bg-emerald-700 transition-colors"
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
            최종 제출
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex((p) => Math.min(questions.length - 1, p + 1))}
            className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-1 active:bg-indigo-700 transition-colors"
          >
            다음 <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}