"use client";

import { Suspense, useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Reorder, useDragControls } from "framer-motion";
import { Play, RotateCcw, Navigation, Loader2, ArrowLeft, Trash2, CheckCircle, Search, X } from "lucide-react";
import SwipeableWorkItem from "@/components/app/SwipeableWorkItem";

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
    params: { ...params, page: pageParam, pageSize: 15 }, 
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

function MobileSiteWorkListContent() {
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
    const p: any = { 
      workSiteId: siteId, 
      status: targetStatus, 
      sortField: 'routeOrder', 
      sortOrder: 'ASC' 
    };
    if (keyword) p.keyword = keyword;
    if (userInfo && userInfo.level !== 10) p.assignedMemberId = userInfo.id;
    return p;
  }, [siteId, activeTab, userInfo, keyword]);

  const {
    data: infiniteData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["mobile-site-infinite-works", queryParams],
    queryFn: fetchWorkItemsInfinite,
    getNextPageParam: (lastPage: any) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
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
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, { threshold: 1.0 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: number; status: string }) => {
      return await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}/api/work-items/${itemId}/status`, 
        { status }, { headers: getAuthHeaders() }
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mobile-site-infinite-works"] }),
  });

  const handleSwipeAction = async (itemId: number, currentStatus: string) => {
    if (currentStatus === 'CANCELED') return;
    if (activeTab === "PENDING") {
      await updateStatusMutation.mutateAsync({ itemId, status: "IN_PROGRESS" });
    } else if (activeTab === "IN_PROGRESS") {
      await updateStatusMutation.mutateAsync({ itemId, status: "PENDING" });
    }
  };

  const handleCompleteTask = async (itemId: number) => {
    await updateStatusMutation.mutateAsync({ itemId, status: "COMPLETED" });
  };

  const handleCancelTask = async (itemId: number) => {
    await updateStatusMutation.mutateAsync({ itemId, status: "CANCELED" });
  };

  const handleReorder = async (newOrder: any[]) => {
    try {
      await Promise.all(
        newOrder.map((item, index) =>
          axios.patch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}/api/work-items/${item.id}/order`, 
            { routeOrder: index + 1 }, { headers: getAuthHeaders() }
          )
        )
      );
      queryClient.invalidateQueries({ queryKey: ["mobile-site-infinite-works"] });
    } catch (error) {
      console.error("순서 변경 실패");
    }
  };

  const updateTab = (tab: string) => {
    router.replace(`/app/works/${siteId}?tab=${tab}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput.trim());
  };

  const typedSiteInfo = siteInfo as { title?: string; mobileListVisibleFields?: string[] } | undefined;
  const mobileFields = typedSiteInfo?.mobileListVisibleFields || [];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-24">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="flex h-14 items-center px-4 gap-3 border-b border-gray-100">
          <button onClick={() => router.push('/app')} className="p-1 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-base font-bold truncate">{typedSiteInfo?.title || "현장별 작업 목록"}</h1>
        </div>

        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input 
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="검색어 입력"
                className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
              />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(""); setKeyword(""); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <X size={14} />
                </button>
              )}
            </div>
            <button type="submit" className="px-4 py-2 bg-gray-900 text-white font-bold rounded-xl text-sm hover:bg-gray-800 transition">
              <Search size={16} />
            </button>
          </form>
        </div>

        <div className="flex h-12 items-center justify-around text-sm font-bold">
          <button onClick={() => updateTab("PENDING")} className={`flex-1 h-full flex items-center justify-center ${activeTab === "PENDING" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-400"}`}>대기</button>
          <button onClick={() => updateTab("IN_PROGRESS")} className={`flex-1 h-full flex items-center justify-center ${activeTab === "IN_PROGRESS" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-400"}`}>작업중</button>
          <button onClick={() => updateTab("COMPLETED")} className={`flex-1 h-full flex items-center justify-center ${activeTab === "COMPLETED" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-400"}`}>완료</button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md py-4">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
        ) : localItems.length === 0 ? (
          <div className="bg-white px-4 py-12 text-center text-sm text-gray-500 rounded-2xl mx-4 border border-gray-100 shadow-sm">
            해당 조건의 작업 내역이 없습니다.
          </div>
        ) : (
          <div className="bg-white shadow-sm border-y border-gray-200 md:border-x md:rounded-2xl">
            {activeTab === "IN_PROGRESS" ? (
              <Reorder.Group axis="y" values={localItems} onReorder={handleReorder} className="m-0 p-0 list-none">
                {localItems.map((item: any) => (
                  <DraggableListItem 
                    key={item.id} 
                    item={item} 
                    activeTab={activeTab} 
                    mobileFields={mobileFields} 
                    onSwipeAction={() => handleSwipeAction(item.id, item.status)}
                    onComplete={() => handleCompleteTask(item.id)}
                    onCancel={() => handleCancelTask(item.id)}
                  />
                ))}
              </Reorder.Group>
            ) : (
              <div>
                {localItems.map((item: any) => (
                  <StaticListItem 
                    key={item.id} 
                    item={item} 
                    activeTab={activeTab} 
                    mobileFields={mobileFields} 
                    onSwipeAction={() => handleSwipeAction(item.id, item.status)}
                    onComplete={() => handleCompleteTask(item.id)}
                    onCancel={() => handleCancelTask(item.id)}
                  />
                ))}
              </div>
            )}
            
            <div ref={loadMoreRef} className="py-6 text-center">
              {isFetchingNextPage && <Loader2 className="animate-spin text-blue-600 mx-auto" size={24} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function DraggableListItem({ item, activeTab, mobileFields, onSwipeAction, onComplete, onCancel }: any) {
  const dragControls = useDragControls();
  if (item.status === 'CANCELED') {
    return <StaticListItem item={item} activeTab={activeTab} mobileFields={mobileFields} onSwipeAction={onSwipeAction} onComplete={onComplete} onCancel={onCancel} />;
  }
  return (
    <Reorder.Item value={item} id={String(item.id)} dragListener={false} dragControls={dragControls}>
      <div className="touch-none select-none" onPointerDown={(e) => dragControls.start(e)}>
        <StaticListItem 
          item={item} 
          activeTab={activeTab} 
          mobileFields={mobileFields} 
          onSwipeAction={onSwipeAction} 
          onComplete={onComplete}
          onCancel={onCancel}
        />
      </div>
    </Reorder.Item>
  );
}

function StaticListItem({ item, activeTab, mobileFields, onSwipeAction, onComplete, onCancel, hideBorder }: any) {
  const router = useRouter();
  const isCanceled = item.status === 'CANCELED';

  const swipeConfig = activeTab === "PENDING" 
    ? { swipeText: "작업시작", swipeColor: "#2563eb", icon: <Play size={24} /> }
    : { swipeText: "대기로", swipeColor: "#ea580c", icon: <RotateCcw size={24} /> };

  const validFields = (mobileFields || [])
    .map((field: string) => ({ key: field, val: item.rowData?.[field] }))
    .filter((f: any) => f.val && String(f.val).trim() !== "");

  const content = (
    <div 
      onClick={() => {
        if (!isCanceled) {
          router.push(`/app/works/items/${item.id}`); // 💡 상세 페이지로 이동하는 링크 연결
        }
      }}
      className={`p-5 bg-white cursor-pointer ${isCanceled ? 'bg-gray-100 opacity-60 pointer-events-none grayscale' : 'active:bg-gray-50'} ${hideBorder ? '' : 'border-b border-gray-100'}`}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              순번 {item.routeOrder}
            </span>
            {isCanceled && (
              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                취소됨
              </span>
            )}
          </div>
          
          <div className="flex flex-col gap-0.5">
            {validFields.length > 0 ? (
              validFields.map((f: any, index: number) => {
                if (index === 0) {
                  return (
                    <h3 key={f.key} className="text-[17px] font-black text-gray-900 leading-snug">
                      {f.val}
                    </h3>
                  );
                }
                return (
                  <p key={f.key} className="text-sm font-medium text-gray-600 break-keep pr-2">
                    {f.val}
                  </p>
                );
              })
            ) : (
              <h3 className="text-[17px] font-black text-gray-900 leading-snug">
                {item.customerName || "데이터 없음"}
              </h3>
            )}
          </div>
        </div>
        
        {activeTab === "IN_PROGRESS" && !isCanceled && (
          <div className="flex items-center gap-2 shrink-0" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={onCancel}
              className="flex flex-col items-center justify-center w-12 h-14 rounded-xl border border-red-200 text-red-500 bg-red-50/50 hover:bg-red-100 transition shadow-sm"
            >
              <Trash2 size={18} />
              <span className="text-[10px] font-bold mt-1">취소</span>
            </button>
            <button 
              onClick={onComplete}
              className="flex flex-col items-center justify-center w-12 h-14 rounded-xl border border-blue-200 text-blue-600 bg-blue-50/50 hover:bg-blue-100 transition shadow-sm"
            >
              <CheckCircle size={18} />
              <span className="text-[10px] font-bold mt-1">완료</span>
            </button>
          </div>
        )}
      </div>

      {activeTab === "IN_PROGRESS" && !isCanceled && item.latitude && item.longitude && (
        <div className="mt-4" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          <a 
            href={`https://map.kakao.com/link/to/${encodeURIComponent(item.customerName || '작업지')},${item.latitude},${item.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#fee500] text-gray-900 font-extrabold rounded-xl hover:opacity-90 transition shadow-sm text-sm"
          >
            <Navigation size={18} className="fill-gray-900" />
            카카오내비 길안내 시작
          </a>
        </div>
      )}
    </div>
  );

  if (isCanceled || activeTab === "COMPLETED") {
    return content;
  }

  return (
    <SwipeableWorkItem onSwipeAction={onSwipeAction} {...swipeConfig}>
      {content}
    </SwipeableWorkItem>
  );
}

export default function MobileSiteWorkListPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center"><Loader2 className="animate-spin text-blue-600 mx-auto" /></div>}>
      <MobileSiteWorkListContent />
    </Suspense>
  );
}