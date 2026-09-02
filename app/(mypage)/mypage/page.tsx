"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import axios from "axios";
import Link from "next/link";

const BUTTON_COLORS = [
  "bg-blue-600 shadow-blue-200 hover:bg-blue-700 text-blue-100",
  "bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700 text-emerald-100",
  "bg-violet-600 shadow-violet-200 hover:bg-violet-700 text-violet-100",
  "bg-rose-500 shadow-rose-200 hover:bg-rose-600 text-rose-100",
  "bg-amber-500 shadow-amber-200 hover:bg-amber-600 text-amber-100",
  "bg-cyan-600 shadow-cyan-200 hover:bg-cyan-700 text-cyan-100",
];

const MyPageHome = () => {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [sites, setSites] = useState<any[]>([]);
  const [isLoadingSites, setIsLoadingSites] = useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login"); // 로그인 경로에 맞게 수정 필요 시 변경
    } else {
      setIsCheckingAuth(false);
      fetchSites();
    }
  }, [router]);
  const getAuthHeaders = () => {
    const rawToken = localStorage.getItem("token") || "";
    const cleanToken = rawToken.replace(/^['"]|['"]$/g, ''); 

    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cleanToken}`
    };
  };

  const fetchSites = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/work-sites`, {
        headers: getAuthHeaders()
      });
      if (res.data.ok) {
        setSites(res.data.data);
      }
    } catch (err) {
      console.error("현장 목록 조회 실패:", err);
    } finally {
      setIsLoadingSites(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900  pt-24">
      <div className="max-w-7xl mx-auto">
        {/* PC용 헤더 타이틀 */}
        <div className="mb-12 border-b border-slate-200 pb-6">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            통합 현장 업무 시스템
          </h1>
          <p className="mt-2 text-base text-slate-500 font-medium">
            현재 진행 중인 사업을 선택하시면 세부 작업 내역을 관리할 수 있습니다.
          </p>
        </div>

        {/* PC용 그리드 버튼 영역 */}
        {isLoadingSites ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-slate-400" size={40} />
          </div>
        ) : sites.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-bold bg-white rounded-2xl border border-slate-200 shadow-sm text-lg">
            등록된 현장이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sites.map((site, index) => {
              const colorClass = BUTTON_COLORS[index % BUTTON_COLORS.length];
              return (
                <Link 
                  key={site.id}
                  href={`/mypage/${site.id}`} // 💡 다음 단계인 현장별 목록으로 이동
                  className={`relative flex flex-col justify-between h-48 rounded-2xl p-6 shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl group ${colorClass}`}
                >
                  <div>
                    <h2 className="text-2xl font-black text-white line-clamp-2 leading-tight">
                      {site.title}
                    </h2>
                    {site.description && (
                      <p className="mt-3 text-sm font-medium opacity-90 line-clamp-2">
                        {site.description}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="text-white" size={24} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPageHome;