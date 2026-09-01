"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Trophy, AlertCircle, Home, List, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function MobileResultPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
  
  const [resultData, setResultData] = useState<any>(null);
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  // 1. 데이터 불러오기
  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/questions/exams/${sessionId}/result`);
        if (res.data.ok) {
          setResultData(res.data.result);
        }
      } catch (err) {
        alert("결과 데이터를 불러오지 못했습니다.");
        router.replace("/app/questions");
      }
    };
    if (sessionId) fetchResult();
  }, [sessionId, router, API_BASE_URL]);

  // 2. 안드로이드 하드웨어 뒤로가기 버튼 제어
  useEffect(() => {
    // 현재 페이지 상태를 history에 강제로 하나 더 밀어넣습니다.
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      // 사용자가 뒤로가기를 시도하면(popstate 이벤트 발생), 무조건 메인 페이지로 replace 합니다.
      // push 대신 replace를 사용하여 히스토리가 꼬이는 것을 방지합니다.
      router.replace("/app/questions");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);

  if (!resultData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 max-w-md mx-auto">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
        <div className="font-bold text-slate-500">결과 분석 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto w-full pb-20">
      {/* 헤더 */}
      <header className="bg-white px-5 py-4 border-b border-slate-200 flex items-center gap-3">
        {/* UI 뒤로가기 버튼도 replace를 사용하여 메인으로 이동시킵니다 */}
        <button 
          onClick={() => router.replace("/app/questions")} 
          className="p-1 -ml-1 text-slate-600 active:bg-slate-100 rounded-full"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-slate-800">상세 결과</h1>
      </header>

      <div className="p-5 space-y-6">
        {/* 점수 요약 */}
        <div className="bg-indigo-600 rounded-3xl p-8 text-center text-white shadow-md">
          <Trophy size={48} className="mx-auto mb-3 text-yellow-300" />
          <p className="text-indigo-200 text-sm mb-1">{resultData.totalQuestions}문제 중 {resultData.correctCount}문제 정답</p>
          <div className="text-5xl font-extrabold">{resultData.totalScore}<span className="text-2xl font-medium">점</span></div>
        </div>

        {/* 오답노트 타이틀 */}
        <div className="flex items-center gap-2 font-bold text-slate-800 text-lg border-b border-slate-200 pb-3">
          <AlertCircle className="text-rose-500" size={22} />
          오답 노트
        </div>

        {/* 문제 목록 */}
        <div className="space-y-4">
          {resultData.answers.map((ans: any, idx: number) => {
            const q = ans.questionInfo;
            return (
              <div key={idx} className={`bg-white p-5 rounded-2xl border-2 ${ans.isCorrect ? "border-emerald-100" : "border-rose-100"}`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={`font-black text-xl leading-none mt-0.5 ${ans.isCorrect ? "text-emerald-500" : "text-rose-500"}`}>
                    {ans.isCorrect ? "O" : "X"}
                  </div>
                  <h4 className="font-bold text-slate-800 break-keep leading-relaxed">
                    {idx + 1}. {q.content}
                  </h4>
                </div>
                
                <div className="space-y-2 ml-7 mb-3">
                  {ans.shuffledOptions.map((opt: string, oIdx: number) => {
                    const isRealAnswer = ans.correctAnswer === oIdx;
                    const isMyAnswer = ans.submittedAnswer === oIdx;
                    
                    let bgClass = "bg-slate-50 border-slate-100 text-slate-600";
                    if (isRealAnswer) bgClass = "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold";
                    else if (isMyAnswer && !ans.isCorrect) bgClass = "bg-rose-50 border-rose-200 text-rose-400 line-through";

                    return (
                      <div key={oIdx} className={`p-2.5 rounded-xl border text-sm flex items-center gap-2 ${bgClass}`}>
                        <span className="w-5 h-5 rounded-full bg-black/5 flex items-center justify-center text-xs shrink-0">{oIdx + 1}</span>
                        <span className="break-keep">{opt}</span>
                      </div>
                    );
                  })}
                </div>
                
                {q.explanation && (
                  <div className="ml-7 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 leading-relaxed break-keep">
                    <strong className="text-slate-800 block mb-1">해설: </strong>{q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}