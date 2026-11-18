"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FolderPlus, ArrowLeft, Loader2, MapPin } from "lucide-react";
import Link from "next/link";

export default function NewWorkSitePage() {
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [cleanToken, setCleanToken] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  // 1. 토큰 검증 및 정제 (컴포넌트 마운트 시)
  useEffect(() => {
    const rawToken = localStorage.getItem("token");
    if (!rawToken) {
      alert("로그인이 필요합니다.");
      router.replace("/login");
    } else {
      setCleanToken(rawToken.replace(/^['"]|['"]$/g, ""));
      setIsCheckingAuth(false);
    }
  }, [router]);

  // 2. 인증 헤더 생성 함수
  const getAuthHeaders = () => {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cleanToken}`
    };
  };

  // 3. 현장 등록 제출 핸들러
  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      return alert("현장명을 입력해주세요.");
    }

    try {
      setLoading(true);
      
      // ✅ 포인트: 백엔드 API에서 Authorization 헤더의 JWT 토큰을 파싱하여
      // 토큰 안에 들어있는 회원 정보(memberId)를 등록되는 현장 데이터에 매핑해야 합니다.
      await axios.post(`${API_BASE_URL}/api/work-sites`, {
        title,
        address, // 현장 주소 추가 (이전 Daum 주소 검색 확장을 위함)
        description,
        hasSurvey: false, // 기존 관리자 모드 페이로드 유지
        listVisibleFields: [],
        detailVisibleFields: []
      }, {
        headers: getAuthHeaders()
      });
      
      alert("새 현장이 성공적으로 등록되었습니다.");
      router.push("/dashboard"); // 등록 완료 후 기업 회원 대시보드 목록으로 이동
    } catch (err) {
      console.error("현장 등록 에러:", err);
      alert("현장 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 인증 확인 중 로딩 UI
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  // 이전에 Kakao Maps 스크립트 로드 관련 디버깅 경험(2026-04-11)을 바탕으로,
  // 주소 입력란은 향후 react-daum-postcode 모달과 연동하기 쉽도록 구성해 두었습니다.
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 pt-10">
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} />
          대시보드로 돌아가기
        </Link>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="mb-8 border-b border-slate-100 pb-5">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <FolderPlus className="text-indigo-600" size={28} />
            신규 현장 등록
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            새로운 작업 현장의 기본 정보를 입력하여 관리 목록에 추가합니다.
          </p>
        </div>
        
        <form onSubmit={handleCreateSite} className="space-y-6">
          
          {/* 현장명 (기존 관리자 폼 스타일 반영) */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">현장명 (필수)</label>
            <input 
              type="text" 
              placeholder="예: 2026년 하반기 에어컨 분해청소 및 방역 사업" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-slate-800"
              required
            />
          </div>

          
          {/* 현장 설명 (기존 관리자 폼 스타일 반영) */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">현장 설명 및 메모 (선택)</label>
            <textarea 
              placeholder="작업 기간, 발주처, 주요 유의사항 등을 기록할 수 있습니다." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all min-h-[140px] resize-y font-medium text-slate-800"
            />
          </div>

          {/* 하단 버튼 */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Link 
              href="/dashboard"
              className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              취소
            </Link>
            <button 
              type="submit" 
              disabled={loading}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 flex items-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  등록 중...
                </>
              ) : (
                "현장 등록 완료"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}