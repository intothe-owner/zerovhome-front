"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { History, ArrowLeft, ChevronRight } from "lucide-react";

export default function MobileHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/questions/exams/history`);
        if (res.data.ok) {
          setHistory(res.data.data);
        }
      } catch (err) {
        console.error("이력 조회 실패:", err);
      } finally {
        setIsFetching(false);
      }
    };
    fetchHistory();
  }, [API_BASE_URL]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto w-full">
      {/* 헤더 */}
      <header className="bg-white px-5 py-4 border-b border-slate-200 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={() => router.push("/app/questions")} className="p-1 -ml-1 text-slate-600 active:bg-slate-100 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <History className="text-indigo-600" size={22} />
          내 응시 이력
        </h1>
      </header>

      {/* 이력 리스트 (카드 형태) */}
      <div className="p-5 space-y-4 overflow-y-auto pb-10">
        {isFetching ? (
          <div className="text-center py-10 text-slate-500 font-medium">기록을 불러오는 중입니다...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
            아직 응시한 내역이 없습니다.
          </div>
        ) : (
          history.map((session: any) => {
            const isPass = session.totalScore >= 60;
            return (
              <Link 
                key={session.id}
                href={`/app/questions/result/${session.id}`}
                className="block bg-white p-5 rounded-2xl border border-slate-200 shadow-sm active:bg-slate-50 active:scale-[0.98] transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                      회차 {session.id}
                    </span>
                    <h3 className="font-bold text-slate-800 mt-2">{session.examTitle}</h3>
                  </div>
                  <div className={`text-2xl font-black ${isPass ? "text-emerald-500" : "text-rose-500"}`}>
                    {session.totalScore}점
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    {new Date(session.createdAt).toLocaleDateString()} {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex items-center text-indigo-600 text-sm font-bold">
                    결과 보기 <ChevronRight size={16} />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}