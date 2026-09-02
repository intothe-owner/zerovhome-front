"use client";

import { Suspense, useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Reorder, useDragControls } from "framer-motion";
import { Play, RotateCcw, Navigation, Loader2, CheckCircle, Search, X, GripVertical, FolderKanban, ChevronRight } from "lucide-react";

const getAuthHeaders = () => {
  if (typeof window === "undefined") return {};
  const rawToken = localStorage.getItem("token") || "";
  const cleanToken = rawToken.replace(/^['"]|['"]$/g, ''); 
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${cleanToken}`
  };
};

const fetchWorkItemsInfinite = async ({ pageParam = 1, queryKey }: any) => {
  const [, params] = queryKey;
  const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}/api/work-items`, { 
    params: { ...params, page: pageParam, pageSize: 30 }, 
    headers: getAuthHeaders() 
  });
  return data; 
};

const fetchWorkSite = async (siteId: string) => {
  const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}/api/work-sites`, {
    headers: getAuthHeaders() 
  });
  return data.data.find((s: any) => s.id === Number(siteId));
};

function PcSiteWorkListContent() {
  const router = useRouter();
  const params = useParams();
  const siteId = params.id as string;
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "PENDING"; 

  const queryClient = useQueryClient();
  const [userInfo, setUserInfo] = useState<any>(null);

  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        try { setUserInfo(JSON.parse(atob(token.split('.')[1]))); } catch (e) {}
      }
    }
  }, []);

  const { data: siteInfo } = useQuery({
    queryKey: ["work-site-info", siteId],
    queryFn: () => fetchWorkSite(siteId),
    enabled: !!siteId,
  } as any);

  const queryParams = useMemo(() => {
    if (!siteId) return null;
    const targetStatus = activeTab === "PENDING" ? "PENDING,CANCELED" : activeTab;
    const p: any = { workSiteId: siteId, status: targetStatus, sortField: 'routeOrder', sortOrder: 'ASC' };
    if (keyword) p.keyword = keyword;
    if (userInfo && userInfo.level !== 10) p.assignedMemberId = userInfo.id;
    return p;
  }, [siteId, activeTab, userInfo, keyword]);

  const { data: infiniteData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["pc-site-infinite-works", queryParams],
    queryFn: fetchWorkItemsInfinite,
    getNextPageParam: (lastPage: any) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    enabled: !!siteId && !!userInfo,
    initialPageParam: 1,
  });

  const localItems = useMemo(() => {
    if (!infiniteData) return [];
    return infiniteData.pages.flatMap((page: any) => page.data);
  }, [infiniteData]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
    }, { threshold: 1.0 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: number; status: string }) => {
      return await axios.patch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}/api/work-items/${itemId}/status`, { status }, { headers: getAuthHeaders() });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pc-site-infinite-works"] }),
  });

  const handleAction = async (itemId: number, currentStatus: string, action: string) => {
    if (currentStatus === 'CANCELED') return;
    if (action === "START") await updateStatusMutation.mutateAsync({ itemId, status: "IN_PROGRESS" });
    if (action === "RETURN") await updateStatusMutation.mutateAsync({ itemId, status: "PENDING" });
    if (action === "COMPLETE") await updateStatusMutation.mutateAsync({ itemId, status: "COMPLETED" });
    if (action === "CANCEL") await updateStatusMutation.mutateAsync({ itemId, status: "CANCELED" });
  };

  const handleReorder = async (newOrder: any[]) => {
    try {
      await Promise.all(
        newOrder.map((item, index) =>
          axios.patch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}/api/work-items/${item.id}/order`, { routeOrder: index + 1 }, { headers: getAuthHeaders() })
        )
      );
      queryClient.invalidateQueries({ queryKey: ["pc-site-infinite-works"] });
    } catch (error) {
      console.error("순서 변경 실패");
    }
  };

  const updateTab = (tab: string) => router.replace(`/mypage/${siteId}?tab=${tab}`);
  const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); setKeyword(searchInput.trim()); };

  const typedSiteInfo = siteInfo as { title?: string; mobileListVisibleFields?: string[] } | undefined;
  const listFields = typedSiteInfo?.mobileListVisibleFields || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        {/* 💡 PC용 브레드크럼 서브타이틀 헤더 (뒤로가기 버튼 제거됨) */}
        <div className="max-w-[1400px] mx-auto flex h-20 items-center justify-between px-8 border-b border-slate-100">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span onClick={() => router.push('/mypage')} className="hover:text-indigo-600 cursor-pointer flex items-center gap-1">
                <FolderKanban size={14} /> 통합 현장 관리
              </span>
              <ChevronRight size={14} />
              <span className="text-indigo-600">작업 현황 관리</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {typedSiteInfo?.title || "현장 작업 목록"}
            </h1>
          </div>
          
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                placeholder="고객명, 연락처 등 통합 검색"
                className="w-full pl-10 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:bg-white transition"
              />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(""); setKeyword(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <X size={16} />
                </button>
              )}
            </div>
            <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition shadow-sm">검색</button>
          </form>
        </div>
        
        {/* 탭 네비게이션 */}
        <div className="max-w-[1400px] mx-auto px-8 flex gap-8 text-sm font-bold mt-2">
          <button onClick={() => updateTab("PENDING")} className={`pb-3 ${activeTab === "PENDING" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}>진행 대기</button>
          <button onClick={() => updateTab("IN_PROGRESS")} className={`pb-3 ${activeTab === "IN_PROGRESS" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}>작업중 내역</button>
          <button onClick={() => updateTab("COMPLETED")} className={`pb-3 ${activeTab === "COMPLETED" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}>완료된 내역</button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto py-8 px-8">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
        ) : localItems.length === 0 ? (
          <div className="bg-white px-4 py-20 text-center text-slate-500 font-medium rounded-2xl border border-slate-200 shadow-sm">
            해당 조건의 작업 내역이 없습니다.
          </div>
        ) : (
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
            {activeTab === "IN_PROGRESS" ? (
              <Reorder.Group axis="y" values={localItems} onReorder={handleReorder} className="m-0 p-0 list-none">
                {localItems.map((item: any) => (
                  <DraggablePcListItem key={item.id} item={item} activeTab={activeTab} listFields={listFields} handleAction={handleAction} />
                ))}
              </Reorder.Group>
            ) : (
              <div>
                {localItems.map((item: any) => (
                  <StaticPcListItem key={item.id} item={item} activeTab={activeTab} listFields={listFields} handleAction={handleAction} />
                ))}
              </div>
            )}
            <div ref={loadMoreRef} className="py-6 text-center">
              {isFetchingNextPage && <Loader2 className="animate-spin text-indigo-600 mx-auto" size={24} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function DraggablePcListItem({ item, activeTab, listFields, handleAction }: any) {
  const dragControls = useDragControls();
  if (item.status === 'CANCELED') {
    return <StaticPcListItem item={item} activeTab={activeTab} listFields={listFields} handleAction={handleAction} />;
  }
  return (
    <Reorder.Item value={item} id={String(item.id)} dragListener={false} dragControls={dragControls}>
      <div className="flex items-stretch border-b border-slate-100 bg-white hover:bg-slate-50 transition">
        <div className="w-12 flex items-center justify-center border-r border-slate-100 cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-500" onPointerDown={(e) => dragControls.start(e)}>
          <GripVertical size={20} />
        </div>
        <div className="flex-1">
          <StaticPcListItem item={item} activeTab={activeTab} listFields={listFields} handleAction={handleAction} hideBorder />
        </div>
      </div>
    </Reorder.Item>
  );
}

function StaticPcListItem({ item, activeTab, listFields, handleAction, hideBorder }: any) {
  const router = useRouter();
  const isCanceled = item.status === 'CANCELED';

  const validFields = (listFields || []).map((field: string) => ({ key: field, val: item.rowData?.[field] })).filter((f: any) => f.val);

  return (
    <div 
      className={`flex items-center justify-between p-6 bg-white transition ${isCanceled ? 'bg-slate-50 opacity-60 grayscale pointer-events-none' : 'hover:bg-slate-50'} ${hideBorder ? '' : 'border-b border-slate-100'}`}
    >
      <div 
        className="flex-1 cursor-pointer flex flex-col gap-1"
        onClick={() => { if (!isCanceled) router.push(`/mypage/items/${item.id}`); }}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">순번 {item.routeOrder}</span>
          {isCanceled && <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">취소됨</span>}
        </div>
        
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {validFields.length > 0 ? (
            validFields.map((f: any, index: number) => (
              index === 0 
                ? <h3 key={f.key} className="text-lg font-black text-slate-900 min-w-[150px]">{f.val}</h3>
                : <p key={f.key} className="text-sm font-medium text-slate-500 border-l border-slate-200 pl-6">{f.val}</p>
            ))
          ) : (
            <h3 className="text-lg font-black text-slate-900">{item.customerName || "데이터 없음"}</h3>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3 ml-6 shrink-0" onClick={(e) => e.stopPropagation()}>
        {activeTab === "PENDING" && !isCanceled && (
          <button onClick={() => handleAction(item.id, item.status, "START")} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-sm transition">
            <Play size={16} /> 작업 시작
          </button>
        )}
        
        {activeTab === "IN_PROGRESS" && !isCanceled && (
          <>
            {item.latitude && item.longitude && (
              <a href={`https://map.kakao.com/link/to/${encodeURIComponent(item.customerName || '작업지')},${item.latitude},${item.longitude}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-[#fee500] text-gray-900 font-extrabold rounded-xl hover:opacity-90 shadow-sm transition">
                <Navigation size={16} className="fill-gray-900" /> 길안내
              </a>
            )}
            <button onClick={() => handleAction(item.id, item.status, "RETURN")} className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition">대기로</button>
            <button onClick={() => handleAction(item.id, item.status, "CANCEL")} className="px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 font-bold rounded-xl hover:bg-rose-100 transition">취소</button>
            <button onClick={() => handleAction(item.id, item.status, "COMPLETE")} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-sm transition">
              <CheckCircle size={16} /> 완료 처리
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PcSiteWorkListPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} /></div>}>
      <PcSiteWorkListContent />
    </Suspense>
  );
}