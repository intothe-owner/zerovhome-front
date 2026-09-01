"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";

export default function ExamSolvePage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId;

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
        router.push("/admin/question");
      }
    };
    fetchRandomTest();
  }, [router]);

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      if (!confirm("아직 풀지 않은 문제가 있습니다. 그래도 제출하시겠습니까?")) return;
    }

    try {
      setIsSubmitting(true);
      const submitData = {
        answers: Object.entries(answers).map(([qId, ansIdx]) => {
          const matchedQuestion = questions.find(q => q.id === Number(qId));
          return {
            questionId: Number(qId),
            submittedAnswer: ansIdx,
            shuffledOptions: matchedQuestion.options // 사용자가 본 섞인 보기 배열
          };
        }),
      };

      // 1. 답안 임시 저장
      await axios.post(`${API_BASE_URL}/api/questions/exams/${sessionId}/answers`, submitData);
      
      // 2. 최종 제출 및 채점
      const res = await axios.post(`${API_BASE_URL}/api/questions/exams/${sessionId}/submit`);
      if (res.data.ok) {
        // 채점 결과를 로컬 스토리지에 저장하여 결과 페이지로 전달
        localStorage.setItem(`examResult_${sessionId}`, JSON.stringify(res.data.result));
        router.push(`/admin/question/result/${sessionId}`);
      }
    } catch (err) {
      alert("제출 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (questions.length === 0) return <div className="p-10 text-center">문제 설정 중...</div>;

  const currentQ = questions[currentIndex];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <span className="font-bold text-slate-700">진행률</span>
        <span className="text-indigo-600 font-bold">{currentIndex + 1} / {questions.length}</span>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold text-slate-800 mb-6 leading-relaxed">
          {currentIndex + 1}. {currentQ.content}
        </h3>

        <div className="space-y-3">
          {currentQ.options.map((opt: string, idx: number) => {
            const isSelected = answers[currentQ.id] === idx;
            return (
              <div
                key={idx}
                onClick={() => handleSelectOption(currentQ.id, idx)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-indigo-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    isSelected ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="text-slate-700 font-medium">{opt}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
          disabled={currentIndex === 0}
          className="px-5 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl disabled:opacity-50 flex items-center gap-2"
        >
          <ChevronLeft size={20} /> 이전
        </button>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2"
          >
            <CheckCircle2 size={20} /> 최종 제출하기
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex((p) => Math.min(questions.length - 1, p + 1))}
            className="px-5 py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2"
          >
            다음 <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}