"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Trash2, Save, AlignLeft, CheckSquare, FolderKanban } from "lucide-react";

type QuestionType = "MULTIPLE_CHOICE" | "SUBJECTIVE";

interface Question {
  type: QuestionType;
  question: string;
  options?: string[];
}

export default function SurveyFormConfigPage() {
  const params = useParams();
  const siteId = params.id;
  const router = useRouter();

  const [siteTitle, setSiteTitle] = useState(""); // 💡 현장명 상태 추가
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  const fetchData = async () => {
    try {
      // 1. 현장 정보 조회 (현장명 표시용)
      const siteRes = await axios.get(`${API_BASE_URL}/api/work-sites`);
      const currentSite = siteRes.data.data.find((s: any) => s.id === Number(siteId));
      if (currentSite) {
        setSiteTitle(currentSite.title);
      }

      // 2. 설문조사 폼 조회
      const res = await axios.get(`${API_BASE_URL}/api/site-surveys/work-sites/${siteId}/survey`);
      if (res.data.ok && res.data.data) {
        setTitle(res.data.data.title || "");
        setDescription(res.data.data.description || "");
        setQuestions(res.data.data.questions || []);
      }
    } catch (err) {
      console.log("설문조사 데이터 또는 현장 정보를 불러오지 못했습니다.");
    }
  };

  useEffect(() => {
    if (siteId) fetchData();
  }, [siteId]);

  const addQuestion = (type: QuestionType) => {
    setQuestions([...questions, { 
      type, 
      question: "", 
      options: type === "MULTIPLE_CHOICE" ? ["매우 만족", "만족", "보통", "불만족", "매우 불만족"] : undefined 
    }]);
  };

  const updateQuestionText = (index: number, text: string) => {
    const updated = [...questions];
    updated[index].question = text;
    setQuestions(updated);
  };

  const updateOptionText = (qIndex: number, oIndex: number, text: string) => {
    const updated = [...questions];
    if (updated[qIndex].options) {
      updated[qIndex].options![oIndex] = text;
    }
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      return alert("설문 제목을 입력해주세요.");
    }
    if (questions.some(q => !q.question.trim())) {
      return alert("모든 문항의 질문 내용을 입력해주세요.");
    }

    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/api/site-surveys/work-sites/${siteId}/survey`, {
        title,
        description,
        questions
      });
      alert("설문 양식이 저장되었습니다.");
      router.push(`/admin/works/${siteId}`);
    } catch (err) {
      alert("설문 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/admin/works/${siteId}`} className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="text-indigo-600" />
              설문조사 문항 설정
            </h2>
          </div>
        </div>
        {/* 💡 현재 현장명 뱃지 표시 */}
        {siteTitle && (
          <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-xl text-sm font-bold">
            <FolderKanban size={16} />
            현장: {siteTitle}
          </div>
        )}
      </div>

      {/* 설문 타이틀 및 내용 설정 카드 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <h3 className="text-lg font-bold text-slate-800">설문 기본 정보</h3>
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">설문 제목 (필수)</label>
          <input 
            type="text" 
            placeholder="예: 2026년 상반기 경로당 방역 서비스 만족도 조사" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">설문 안내 내용 / 설명 (선택)</label>
          <textarea 
            placeholder="고객분들께 전달할 안내 문구나 인사말을 입력하세요." 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-y text-slate-800"
          />
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <button onClick={() => addQuestion("MULTIPLE_CHOICE")} className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-200 text-indigo-700 font-bold rounded-lg hover:bg-indigo-50">
          <CheckSquare size={18} /> 객관식 추가
        </button>
        <button onClick={() => addQuestion("SUBJECTIVE")} className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-emerald-200 text-emerald-700 font-bold rounded-lg hover:bg-emerald-50">
          <AlignLeft size={18} /> 주관식 추가
        </button>
      </div>

      <div className="space-y-6">
        {questions.length === 0 && (
          <div className="text-center p-12 bg-white rounded-2xl border border-slate-200 border-dashed text-slate-400 font-medium">
            상단 버튼을 눌러 설문 문항을 추가해주세요.
          </div>
        )}

        {questions.map((q, qIndex) => (
          <div key={qIndex} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative group">
            <button 
              onClick={() => removeQuestion(qIndex)}
              className="absolute top-4 right-4 text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
            >
              <Trash2 size={18} />
            </button>
            
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${q.type === 'MULTIPLE_CHOICE' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {q.type === 'MULTIPLE_CHOICE' ? '객관식' : '주관식'}
              </span>
              <span className="font-bold text-slate-500">Q{qIndex + 1}.</span>
            </div>

            <input 
              type="text" 
              placeholder="질문을 입력하세요" 
              value={q.question}
              onChange={(e) => updateQuestionText(qIndex, e.target.value)}
              className="w-full px-4 py-2 mb-4 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
            />

            {q.type === "MULTIPLE_CHOICE" && q.options && (
              <div className="pl-4 space-y-2 border-l-2 border-indigo-100">
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                    <input 
                      type="text" 
                      value={opt}
                      onChange={(e) => updateOptionText(qIndex, oIndex, e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm border-b border-slate-200 focus:outline-none focus:border-indigo-500 bg-transparent text-slate-600"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm"
        >
          <Save size={20} />
          {loading ? "저장 중..." : "설문조사 최종 저장"}
        </button>
      </div>
    </div>
  );
}