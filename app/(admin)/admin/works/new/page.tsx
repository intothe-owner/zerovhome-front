"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FolderPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function WorkSiteCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      return alert("현장명을 입력해주세요.");
    }

    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/api/work-sites`, {
        title,
        description,
        hasSurvey: false,
        listVisibleFields: [],
        detailVisibleFields: []
      });
      
      alert("현장이 성공적으로 개설되었습니다.");
      router.push("/admin/works"); // 등록 완료 후 목록으로 이동
    } catch (err) {
      console.error("현장 생성 에러:", err);
      alert("현장 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link 
          href="/admin/works"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={18} />
          목록으로 돌아가기
        </Link>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <FolderPlus className="text-indigo-600" />
          신규 현장 개설
        </h2>
        
        <form onSubmit={handleCreateSite} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">현장명 (필수)</label>
            <input 
              type="text" 
              placeholder="예: 2026년 하반기 에어컨 분해청소 및 방역 사업" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-slate-800"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">현장 설명 (선택)</label>
            <textarea 
              placeholder="작업 기간, 발주처, 주요 유의사항 등을 메모할 수 있습니다." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all min-h-[140px] resize-y font-medium text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Link 
              href="/admin/works"
              className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              취소
            </Link>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {loading ? "개설 중..." : "현장 개설 완료"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}