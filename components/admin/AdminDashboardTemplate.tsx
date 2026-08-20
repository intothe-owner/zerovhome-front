"use client";

import { useState } from "react";
import { 
  CheckCircle, 
  List, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  Download,
  Loader2,
  AlertCircle,
  Archive
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
// 💡 탭 타입에 ARCHIVE 추가
type TabType = "LIST" | "ARCHIVE" | "COMPLETE";

// 백엔드 데이터 타입 정의
interface Household {
  id: number;
  localNo: number;
  dong: string;
  name: string;
  phone: string;
  proxyPhone: string;
  roadAddress: string;
  detailAddress: string;
  isComplete: boolean;
  isArchived: boolean;
}

interface PaginatedResponse {
  items: Household[];
  pagination: {
    page: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminCleanUpHouseholdListUI() {
  // --- UI 상태 ---
  const [activeTab, setActiveTab] = useState<TabType>("LIST");
  const [isDownloading, setIsDownloading] = useState(false);
  
  // 검색/필터 폼 상태
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState(""); // 실제 쿼리에 반영될 검색어
  const [group, setGroup] = useState(""); // UI 필터용
  const [sortField, setSortField] = useState("localNo");
  const [sortOrder, setSortOrder] = useState("asc");
  
  // 페이징 상태
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // --- React Query 데이터 패칭 ---
  const { data, isLoading, isError, refetch } = useQuery<PaginatedResponse>({
    queryKey: [
      "households", 
      activeTab, 
      page, 
      pageSize, 
      appliedSearch, 
      sortField, 
      sortOrder, 
      group
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sort: sortField,
        order: sortOrder,
      });

      // 💡 탭 상태에 따른 API 파라미터 분기 처리
      if (activeTab === "COMPLETE") {
        params.append("isComplete", "true");
      } else if (activeTab === "ARCHIVE") {
        params.append("isArchived", "true");
      } else {
        // LIST (청소목록)
        params.append("isComplete", "false");
        params.append("isArchived", "false");
      }

      if (appliedSearch) params.append("q", appliedSearch);
      if (group) params.append("group", group);

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/households/list?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("데이터를 불러오는데 실패했습니다.");
      }
      return response.json();
    },
  });

  // 응답 데이터 기반 변수 설정
  const households = data?.items || [];
  const totalCount = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 1;

  // --- UI 핸들러 ---
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1); // 탭 전환 시 1페이지로 리셋
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchInput);
    setPage(1); // 검색 시 1페이지로 리셋
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleBulkDownload = () => {
    setIsDownloading(true);
    // 일괄 다운로드 API 호출 로직 시뮬레이션
    setTimeout(() => {
      setIsDownloading(false);
      alert("ZIP 파일 다운로드가 완료되었습니다.");
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative pb-12 pt-6 px-4 sm:px-6">
      
      {/* 헤더 타이틀 */}
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
          {activeTab === "COMPLETE" ? "작업 완료 목록" 
            : activeTab === "ARCHIVE" ? "작업 동선 관리" 
            : "청소 대상자 목록"}
        </h1>
        <p className="text-sm text-slate-500 mt-1.5 font-medium">
          {activeTab === "COMPLETE" ? "작업이 완료된 대상자들의 리스트와 최종 보고서를 확인합니다."
            : activeTab === "ARCHIVE" ? "오늘 작업할 대상자들의 동선을 확인하고 관리합니다."
            : "전체 청소 대상자 목록을 조회하고 작업 상태를 관리합니다."}
        </p>
      </header>

      {/* 💡 3단 탭 네비게이션 */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => handleTabChange("LIST")}
          className={`flex items-center gap-2 px-5 md:px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === "LIST"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
              : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          }`}
        >
          <List size={18} />
          청소목록
        </button>
        <button
          onClick={() => handleTabChange("ARCHIVE")}
          className={`flex items-center gap-2 px-5 md:px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === "ARCHIVE"
              ? "border-amber-500 text-amber-600 bg-amber-50/50"
              : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Archive size={18} />
          작업동선
        </button>
        <button
          onClick={() => handleTabChange("COMPLETE")}
          className={`flex items-center gap-2 px-5 md:px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === "COMPLETE"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
              : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          }`}
        >
          <CheckCircle size={18} />
          작업완료
        </button>
      </div>

      {/* 상단 요약 카드 */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">조회 건수</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-800">
            {isLoading ? "-" : totalCount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">현재 페이지</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-800">{page}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">페이지 크기</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-800">{pageSize}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">상태</p>
          <p className={`mt-2 text-2xl font-extrabold ${isLoading ? "text-amber-500" : isError ? "text-red-500" : "text-emerald-600"}`}>
            {isLoading ? "조회 중..." : isError ? "오류 발생" : "정상"}
          </p>
        </div>
      </section>

      {/* 검색 및 제어 패널 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-2">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">목록 필터 및 검색</h2>
              <p className="mt-1 text-sm text-slate-500">
                성명, 휴대폰, 대리인 연락처, 도로명주소로 검색할 수 있습니다.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* 완료 탭 전용: 일괄 다운로드 */}
              {activeTab === "COMPLETE" && (
                <button
                  onClick={handleBulkDownload}
                  disabled={isDownloading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  {isDownloading ? "압축 파일 생성 중..." : "완료 보고서 일괄 다운로드 (ZIP)"}
                </button>
              )}
              
              {/* 엑셀 업로드 링크 연결 */}
              <Link 
                href="/admin/clean/excel-upload"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-all active:scale-95"
              >
                <Upload size={16} /> 엑셀 업로드
              </Link>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-3 mt-2">
            {/* 검색어 입력 */}
            <div className="xl:col-span-4 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="성명 / 휴대폰 / 주소 검색"
                className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-white"
              />
            </div>

            {/* 필터 1: 그룹 */}
            <div className="xl:col-span-2">
              <select
                value={group}
                onChange={(e) => { setGroup(e.target.value); setPage(1); }}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 bg-white cursor-pointer"
              >
                <option value="">전체 그룹</option>
                <option value="vulnerable">취약계층</option>
                <option value="senior">어르신</option>
              </select>
            </div>

            {/* 필터 2: 정렬 필드 */}
            <div className="xl:col-span-2">
              <select
                value={sortField}
                onChange={(e) => { setSortField(e.target.value); setPage(1); }}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 bg-white cursor-pointer"
              >
                <option value="localNo">연번 정렬</option>
                <option value="dong">동별 정렬</option>
              </select>
            </div>

            {/* 필터 3: 정렬 방향 */}
            <div className="xl:col-span-2">
              <select
                value={sortOrder}
                onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 bg-white cursor-pointer"
              >
                <option value="asc">오름차순</option>
                <option value="desc">내림차순</option>
              </select>
            </div>

            {/* 필터 4: 갯수 */}
            <div className="xl:col-span-1">
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 bg-white cursor-pointer"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size}개</option>
                ))}
              </select>
            </div>

            {/* 검색 버튼 */}
            <div className="xl:col-span-1">
              <button
                type="submit"
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800 shadow-sm"
              >
                검색
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 테이블 목록 */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-extrabold">
              <tr>
                <th className="px-5 py-4 w-20 text-center whitespace-nowrap">연번</th>
                <th className="px-5 py-4 whitespace-nowrap">동</th>
                <th className="px-5 py-4 whitespace-nowrap">성명</th>
                <th className="px-5 py-4 whitespace-nowrap">휴대폰</th>
                <th className="px-5 py-4 whitespace-nowrap">대리인 연락처</th>
                <th className="px-5 py-4 min-w-[200px]">도로명주소</th>
                <th className="px-5 py-4 min-w-[150px]">상세주소</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-20 text-center text-slate-400">
                    <Loader2 className="animate-spin mx-auto mb-2 text-indigo-500" size={24} />
                    데이터를 불러오는 중입니다...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="px-4 py-20 text-center text-red-500 font-medium">
                    <AlertCircle className="mx-auto mb-2" size={24} />
                    데이터를 불러오는데 실패했습니다.
                    <button onClick={() => refetch()} className="block mx-auto mt-2 text-indigo-600 hover:underline">다시 시도</button>
                  </td>
                </tr>
              ) : households.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-20 text-center text-slate-400 font-medium">
                    조회된 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                households.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-4 text-center text-slate-400 font-mono text-xs">{item.localNo}</td>
                    <td className="px-5 py-4 font-bold text-slate-700">{item.dong}</td>
                    <td className="px-5 py-4 font-extrabold">
                      <Link
                        href={`/admin/clean/cleanup/${item.id}`}
                        className="text-slate-900 group-hover:text-indigo-600 hover:underline decoration-indigo-200 underline-offset-4 transition-colors cursor-pointer"
                      >
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium">{item.phone || "-"}</td>
                    <td className="px-5 py-4 text-slate-600 font-medium">{item.proxyPhone || "-"}</td>
                    <td className="px-5 py-4 text-slate-700 break-words">{item.roadAddress}</td>
                    <td className="px-5 py-4 text-slate-500 break-words">{item.detailAddress || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 하단 페이징 영역 */}
        {!isLoading && !isError && (
          <div className="bg-slate-50/50 px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200">
            <div className="text-sm font-medium text-slate-500">
              총 <span className="font-extrabold text-indigo-600">{totalCount.toLocaleString()}</span>건 
              <span className="mx-2 text-slate-300">|</span> 
              <span className="font-bold text-slate-800">{page}</span> / {totalPages} 페이지
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronLeft size={20} className="text-slate-600" />
              </button>
              <div className="flex items-center gap-1.5 px-3 text-sm font-extrabold">
                <span className="text-indigo-600">{page}</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500">{totalPages}</span>
              </div>
              <button
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronRight size={20} className="text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}