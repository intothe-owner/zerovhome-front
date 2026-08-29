"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import axios from "axios"; // 💡 axios 추가 (API 호출용)

// 💡 1. 예쁜 색상 조합을 배열로 미리 정의 (배경, 그림자, 호버, 텍스트 색상 포함)
const BUTTON_COLORS = [
  "bg-blue-600 shadow-blue-200 hover:bg-blue-700 text-blue-100",       // 블루
  "bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700 text-emerald-100", // 에메랄드
  "bg-violet-600 shadow-violet-200 hover:bg-violet-700 text-violet-100",   // 바이올렛
  "bg-rose-500 shadow-rose-200 hover:bg-rose-600 text-rose-100",       // 로즈
  "bg-amber-500 shadow-amber-200 hover:bg-amber-600 text-amber-100",       // 앰버(주황)
  "bg-cyan-600 shadow-cyan-200 hover:bg-cyan-700 text-cyan-100",       // 시안(청록)
];

const Home = () => {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // 💡 현장(Site) 데이터를 담을 상태 추가
  const [sites, setSites] = useState<any[]>([]);
  const [isLoadingSites, setIsLoadingSites] = useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  useEffect(() => {
    // 로컬 스토리지에서 토큰 확인
    const token = localStorage.getItem("token");

    if (!token) {
      // 토큰이 없으면 로그인 페이지로 리다이렉트
      router.replace("/app/login");
    } else {
      // 토큰이 있으면 인증 확인 상태 해제 후 현장 목록 호출
      setIsCheckingAuth(false);
      fetchSites();
    }
  }, [router]);

  // 💡 2. 현장 목록을 불러오는 API 함수
  const fetchSites = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/work-sites`);
      if (res.data.ok) {
        setSites(res.data.data);
      }
    } catch (err) {
      console.error("현장 목록 조회 실패:", err);
    } finally {
      setIsLoadingSites(false);
    }
  };

  // 인증 확인 중일 때는 깜빡임(Flash) 방지를 위해 로딩 화면 표시
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="-mt-16 min-h-[100dvh] bg-gray-50 text-gray-900 flex flex-col items-center justify-center px-5">
      {/* 헤더 타이틀 */}
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          현장 업무 시스템
        </h1>
        <p className="mt-2 text-sm text-gray-500 font-medium">
          진행하실 사업을 선택해 주세요
        </p>
      </div>

      {/* 버튼 영역 */}
      <div className="w-full max-w-md space-y-4">
        {isLoadingSites ? (
          // 현장 목록 로딩 중
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-gray-400" size={28} />
          </div>
        ) : sites.length === 0 ? (
          // 등록된 현장이 없을 때
          <div className="text-center py-10 text-gray-400 font-medium bg-white rounded-2xl border border-gray-200">
            등록된 현장이 없습니다.
          </div>
        ) : (
          // 💡 3. API로 불러온 현장 목록을 매핑하여 버튼 렌더링
          sites.map((site, index) => {
            // 버튼 색상을 배열 길이로 나누어 순환 적용 (예: 7번째 현장은 다시 1번째 색상 적용)
            const colorClass = BUTTON_COLORS[index % BUTTON_COLORS.length];
            
            return (
              <Link 
                key={site.id}
                href={`/app/works/${site.id}`} // ⚠️ 실제 현장 클릭 시 넘어갈 경로에 맞춰 수정해 주세요. (예: /app/works/[id])
                className={`flex flex-col items-center justify-center w-full rounded-2xl p-8 shadow-lg transition-all active:scale-95 ${colorClass}`}
              >
                <span className="text-xl font-black text-white">{site.title}</span>
                {/* 현장 설명(부제목)이 있다면 노출 */}
                {site.description && (
                  <span className="mt-1 text-sm font-medium opacity-90">
                    {site.description}
                  </span>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Home;