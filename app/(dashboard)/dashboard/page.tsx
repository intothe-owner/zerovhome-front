"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, FolderKanban, Plus, Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function MyDashboardPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [cleanToken, setCleanToken] = useState<string | null>(null);
  
  // 로그인한 유저 정보를 잠시 보관 (이름 등 표시용)
  const [userName, setUserName] = useState<string>("고객");

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  // 1. 컴포넌트 마운트 시 토큰 및 유저 정보 검증
  useEffect(() => {
    const rawToken = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!rawToken) {
      router.replace("/login");
    } else {
      setCleanToken(rawToken.replace(/^['"]|['"]$/g, ""));
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserName(user.name || user.companyName || "고객");
        } catch (e) {
          console.error("유저 정보 파싱 오류", e);
        }
      }
      setIsCheckingAuth(false);
    }
  }, [router]);

  // 2. 내 현장 목록 페칭 (기존 코드처럼 getAuthHeaders 로직을 쿼리 안에 녹여냄)
  const { data: mySites, isLoading, error } = useQuery({
    queryKey: ["workSites", "myList"],
    queryFn: async () => {
      // ✅ 포인트: 백엔드에서 '/api/work-sites/my-sites' 라우터를 통해 토큰의 ID와 일치하는 현장만 반환해야 합니다.
      const response = await axios.get(`${API_BASE_URL}/api/work-sites/my-sites`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cleanToken}`,
        },
      });
      // 응답 구조가 res.data.data 인지 res.data 인지 백엔드 상황에 맞게 처리
      return response.data.ok ? response.data.data : response.data;
    },
    enabled: !!cleanToken && !isCheckingAuth,
  });

  if (isCheckingAuth || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl max-w-2xl mx-auto mt-10">
        데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
      </div>
    );
  }

  const sitesList = Array.isArray(mySites) ? mySites : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pt-10">
      
      {/* 1. 페이지 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FolderKanban className="text-indigo-600" size={32} />
            {userName}님의 현장
          </h1>
          <p className="mt-2 text-base text-slate-500 font-medium">
            현재 배정되었거나 진행 중인 현장 목록입니다. 현장을 선택하여 세부 업무를 관리하세요.
          </p>
        </div>
        
        {/* 기업 회원이 스스로 현장을 등록할 수 있다면 유지, 아니면 이 버튼은 숨길 수 있습니다. */}
        <Link 
          href="/dashboard/works/new"
          className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm shrink-0"
        >
          <Plus size={18} />
          새 현장 등록
        </Link>
      </div>

      {/* 2. 통계 바 */}
      <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <Search size={18} className="text-slate-400" />
        전체 진행 현장: <span className="text-indigo-600 text-base">{sitesList.length}</span> 건
      </div>

      {/* 3. 그리드 카드 뷰 (기존 MyPageHome의 직관적인 디자인 활용) */}
      {sitesList.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
          <FolderKanban size={48} className="text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">등록된 현장이 없습니다.</h3>
          <p className="text-slate-500 text-sm">현재 귀하에게 배정된 현장 데이터가 존재하지 않습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sitesList.map((site: any, index: number) => {
            // MyPageHome에서 쓰던 컬러풀한 카드 스타일 대신, 좀 더 깔끔하고 통일감 있는 비즈니스 UI로 변경
            return (
              <Link 
                key={site.id}
                href={`/dashboard/works/${site.id}`}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 transition-all hover:-translate-y-1 hover:shadow-md hover:border-indigo-300 group flex flex-col justify-between h-56"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md">
                      ID: {site.id}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {new Date(site.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h2 className="text-xl font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                    {site.title || site.name}
                  </h2>
                  
                  {site.description && (
                    <p className="mt-3 text-sm text-slate-500 line-clamp-2">
                      {site.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between text-indigo-600">
                  <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    작업 관리하기
                  </span>
                  <ArrowRight size={20} className="transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}