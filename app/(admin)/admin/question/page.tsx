"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, Play, Search, History } from "lucide-react";

export default function QuestionListPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  const fetchQuestions = async () => {
    try {
      setIsFetching(true);
      // 예시용 엔드포인트: 필요에 따라 회차별(examTitle) 그룹핑 API로 변경 가능
      const res = await axios.get(`${API_BASE_URL}/api/questions?pageSize=10`);
      if (res.data.ok) {
        setQuestions(res.data.data);
      }
    } catch (err) {
      console.error("문제 목록 조회 실패:", err);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleStartMockTest = async () => {
    if (confirm("60문제 랜덤 모의고사를 시작하시겠습니까?")) {
      try {
        const res = await axios.post(`${API_BASE_URL}/api/questions/exams/start`, {
          examTitle: "랜덤 모의고사",
        });
        if (res.data.ok) {
          const sessionId = res.data.data.id;
          router.push(`/admin/question/solve/${sessionId}`);
        }
      } catch (error) {
        alert("모의고사 생성에 실패했습니다.");
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="text-indigo-600" />
          CBT 문제 관리
        </h2>
        <div className="flex gap-3">
            <Link
            href="/admin/question/history"
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <History size={18} className="text-slate-500" />
            응시 이력
          </Link>
          <button
            onClick={handleStartMockTest}
            className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Play size={18} />
            모의고사 응시
          </button>
          <Link
            href="/admin/question/new"
            className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={18} />
            엑셀 문제 등록
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Search size={20} className="text-slate-500" />
            최근 등록된 문제 목록 (미리보기)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-sm font-semibold text-slate-500">
                <th className="p-4 w-20 text-center">ID</th>
                <th className="p-4 w-40 text-center">회차명</th>
                <th className="p-4">문제 내용</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isFetching ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-400">데이터를 불러오는 중입니다...</td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-400">등록된 문제가 없습니다.</td>
                </tr>
              ) : (
                questions.map((q: any) => (
                  <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-center text-slate-500 font-medium">{q.id}</td>
                    <td className="p-4 text-center font-bold text-slate-800">{q.examTitle}</td>
                    <td className="p-4 text-slate-600 text-sm truncate max-w-md">{q.content}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}