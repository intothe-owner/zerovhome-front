"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, FolderKanban, Plus, Search, FileSpreadsheet, User } from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function MyDashboardPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [cleanToken, setCleanToken] = useState<string | null>(null);
  
  // 로그인한 유저 정보를 잠시 보관 (테이블의 담당자 표기용)
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
          // 회사명이 있으면 괄호 표기, 없으면 이름만
          setUserName(user.companyName ? `${user.name}(${user.companyName})` : user.name || "고객");
        } catch (e) {
          console.error("유저 정보 파싱 오류", e);
        }
      }
      setIsCheckingAuth(false);
    }
  }, [router]);

  // 2. 내 현장 목록 페칭
  const { data: mySites, isLoading, error } = useQuery({
    queryKey: ["workSites", "myList"],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/work-sites/my-sites`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cleanToken}`,
        },
      });
      return response.data.ok ? response.data.data : response.data;
    },
    enabled: !!cleanToken && !isCheckingAuth,
  });

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl max-w-2xl mx-auto mt-10 font-bold border border-red-200">
        데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
      </div>
    );
  }

  const sitesList = Array.isArray(mySites) ? mySites : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pt-10">
      
      {/* 1. 페이지 헤더 (관리자 뷰 스타일 반영) */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FolderKanban className="text-indigo-600" />
            내 현장 관리 목록
          </h2>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            현재 진행 중이거나 배정된 현장입니다.
          </p>
        </div>
        <Link 
          href="/dashboard/works/new"
          className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          신규 현장 개설
        </Link>
      </div>

      {/* 2. 테이블 레이아웃 영역 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* 테이블 상단 통계 바 */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Search size={20} className="text-slate-500" />
            운영 중인 현장 목록
          </h3>
          <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
            총 {sitesList.length}건
          </span>
        </div>
        
        {/* 데스크톱 테이블 뷰 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-sm font-semibold text-slate-500">
                <th className="p-4 w-20 text-center">ID</th>
                <th className="p-4 w-1/3">현장명</th>
                <th className="p-4">설명 / 주소</th>
                <th className="p-4 w-40 text-center">담당자</th>
                <th className="p-4 w-32 text-center">등록일</th>
                <th className="p-4 w-32 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="animate-spin text-indigo-400" size={20} />
                      데이터를 불러오는 중입니다...
                    </div>
                  </td>
                </tr>
              ) : sitesList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    등록된 현장이 없습니다. 우측 상단 버튼을 눌러 새 현장을 등록해주세요.
                  </td>
                </tr>
              ) : (
                sitesList.map((site: any) => (
                  <tr key={site.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 text-center text-slate-500 font-medium">{site.id}</td>
                    
                    <td className="p-4 font-bold text-slate-800">
                      {site.title || site.name}
                    </td>
                    
                    <td className="p-4 text-slate-600 text-sm truncate max-w-xs">
                      {site.description || site.address || "-"}
                    </td>
                    
                    {/* 기업 회원의 본인 이름/소속 표시 */}
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200">
                        <User size={14} />
                        {userName}
                      </span>
                    </td>

                    <td className="p-4 text-center text-slate-500 text-sm">
                      {new Date(site.createdAt).toLocaleDateString()}
                    </td>
                    
                    {/* 기업 회원용 상세/작업 이동 버튼 */}
                    <td className="p-4 text-center">
                      <Link 
                        href={`/dashboard/works/${site.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 hover:border-indigo-400 hover:text-indigo-600 transition-all"
                      >
                        <FileSpreadsheet size={16} />
                        작업 관리
                      </Link>
                    </td>
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