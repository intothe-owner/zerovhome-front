"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  RefreshCw,
  CheckCircle2,
  FileText,
  AlertCircle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type SurveyQuestionType = "multiple" | "subjective";

type MultipleChoiceQuestion = {
  id: string;
  type: "multiple";
  question: string;
  options: [string, string, string, string, string];
};

type SubjectiveQuestion = {
  id: string;
  type: "subjective";
  question: string;
};

type SurveyQuestion = MultipleChoiceQuestion | SubjectiveQuestion;

// 임시 ID 생성기
const generateId = () => Math.random().toString(36).substring(2, 9);

const createMultipleQuestion = (): MultipleChoiceQuestion => ({
  id: generateId(),
  type: "multiple",
  question: "",
  options: ["", "", "", "", ""],
});

const createSubjectiveQuestion = (): SubjectiveQuestion => ({
  id: generateId(),
  type: "subjective",
  question: "",
});

export default function AdminSurveyUI() {
  const queryClient = useQueryClient();

  const [surveyTitle, setSurveyTitle] = useState("");
  const [surveyIntro, setSurveyIntro] = useState("");

  const [draftType, setDraftType] = useState<SurveyQuestionType>("multiple");
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [submittedQuestions, setSubmittedQuestions] = useState<SurveyQuestion[]>([]);
  
  const [message, setMessage] = useState("");

  // --- API: 활성 설문 조회 (GET /api/survey/active) ---
  const { data: activeSurveyData, isLoading: isFetching } = useQuery({
    queryKey: ["activeSurvey"],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/survey/active`);
      if (!res.ok) {
        if (res.status === 404) return null; // 활성 설문이 없는 경우
        throw new Error("설문 정보를 불러오는데 실패했습니다.");
      }
      return res.json();
    },
  });

  // 서버에서 불러온 데이터를 폼과 미리보기에 동기화
  useEffect(() => {
    if (activeSurveyData?.item) {
      const { title, intro, questions: savedQuestions } = activeSurveyData.item;
      setSurveyTitle(title || "");
      setSurveyIntro(intro || "");
      
      const parsed = typeof savedQuestions === "string" 
        ? JSON.parse(savedQuestions) 
        : (savedQuestions || []);
        
      setQuestions(parsed);
      setSubmittedQuestions(parsed);
    } else if (activeSurveyData === null) {
      setSurveyTitle("2026년 해운대구 냉방기 클린UP 건강프로젝트 사업 만족도조사");
      setSurveyIntro("안녕하세요?\n본 설문의 목적은 사업 만족도 조사를 통해 더 나은 서비스를 제공하고 의견을 반영하기 위함입니다. 바쁘시더라도 정성껏 응답해 주시기 바랍니다.");
      setQuestions([]);
      setSubmittedQuestions([]);
    }
  }, [activeSurveyData]);

  // --- API: 설문 저장 Mutation (POST /api/survey) ---
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: surveyTitle,
        intro: surveyIntro,
        questions: questions,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/survey`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "설문 등록에 실패했습니다.");
      return data;
    },
    onSuccess: (data) => {
      setMessage(data.message || "설문이 성공적으로 저장되었습니다.");
      
      const normalizedSubmitted = questions.map((q) =>
        q.type === "multiple"
          ? { ...q, options: [...q.options] as [string, string, string, string, string] }
          : { ...q }
      );
      setSubmittedQuestions(normalizedSubmitted);
      
      // 최신 상태 리패치
      queryClient.invalidateQueries({ queryKey: ["activeSurvey"] });
    },
    onError: (error: Error) => {
      setMessage(`저장 실패: ${error.message}`);
    },
  });

  // --- API: 설문 초기화/삭제 Mutation (DELETE /api/survey/active) ---
  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/survey/active`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok && res.status !== 404) {
        throw new Error(data.message || "설문 초기화에 실패했습니다.");
      }
      return data;
    },
    onSuccess: (data) => {
      setSurveyTitle("2026년 해운대구 냉방기 클린UP 건강프로젝트 사업 만족도조사");
      setSurveyIntro("안녕하세요?\n본 설문의 목적은 사업 만족도 조사를 통해 더 나은 서비스를 제공하고 의견을 반영하기 위함입니다. 바쁘시더라도 정성껏 응답해 주시기 바랍니다.");
      setQuestions([]);
      setSubmittedQuestions([]);
      setMessage(data.message || "설문이 초기화되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["activeSurvey"] });
    },
    onError: (error: Error) => {
      setMessage(`초기화 실패: ${error.message}`);
    },
  });

  // 등록(저장) 가능 여부 판별
  const canSubmit = useMemo(() => {
    if (!surveyTitle.trim()) return false;
    if (questions.length === 0) return false;

    return questions.every((q) => {
      if (!q.question.trim()) return false;
      if (q.type === "multiple") {
        return q.options.every((opt) => opt.trim());
      }
      return true;
    });
  }, [surveyTitle, questions]);

  // --- UI 핸들러 ---
  const handleAddQuestion = () => {
    setMessage("");
    if (draftType === "multiple") {
      setQuestions((prev) => [...prev, createMultipleQuestion()]);
    } else {
      setQuestions((prev) => [...prev, createSubjectiveQuestion()]);
    }
  };

  const handleChangeQuestionType = (index: number, type: SurveyQuestionType) => {
    setQuestions((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (type === "multiple") {
          return {
            id: item.id,
            type: "multiple",
            question: item.question,
            options: ["", "", "", "", ""],
          };
        }
        return {
          id: item.id,
          type: "subjective",
          question: item.question,
        };
      })
    );
  };

  const handleChangeQuestionText = (index: number, value: string) => {
    setQuestions((prev) =>
      prev.map((item, i) => (i === index ? { ...item, question: value } : item))
    );
  };

  const handleChangeOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((item, i) => {
        if (i !== questionIndex || item.type !== "multiple") return item;
        const nextOptions = [...item.options] as [string, string, string, string, string];
        nextOptions[optionIndex] = value;
        return { ...item, options: nextOptions };
      })
    );
  };

  const handleRemoveQuestion = (index: number) => {
    setMessage("");
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    setMessage("");
    setQuestions((prev) => {
      const next = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const handleResetAll = () => {
    setMessage("");
    if (window.confirm("현재 활성 설문을 삭제 및 초기화하시겠습니까?")) {
      resetMutation.mutate();
    }
  };

  const handleSubmitSurvey = () => {
    if (!canSubmit) return;
    setMessage("");
    saveMutation.mutate();
  };

  const inputClass = "w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-indigo-500 bg-white transition-colors";

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-indigo-600" size={36} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative pb-12">
      
      {/* 헤더 섹션 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8 mt-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">설문조사 등록</h2>
          <p className="mt-1 text-sm text-slate-500">
            객관식 또는 서술식 문항을 추가하고 등록하면 DB와 미리보기에 반영됩니다.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetAll}
          disabled={resetMutation.isPending}
          className="inline-flex items-center gap-2 justify-center rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 transition-all shadow-sm"
        >
          <RefreshCw size={16} className={resetMutation.isPending ? "animate-spin" : ""} />
          {resetMutation.isPending ? "초기화 중..." : "설문 완전 초기화 (삭제)"}
        </button>
      </div>

      {/* 상태 메시지 */}
      {message && (
        <div className={`rounded-xl border p-4 text-sm font-semibold flex items-center gap-2 shadow-sm ${
          message.includes("실패") ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}>
          {message.includes("실패") ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {message}
        </div>
      )}

      {/* 2단 그리드 레이아웃 (좌: 에디터 / 우: 미리보기) */}
      <section className="grid grid-cols-1 xl:grid-cols-[560px_minmax(0,1fr)] gap-8">
        
        {/* ================= 좌측: 에디터 ================= */}
        <div className="space-y-6">
          
          {/* 1. 기본 정보 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-extrabold text-slate-800 mb-5 flex items-center gap-2">
              <FileText size={20} className="text-indigo-600"/> 기본 정보
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">설문 제목</label>
                <input
                  type="text"
                  value={surveyTitle}
                  onChange={(e) => { setMessage(""); setSurveyTitle(e.target.value); }}
                  className={inputClass}
                  placeholder="설문 제목을 입력하세요"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">안내 문구</label>
                <textarea
                  value={surveyIntro}
                  onChange={(e) => { setMessage(""); setSurveyIntro(e.target.value); }}
                  rows={4}
                  className={inputClass}
                  placeholder="설문 안내 문구를 입력하세요"
                />
              </div>
            </div>
          </section>

          {/* 2. 문항 추가 컨트롤 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="mb-2 block text-sm font-bold text-slate-700">문항 유형</label>
              <select
                value={draftType}
                onChange={(e) => { setMessage(""); setDraftType(e.target.value as SurveyQuestionType); }}
                className={inputClass}
              >
                <option value="multiple">객관식 (5지선다)</option>
                <option value="subjective">서술식 (주관식)</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
            >
              <Plus size={18} /> 문항 추가
            </button>
          </section>

          {/* 3. 문항 리스트 작성 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-slate-800">문항 작성</h3>
              <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">총 {questions.length}개</span>
            </div>

            {questions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
                아직 추가된 문항이 없습니다.<br/>위에서 문항을 추가해주세요.
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 relative group">
                    
                    {/* 문항 헤더 (번호, 타입변경, 이동/삭제) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-black text-sm">
                          {index + 1}
                        </span>
                        <select
                          value={question.type}
                          onChange={(e) => handleChangeQuestionType(index, e.target.value as SurveyQuestionType)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold outline-none focus:border-indigo-500 bg-white"
                        >
                          <option value="multiple">객관식</option>
                          <option value="subjective">서술식</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(index, "up")}
                          className="p-1.5 rounded-lg border border-slate-300 text-slate-500 hover:bg-white hover:text-indigo-600 transition-colors bg-transparent"
                          title="위로"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(index, "down")}
                          className="p-1.5 rounded-lg border border-slate-300 text-slate-500 hover:bg-white hover:text-indigo-600 transition-colors bg-transparent"
                          title="아래로"
                        >
                          <ArrowDown size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(index)}
                          className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors bg-white ml-2"
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* 질문 내용 */}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase">질문 내용</label>
                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) => handleChangeQuestionText(index, e.target.value)}
                        className={inputClass}
                        placeholder="질문 내용을 입력하세요"
                      />
                    </div>

                    {/* 객관식 보기 입력 */}
                    {question.type === "multiple" && (
                      <div className="mt-5 space-y-3">
                        <label className="block text-xs font-bold text-slate-500 uppercase">보기 항목 (5개)</label>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-3">
                              <span className="text-sm font-bold text-slate-400 w-5 text-right">{optionIndex + 1}.</span>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => handleChangeOption(index, optionIndex, e.target.value)}
                                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white"
                                placeholder={`보기 ${optionIndex + 1}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 저장 버튼 */}
            <div className="mt-8 border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={handleSubmitSurvey}
                disabled={!canSubmit || saveMutation.isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 transition-all shadow-md active:scale-95"
              >
                {saveMutation.isPending ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                {saveMutation.isPending ? "저장 중..." : "설문 등록 및 미리보기 갱신"}
              </button>
            </div>
          </section>
        </div>


        {/* ================= 우측: 미리보기 ================= */}
        <div>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-6">
            <div className="mb-6">
              <h3 className="text-lg font-extrabold text-slate-800">설문 미리보기</h3>
              <p className="mt-1 text-sm text-slate-500">
                DB에 저장된 설문이 사용자에게 보여지는 화면입니다.
              </p>
            </div>

            {/* A4 용지 / 문서 스타일 미리보기 영역 */}
            <div className="mx-auto border border-slate-300 bg-white p-6 sm:p-8 rounded shadow-sm max-h-[800px] overflow-y-auto custom-scrollbar">
              
              {/* 문서 헤더 */}
              <div className="text-center mb-6">
                <div className="inline-block bg-slate-100 px-5 py-3 text-center text-lg font-black text-slate-900 border-b-2 border-slate-900">
                  {surveyTitle || "설문 제목"}
                </div>
              </div>

              {/* 문서 안내문 */}
              <div className="mb-8 bg-slate-50 p-4 border border-slate-200 rounded text-[14px] leading-7 whitespace-pre-wrap text-slate-700 font-medium">
                {surveyIntro || "설문 안내 문구가 여기에 표시됩니다."}
              </div>

              {/* 문항 목록 */}
              <div className="space-y-8">
                {submittedQuestions.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-lg">
                    등록된 설문 문항이 없습니다.
                  </div>
                ) : (
                  submittedQuestions.map((question, index) => (
                    <div key={question.id} className="text-slate-900">
                      <div className="text-[15px] font-bold leading-7 mb-3">
                        {question.type === "multiple" 
                          ? `${index + 1}. ${question.question}` 
                          : `${index + 1}. ${question.question}`}
                      </div>

                      {question.type === "multiple" ? (
                        <div className="border border-slate-300 p-4 rounded bg-slate-50/50">
                          <div className="grid grid-cols-1 gap-y-3 md:grid-cols-2 md:gap-x-6">
                            {question.options.map((option, optionIndex) => (
                              <label key={optionIndex} className="flex items-start gap-2.5 text-[14px] font-medium text-slate-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`preview-q-${question.id}`}
                                  className="mt-1 w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="leading-tight pt-0.5">
                                  ({optionIndex + 1}) {option || <span className="text-slate-300 italic">빈 보기</span>}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 min-h-[100px] border border-slate-300 rounded bg-slate-50/50 p-3">
                          <p className="text-sm text-slate-400 italic">서술형 답변 입력란</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* 문서 하단 */}
              <div className="mt-12 pt-6 border-t border-slate-300 text-center space-y-4">
                <div className="text-[14px] font-bold text-slate-800 bg-slate-100 py-2 rounded">
                  본 서비스에 대한 의견을 확인합니다.
                </div>
                <div className="text-[14px] font-bold text-slate-700">
                  {new Date().getFullYear()}년&nbsp;&nbsp;&nbsp;&nbsp;월&nbsp;&nbsp;&nbsp;&nbsp;일&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;성명&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(서명)
                </div>
              </div>

            </div>
          </section>
        </div>

      </section>

      {/* 스크롤바 스타일링 */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8; 
        }
      `}} />
    </div>
  );
}