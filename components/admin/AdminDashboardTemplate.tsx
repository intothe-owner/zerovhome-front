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
  Loader2
} from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
type TabType = "LIST" | "COMPLETE";

export default function AdminCleanUpHouseholdListUI() {
  // --- UI 테스트용 로컬 상태 ---
  const [activeTab, setActiveTab] = useState<TabType>("LIST");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 검색/필터 폼 상태
  const [searchInput, setSearchInput] = useState("");
  const [group, setGroup] = useState("");
  const [sortField, setSortField] = useState("localNo");
  const [sortOrder, setSortOrder] = useState("asc");
  
  // 페이징 상태
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // --- 가짜(Mock) 데이터 ---
  const totalCount = activeTab === "LIST" ? 342 : 128;
  const totalPages = Math.ceil(totalCount / pageSize);

  const mockData = [
    { id: 1, no: "2026-001", dong: "반송1동", name: "김철수", phone: "010-1234-5678", proxyPhone: "010-9876-5432", roadAddress: "부산광역시 해운대구 반송로 123", detailAddress: "1층 101호" },
    { id: 2, no: "2026-002", dong: "반송2동", name: "이영희", phone: "010-2345-6789", proxyPhone: "-", roadAddress: "부산광역시 해운대구 반송순환로 45", detailAddress: "2층" },
    { id: 3, no: "2026-003", dong: "재송1동", name: "박민수", phone: "010-3456-7890", proxyPhone: "010-1111-2222", roadAddress: "부산광역시 해운대구 재반로 67", detailAddress: "102동 304호" },
    { id: 4, no: "2026-004", dong: "우1동", name: "최동훈", phone: "-", proxyPhone: "010-4567-8901", roadAddress: "부산광역시 해운대구 우동1로 22", detailAddress: "지하 1층" },
    { id: 5, no: "2026-005", dong: "좌1동", name: "정수진", phone: "010-5678-9012", proxyPhone: "-", roadAddress: "부산광역시 해운대구 좌동로 88", detailAddress: "상가 2층 201호" },
  ];

  // --- UI 핸들러 (가짜 동작) ---
  const handleTabChange = (tab: TabType) => {
    setIsLoading(true);
    setActiveTab(tab);
    setPage(1);
    setTimeout(() => setIsLoading(false), 400); // 탭 전환 로딩 시뮬레이션
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setPage(1);
    setTimeout(() => setIsLoading(false), 500); // 검색 로딩 시뮬레이션
  };

  const handlePageChange = (newPage: number) => {
    setIsLoading(true);
    setPage(newPage);
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleBulkDownload = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      alert("ZIP 파일 다운로드가 완료되었습니다. (UI 테스트)");
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative pb-12 pt-6 px-4 sm:px-6">
      
      {/* 헤더 타이틀 */}
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
          {activeTab === "COMPLETE" ? "작업 완료 목록" : "대상자 관리"}
        </h1>
        <p className="text-sm text-slate-500 mt-1.5 font-medium">
          {activeTab === "COMPLETE"
            ? "작업이 완료된 대상자들의 리스트와 최종 보고서를 확인합니다."
            : "전체 대상자 목록을 조회하고 작업 상태를 관리합니다."}
        </p>
      </header>

      {/* 탭 네비게이션 */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => handleTabChange("LIST")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === "LIST"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
              : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          }`}
        >
          <List size={18} />
          전체 목록
        </button>
        <button
          onClick={() => handleTabChange("COMPLETE")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === "COMPLETE"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
              : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          }`}
        >
          <CheckCircle size={18} />
          작업 완료
        </button>
      </div>

      {/* 상단 요약 카드 */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">전체 건수</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-800">{totalCount.toLocaleString()}</p>
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
          <p className={`mt-2 text-2xl font-extrabold ${isLoading ? "text-amber-500" : "text-emerald-600"}`}>
            {isLoading ? "조회 중..." : "정상"}
          </p>
        </div>
      </section>

      {/* 검색 및 제어 패널 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-2">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">냉방기 클린UP 대상자 목록</h2>
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
              
              {/* 엑셀 업로드 */}
              <button
                onClick={() => alert("엑셀 업로드 페이지로 이동 (UI 테스트)")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-all active:scale-95"
              >
                <Upload size={16} /> 엑셀 업로드
              </button>
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
                placeholder="성명 / 휴대폰 / 대리인 / 주소 검색"
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
                <th className="px-5 py-4">도로명주소</th>
                <th className="px-5 py-4">상세주소</th>
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
              ) : mockData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-20 text-center text-slate-400 font-medium">
                    조회된 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                mockData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-4 text-center text-slate-400 font-mono text-xs">{item.no}</td>
                    <td className="px-5 py-4 font-bold text-slate-700">{item.dong}</td>
                    <td className="px-5 py-4 font-extrabold">
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); alert(`${item.name} 님의 상세 페이지로 이동 (UI 테스트)`); }}
                        className="text-slate-900 group-hover:text-indigo-600 hover:underline decoration-indigo-200 underline-offset-4 transition-colors cursor-pointer"
                      >
                        {item.name}
                      </a>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium">{item.phone}</td>
                    <td className="px-5 py-4 text-slate-600 font-medium">{item.proxyPhone}</td>
                    <td className="px-5 py-4 text-slate-700 break-words max-w-[200px]">{item.roadAddress}</td>
                    <td className="px-5 py-4 text-slate-500 break-words max-w-[150px]">{item.detailAddress}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 하단 페이징 영역 */}
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
      </section>

    </div>
  );
}