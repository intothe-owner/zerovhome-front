"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Upload,
  Loader2,
  LucideFileText,
  FileText
} from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
type TabType = "LIST" | "COMPLETE";

export default function SeniorCenterListTableUI() {
  // --- UI 테스트용 상태 관리 ---
  const [activeTab, setActiveTab] = useState<TabType>("LIST");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [sortField, setSortField] = useState("seq");
  const [sortOrder, setSortOrder] = useState("ASC");
  
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState("노인장애인복지과");
  const [reportTarget, setReportTarget] = useState<{ id: number; name: string; category: "AIR_CONDITIONER" | "AIR_PURIFIER" } | null>(null);

  // --- 가짜(Mock) 데이터 ---
  const totalCount = activeTab === "LIST" ? 125 : 42;
  const totalPages = Math.ceil(totalCount / pageSize);

  const mockData = [
    { id: 1, seq: "2026-001", name: "해운대 시니어 클럽", roadAddress: "부산광역시 해운대구 반송로 123", managerName: "김철수", managerPhone: "010-1234-5678" },
    { id: 2, seq: "2026-002", name: "반송2동 경로당", roadAddress: "부산광역시 해운대구 반송순환로 45", managerName: "이영희", managerPhone: "010-9876-5432" },
    { id: 3, seq: "2026-003", name: "재송푸르지오 경로당", roadAddress: "부산광역시 해운대구 재반로 67", managerName: "박민수", managerPhone: "010-5555-4444" },
    { id: 4, seq: "2026-004", name: "센텀센시빌 경로당", roadAddress: "부산광역시 해운대구 해운대로 111", managerName: "최동훈", managerPhone: "010-1111-2222" },
    { id: 5, seq: "2026-005", name: "우동 협성프라자 경로당", roadAddress: "부산광역시 해운대구 우동1로 22", managerName: "-", managerPhone: "-" },
  ];

  // --- 핸들러 (UI 테스트용 가짜 로직) ---
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setPage(1);
    }, 500);
  };

  const handlePageChange = (newPage: number) => {
    setIsLoading(true);
    setPage(newPage);
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleDownloadPdf = (id: number, name: string, category: "AIR_CONDITIONER" | "AIR_PURIFIER", organization?: string) => {
    const loadingKey = `${id}-${category}`;
    setDownloadingId(loadingKey);
    
    // 다운로드 로딩 시뮬레이션 (1.5초 후 완료)
    setTimeout(() => {
      setDownloadingId(null);
      setIsModalOpen(false);
      alert(`[${organization}] ${name} - ${category === "AIR_CONDITIONER" ? "에어컨" : "공기청정기"} 보고서 다운로드 완료 (UI 테스트)`);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative pb-12">
      
      {/* 상태 카드 섹션 */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 font-bold">전체 건수</p>
          <p className="mt-2 text-2xl font-black text-indigo-600">{totalCount.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 font-bold">현재 페이지</p>
          <p className="mt-2 text-2xl font-black">{page}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 font-bold">페이지 크기</p>
          <p className="mt-2 text-2xl font-black">{pageSize}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 font-bold">상태</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            {isLoading ? "로딩중..." : "정상"}
          </p>
        </div>
      </section>

      {/* 탭 네비게이션 */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => { setActiveTab("LIST"); setPage(1); }}
          className={`px-6 py-4 text-sm font-bold transition-all relative ${
            activeTab === "LIST" ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          전체 목록
          {activeTab === "LIST" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
        </button>
        <button
          onClick={() => { setActiveTab("COMPLETE"); setPage(1); }}
          className={`px-6 py-4 text-sm font-bold transition-all relative ${
            activeTab === "COMPLETE" ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          완료 항목
          {activeTab === "COMPLETE" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
        </button>
      </div>

      {/* 검색폼 섹션 */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">경로당 에어컨 & 공기청정기 목록</h2>
          <button
            onClick={() => alert("엑셀 업로드 페이지로 이동 (UI 테스트)")}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <Upload size={16} className="text-indigo-600" />
            엑셀 명단 업로드
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[280px] space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">상세 검색</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="경로당명 / 담당자명 / 주소 / 연락처 검색"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div className="w-32 space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">정렬 기준</label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="seq">번호 순</option>
              <option value="dong">동별 정렬</option>
            </select>
          </div>

          <div className="w-32 space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">정렬 방향</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ASC">오름차순</option>
              <option value="DESC">내림차순</option>
            </select>
          </div>

          <div className="w-32 space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">표시 개수</label>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size}개씩</option>
              ))}
            </select>
          </div>

          <button type="submit" className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95">
            조회하기
          </button>
        </form>
      </section>

      {/* 테이블 리스트 */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden font-sans">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-600 font-bold">
              <tr>
                <th className="px-4 py-4 w-16 text-center">번호</th>
                <th className="px-6 py-4">경로당명</th>
                <th className="px-6 py-4">주소</th>
                <th className="px-6 py-4">담당자</th>
                <th className="px-6 py-4">연락처</th>
                <th className="px-6 py-4 text-center">보고서</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="py-20 text-center text-gray-400">로딩 중...</td></tr>
              ) : mockData.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-gray-400">데이터가 없습니다.</td></tr>
              ) : (
                mockData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-4 py-4 text-gray-400 font-mono text-center text-xs">{item.seq}</td>

                    {/* 경로당명 (가짜 상세페이지 링크) */}
                    <td className="px-6 py-4">
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); alert(`${item.name} 상세 페이지로 이동 (UI 테스트)`); }}
                        className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors hover:underline decoration-indigo-200 underline-offset-4 cursor-pointer"
                      >
                        {item.name}
                      </a>
                    </td>

                    <td className="px-6 py-4 text-gray-600 truncate max-w-[200px] font-medium">{item.roadAddress}</td>
                    <td className="px-6 py-4 font-medium text-gray-700">{item.managerName}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{item.managerPhone}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        {/* 에어컨 버튼 */}
                        <button
                          onClick={() => {
                            setReportTarget({ id: item.id, name: item.name, category: "AIR_CONDITIONER" });
                            setIsModalOpen(true);
                          }}
                          disabled={downloadingId === `${item.id}-AIR_CONDITIONER`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-all disabled:opacity-50"
                        >
                          {downloadingId === `${item.id}-AIR_CONDITIONER` ? <Loader2 size={12} className="animate-spin" /> : <LucideFileText size={12} />}
                          에어컨
                        </button>

                        {/* 공청기 PDF 바로 다운로드 (이것도 모달을 띄우거나 바로 다운 시뮬레이션 가능) */}
                        <button
                          onClick={() => handleDownloadPdf(item.id, item.name, "AIR_PURIFIER", "노인장애인복지과")}
                          disabled={downloadingId === `${item.id}-AIR_PURIFIER`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-purple-600 hover:bg-purple-50 transition-all disabled:opacity-50"
                        >
                          {downloadingId === `${item.id}-AIR_PURIFIER` ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                          공청기
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 하단 페이징 */}
        <div className="bg-gray-50/50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="text-sm font-medium text-gray-500">
            전체 <span className="text-indigo-600 font-black">{totalCount.toLocaleString()}</span>건 | 페이지 <span className="text-gray-900 font-bold">{page}</span> / {totalPages || 1}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-1.5 px-4 text-sm font-bold">
              <span className="text-indigo-600">{page}</span>
              <span className="text-gray-300">/</span>
              <span className="text-gray-500">{totalPages || 1}</span>
            </div>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* ✅ 기관 선택 모달창 */}
      {isModalOpen && reportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">보고서 기관 선택</h3>
              <p className="text-xs text-gray-500 mt-1">{reportTarget.name} - 에어컨 보고서</p>
            </div>

            <div className="p-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">제출할 기관을 선택해주세요</label>
              <select
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="노인장애인복지과">노인장애인복지과</option>
                <option value="해운대구청">해운대구청</option>
              </select>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdf(reportTarget.id, reportTarget.name, reportTarget.category, selectedOrg)}
                disabled={downloadingId === `${reportTarget.id}-${reportTarget.category}`}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-all disabled:bg-gray-400"
              >
                {downloadingId === `${reportTarget.id}-${reportTarget.category}` ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                다운로드
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}