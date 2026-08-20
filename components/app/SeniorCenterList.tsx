"use client";

import Link from "next/link";
import Swal from 'sweetalert2';
import { ChangeEvent, FormEvent, useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import {
  List,
  Archive,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Search,
  Home,
  Loader2
} from "lucide-react";
import SeniorCenterSwipeableItem from "./SeniorCenterSwipeableItem"; 

type TabType = "LIST" | "ARCHIVE" | "COMPLETE";
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];

// API 호출 헬퍼 (server.ts에 정의된 /api/senior 기준)
const fetchSeniorCenterList = async (params: any) => {
  const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/senior`, { params });
  return data;
};

export default function SeniorCenterPureList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const activeTab = (searchParams.get("tab") as TabType) || "LIST";
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 20;
  const sort = searchParams.get("sort") || "seq"; // 기본 정렬: 연번
  const order = searchParams.get("order") || "ASC";
  const q = searchParams.get("q") || "";
  const group = searchParams.get("group") || "";

  const [searchInput, setSearchInput] = useState(q);

  const updateQueryParams = useCallback(
    (newParams: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === "") params.delete(key);
        else params.set(key, String(value));
      });
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const queryParams = useMemo(() => ({
    page, pageSize, sortField: sort, sortOrder: order, keyword: q,
    isArchive: activeTab === "ARCHIVE",
    isComplete: activeTab === "COMPLETE",
  }), [page, pageSize, sort, order, q, activeTab]);

  const { data: listData, isLoading, isError, error } = useQuery({
    queryKey: ["senior-centers-list", queryParams],
    queryFn: () => fetchSeniorCenterList(queryParams),
  });

  const items = listData?.data ?? [];
  const totalCount = listData?.total ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // 상태 변경 Mutation (취소, 완료, 보관함 이동)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, ...payload }: { id: number; [key: string]: any }) => {
      // 삭제 처리 (isCancel)[cite: 9]
      if (payload.isCancel) {
         return await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/senior/${id}`);
      }
      // 상태 변경 처리 (isArchive, isComplete)[cite: 9]
      return await axios.patch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/senior/${id}`, payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["senior-centers-list"] }),
  });

  const handleTabChange = (tab: TabType) => {
    setSearchInput("");
    updateQueryParams({ tab, page: 1, q: "" });
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    updateQueryParams({ q: searchInput, page: 1 });
  };

  const handleDeleteTask = useCallback(async (id: number, name: string) => {
    const result = await Swal.fire({
      title: '삭제 확인',
      text: `${name} 경로당 데이터를 삭제하시겠습니까?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '확인',
      cancelButtonText: '취소',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      await updateStatusMutation.mutateAsync({ id, isCancel: true });
      Swal.fire('삭제됨', '성공적으로 삭제되었습니다.', 'success');
    }
  }, [updateStatusMutation]);

  const handleToggleArchive = async (id: number, isFromList: boolean) => {
    await updateStatusMutation.mutateAsync({ id, isArchive: isFromList, isComplete: false });
    Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, timerProgressBar: true })
      .fire({ icon: 'success', title: isFromList ? '작업 동선에 추가됨' : '목록으로 복구됨' });
  };

  const handleCompleteTask = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: '작업 완료 처리',
      text: `${name} 경로당 작업을 완료 상태로 변경하시겠습니까?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '완료 처리',
      cancelButtonText: '취소',
      confirmButtonColor: '#2563eb'
    });

    if (result.isConfirmed) {
      await updateStatusMutation.mutateAsync({ id, isComplete: true, isArchive: false });
      Swal.fire('완료!', '작업이 완료 처리되었습니다.', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-24">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="relative flex h-14 items-center justify-between px-4">
          <h1 className="text-lg font-bold">
            {activeTab === "LIST" && "청소목록"}
            {activeTab === "ARCHIVE" && "오늘 작업 동선"}
            {activeTab === "COMPLETE" && "작업완료 목록"}
          </h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 py-4 space-y-4">
        {/* 통계 섹션 */}
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">조회 건수</p>
            <p className="mt-1 text-xl font-bold">{totalCount}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">상태</p>
            <p className="mt-1 text-base font-bold text-blue-600">{isLoading ? "조회중" : "조회완료"}</p>
          </div>
        </section>

        {/* 검색 섹션 */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-bold">2026년 냉방기 세척 클린UP 사업<br /> 대상자 목록</h2>
            </div>
            <form onSubmit={handleSearch} className="space-y-3 max-w-md mx-auto">
              <div className="grid grid-cols-2 gap-2">
                {activeTab !== "ARCHIVE" && (
                  <>
                    <select value={sort} onChange={(e) => updateQueryParams({ sort: e.target.value, page: 1 })} className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none bg-white">
                      <option value="seq">연번 정렬</option>
                      <option value="dong">동별 정렬</option>
                    </select>
                    <select value={order} onChange={(e) => updateQueryParams({ order: e.target.value, page: 1 })} className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none bg-white">
                      <option value="ASC">오름차순</option>
                      <option value="DESC">내림차순</option>
                    </select>
                  </>
                )}
                <select value={pageSize} onChange={(e) => updateQueryParams({ pageSize: e.target.value, page: 1 })} className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none bg-white col-span-2">
                  {PAGE_SIZE_OPTIONS.map((size) => (<option key={size} value={size}>{size}개씩 보기</option>))}
                </select>
              </div>

              <div className="relative">
                <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="검색어 입력" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none bg-white" />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
              <button type="submit" className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800">검색하기</button>
            </form>
          </div>
        </section>

        {/* 리스트 본문 */}
        <section className="space-y-3">
          {isLoading ? (
             <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
          ) : isError ? (
             <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error?.message || "오류"}</div>
          ) : items.length === 0 ? (
             <div className="rounded-2xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">데이터가 없습니다.</div>
          ) : (
            items.map((item: any, index: number) => (
              <SeniorCenterSwipeableItem
                key={item.id}
                isArchive={activeTab === "ARCHIVE"}
                onArchive={activeTab === "COMPLETE" || item.isCancel ? undefined : () => handleToggleArchive(item.id, activeTab === "LIST")}
              >
                <div className={`relative block p-4 transition ${item.isCancel ? 'bg-gray-50 opacity-60 grayscale pointer-events-none' : 'active:bg-gray-50 bg-white'}`}>
                  <div className="flex items-start justify-between">
                    <Link href={item.isCancel ? '#' : `/app/senior/${item.id}`} className="flex-1 block">
                      <p className="text-[11px] font-medium text-gray-400">연번 {item.seq}</p>
                      <h3 className="mt-0.5 text-lg font-extrabold text-blue-600 inline-block">{item.name}</h3>
                    </Link>

                    <div className="flex items-center gap-2">
                      {(activeTab === "LIST" || activeTab === "ARCHIVE") && (
                        <button type="button" onClick={() => handleDeleteTask(item.id, item.name)} className="flex flex-col items-center justify-center rounded-lg border border-red-500 p-1 px-2 text-red-500">
                          <Trash2 size={20} /><span className="text-[10px] font-bold">삭제</span>
                        </button>
                      )}
                      {activeTab === "ARCHIVE" && (
                        <button type="button" onClick={() => handleCompleteTask(item.id, item.name)} className="flex flex-col items-center justify-center rounded-lg border border-blue-600 p-1 px-2 text-blue-600">
                          <CheckCircle size={20} /><span className="text-[10px] font-bold">완료</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <Link href={item.isCancel ? '#' : `/mobile/views/${item.id}`} className="block mt-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 space-y-1 text-[13px]">
                        <div className="flex items-center gap-3"><span className="w-16 font-semibold text-gray-400">담당자</span><span className="font-medium text-gray-700">{item.managerName || "-"} / {item.managerPhone || "-"}</span></div>
                        <div className="flex items-center gap-3"><span className="w-16 font-semibold text-gray-400">주소</span><span className="flex-1 truncate font-medium text-gray-700">{item.roadAddress}</span></div>
                      </div>
                    </div>
                  </Link>
                </div>
              </SeniorCenterSwipeableItem>
            ))
          )}
        </section>

        {/* 하단 페이지네이션 */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm mb-20">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => updateQueryParams({ page: page - 1 })} disabled={page <= 1} className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold disabled:opacity-50">이전</button>
              <div className="min-w-[72px] text-center text-sm font-medium text-gray-900">{page} / {totalPages}</div>
              <button type="button" onClick={() => updateQueryParams({ page: page + 1 })} disabled={page >= totalPages} className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold disabled:opacity-50">다음</button>
            </div>
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 pb-safe backdrop-blur">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around">
          <button onClick={() => router.push('/')} className="flex flex-col items-center gap-1 text-gray-400"><Home size={20} /><span className="text-[10px] font-bold">홈</span></button>
          <button onClick={() => handleTabChange("LIST")} className={`flex flex-col items-center gap-1 ${activeTab === "LIST" ? "text-blue-600" : "text-gray-400"}`}><List size={20} /><span className="text-[10px] font-bold">청소목록</span></button>
          <button onClick={() => handleTabChange("ARCHIVE")} className={`flex flex-col items-center gap-1 ${activeTab === "ARCHIVE" ? "text-blue-600" : "text-gray-400"}`}><Archive size={20} /><span className="text-[10px] font-bold">작업동선</span></button>
          <button onClick={() => handleTabChange("COMPLETE")} className={`flex flex-col items-center gap-1 ${activeTab === "COMPLETE" ? "text-green-600" : "text-gray-400"}`}><CheckCircle size={20} /><span className="text-[10px] font-bold">작업완료</span></button>
        </div>
      </nav>
      <Link href="/mobile/register" className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-xl"><Plus size={28} /></Link>
    </div>
  );
}