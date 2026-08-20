"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Upload,
  Loader2,
  LucideFileText,
  FileText,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
type TabType = "LIST" | "COMPLETE";

interface SeniorCenterItem {
  id: number;
  seq: number;
  name: string;
  roadAddress: string;
  managerName: string | null;
  managerPhone: string | null;
  isComplete: boolean;
}

interface SeniorListResponse {
  ok: boolean;
  data: SeniorCenterItem[];
  total: number;
}

export default function SeniorCenterListTableUI() {
  // --- 상태 관리 ---
  const [activeTab, setActiveTab] = useState<TabType>("LIST");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sortField, setSortField] = useState("seq");
  const [sortOrder, setSortOrder] = useState("ASC");
  
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState("노인장애인복지과");
  const [reportTarget, setReportTarget] = useState<{ id: number; name: string; category: "AIR_CONDITIONER" | "AIR_PURIFIER" } | null>(null);

  // --- React Query: 경로당 목록 조회 ---
  const { data, isLoading, isError, refetch } = useQuery<SeniorListResponse>({
    queryKey: ["seniorCenters", activeTab, page, pageSize, appliedSearch, sortField, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortField,
        sortOrder,
        isComplete: activeTab === "COMPLETE" ? "true" : "false",
      });

      if (appliedSearch) {
        params.append("keyword", appliedSearch);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/senior?${params.toString()}`);
      if (!res.ok) {
        throw new Error("경로당 목록을 불러오는데 실패했습니다.");
      }
      return res.json();
    },
  });

  const seniorCenters = data?.data || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // --- 핸들러 ---
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchInput);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleDownloadPdf = (id: number, name: string, category: "AIR_CONDITIONER" | "AIR_PURIFIER", organization?: string) => {
    const loadingKey = `${id}-${category}`;
    setDownloadingId(loadingKey);
    
    // PDF 다운로드 시뮬레이션 (실제 백엔드 PDF 엔드포인트가 있다면 교체 가능)
    setTimeout(() => {
      setDownloadingId(null);
      setIsModalOpen(false);
      alert(`[${organization}] ${name} - ${category === "AIR_CONDITIONER" ? "에어컨" : "공기청정기"} 보고서 다운로드 완료`);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative pb-12">
      
      {/* 상태 카드 섹션 */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 font-bold">전체 건수</p>
          <p className="mt-2 text-2xl font-black text-indigo-600">
            {isLoading ? "-" : totalCount.toLocaleString()}
          </p>
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
          <p className={`mt-2 text-2xl font-black ${isLoading ? "text-amber-500" : isError ? "text-red-500" : "text-emerald-600"}`}>
            {isLoading ? "로딩중..." : isError ? "오류 발생" : "정상"}
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
          <Link
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95"
            href="/admin/clean/senior/excel-upload"
          >
            <Upload size={16} className="text-indigo-600" />
            엑셀 명단 업로드
          </Link>
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
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-400">
                    <Loader2 className="animate-spin mx-auto mb-2 text-indigo-500" size={24} />
                    데이터를 불러오는 중입니다...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-red-500 font-medium">
                    <AlertCircle className="mx-auto mb-2" size={24} />
                    데이터를 불러오는데 실패했습니다.
                    <button onClick={() => refetch()} className="block mx-auto mt-2 text-indigo-600 hover:underline">다시 시도</button>
                  </td>
                </tr>
              ) : seniorCenters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-400 font-medium">
                    조회된 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                seniorCenters.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-4 py-4 text-gray-400 font-mono text-center text-xs">{item.seq}</td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/clean/senior/${item.id}`}
                        className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors hover:underline decoration-indigo-200 underline-offset-4 cursor-pointer"
                      >
                        {item.name}
                      </Link>
                    </td>

                    <td className="px-6 py-4 text-gray-600 truncate max-w-[200px] font-medium">{item.roadAddress}</td>
                    <td className="px-6 py-4 font-medium text-gray-700">{item.managerName || "-"}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{item.managerPhone || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
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
        {!isLoading && !isError && (
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
        )}
      </div>

      {/* 기관 선택 모달창 */}
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