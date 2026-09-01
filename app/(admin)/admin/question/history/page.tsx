"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { History, ArrowRight } from "lucide-react";

export default function ExamHistoryPage() {
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
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <History className="text-indigo-600" size={28} />
        <h2 className="text-2xl font-bold text-slate-800">내 응시 이력</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-500">
              <th className="p-4 text-center">회차 번호</th>
              <th className="p-4">시험명</th>
              <th className="p-4 text-center">점수</th>
              <th className="p-4 text-center">응시 일자</th>
              <th className="p-4 text-center">상세 보기</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isFetching ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">불러오는 중...</td></tr>
            ) : history.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">응시 이력이 없습니다.</td></tr>
            ) : (
              history.map((session: any) => (
                <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-center text-slate-500 font-medium">{session.id}</td>
                  <td className="p-4 font-bold text-slate-800">{session.examTitle}</td>
                  <td className="p-4 text-center">
                    <span className={`font-bold ${session.totalScore >= 60 ? "text-emerald-600" : "text-rose-500"}`}>
                      {session.totalScore}점
                    </span>
                  </td>
                  <td className="p-4 text-center text-sm text-slate-500">
                    {new Date(session.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                    <Link 
                      href={`/admin/question/result/${session.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      결과 확인 <ArrowRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}