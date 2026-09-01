"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { Trophy, AlertCircle, Home, List } from "lucide-react";

export default function ExamResultPage() {
  const params = useParams();
  const router = useRouter();
  
  // 파라미터가 배열일 경우를 대비해 첫 번째 값을 가져옵니다.
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
  
  const [resultData, setResultData] = useState<any>(null);
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  useEffect(() => {
    // API를 통해 DB에서 확실하게 결과 데이터 가져오기
    const fetchResult = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/questions/exams/${sessionId}/result`);
        if (res.data.ok) {
          setResultData(res.data.result);
        }
      } catch (err) {
        console.error("결과 조회 에러:", err);
        alert("결과 데이터를 불러오지 못했습니다.");
        router.push("/admin/question/history");
      }
    };
    
    if (sessionId) {
      fetchResult();
    }
  }, [sessionId, router, API_BASE_URL]);

  // 데이터를 불러오는 중일 때 보여줄 UI
  if (!resultData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl font-bold text-slate-500 animate-pulse">
          시험 결과를 불러오는 중입니다...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 pb-20">
      {/* 요약 점수 카드 */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-3xl p-10 text-center text-white shadow-lg">
        <Trophy size={64} className="mx-auto mb-4 text-yellow-300" />
        <h2 className="text-3xl font-bold mb-2">시험 상세 결과</h2>
        <p className="text-indigo-100 mb-6">
          총 {resultData.totalQuestions}문제 중 {resultData.correctCount}문제를 맞췄습니다.
        </p>
        <div className="text-6xl font-extrabold">{resultData.totalScore}점</div>
      </div>

      {/* 오답 노트 영역 */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
          <AlertCircle className="text-rose-500" />
          상세 결과 및 오답 노트
        </h3>

        {resultData.answers.map((ans: any, idx: number) => {
          const q = ans.questionInfo;
          
          return (
            <div 
              key={idx} 
              className={`p-6 rounded-2xl border-2 ${
                ans.isCorrect ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
              }`}
            >
              <div className="flex gap-4">
                {/* 정답/오답 아이콘 */}
                <div className={`mt-1 font-black text-2xl ${
                  ans.isCorrect ? "text-emerald-500" : "text-rose-500"
                }`}>
                  {ans.isCorrect ? "O" : "X"}
                </div>
                
                <div className="flex-1">
                  {/* 문제 본문 */}
                  <h4 className="font-bold text-slate-800 text-lg mb-4 leading-relaxed">
                    {idx + 1}. {q.content}
                  </h4>
                  
                  {/* 보기 영역 (사용자가 풀 당시의 섞인 보기 배열 기준) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {ans.shuffledOptions.map((opt: string, oIdx: number) => {
                      // 섞인 보기 기준으로 정답인지 확인
                      const isRealAnswer = ans.correctAnswer === oIdx;
                      // 사용자가 선택한 답인지 확인
                      const isMyAnswer = ans.submittedAnswer === oIdx;
                      
                      let bgClass = "bg-white border-slate-200 text-slate-600";
                      
                      if (isRealAnswer) {
                        // 실제 정답인 보기는 초록색으로 강조
                        bgClass = "bg-emerald-100 border-emerald-400 text-emerald-800 font-bold ring-2 ring-emerald-400 ring-offset-1";
                      } else if (isMyAnswer && !ans.isCorrect) {
                        // 내가 골랐지만 틀린 보기는 빨간색 취소선으로 표시
                        bgClass = "bg-rose-100 border-rose-400 text-rose-800 line-through opacity-80";
                      }

                      return (
                        <div key={oIdx} className={`p-3 rounded-xl border ${bgClass} flex items-center gap-2`}>
                          <span className="shrink-0 w-6 h-6 rounded-full bg-black/5 flex items-center justify-center text-sm">
                            {oIdx + 1}
                          </span>
                          <span className="break-keep">{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* 해설 영역 */}
                  {q.explanation && (
                    <div className="mt-4 p-4 bg-white/80 rounded-xl border border-slate-200 text-slate-700 text-sm leading-relaxed">
                      <strong className="text-slate-900 block mb-1">💡 해설</strong> 
                      {q.explanation}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 네비게이션 버튼 */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8 border-t border-slate-200">
        <Link 
          href="/admin/question/history" 
          className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-6 py-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
        >
          <List size={20} />
          응시 이력 보기
        </Link>
        <Link 
          href="/admin/question" 
          className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-6 py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors shadow-md"
        >
          <Home size={20} />
          메인으로 돌아가기
        </Link>
      </div>
    </div>
  );
}