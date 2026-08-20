"use client";

import { FormEvent, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import SeniorCenterSwipeableItem from "./SeniorCenterSwipeableItem"; 
import {
  List,
  Archive,
  CheckCircle,
  Search,
  MapPin,
  Plus,
  Home,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { openKakaoNavi } from "@/lib/navigation";

type TabType = "LIST" | "ARCHIVE" | "COMPLETE";
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];

export default function SeniorCenterPureList() {
  const [activeTab, setActiveTab] = useState<TabType>("LIST");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortField, setSortField] = useState("seq");
  const [sortOrder, setSortOrder] = useState("ASC");

  // UI 테스트용 목 데이터 (Mock Data)
  const [items, setItems] = useState([
    {
      id: 1,
      seq: 1,
      dong: "반송동",
      name: "해운대 시니어 클럽",
      roadAddress: "부산광역시 해운대구 반송로 123",
      isCancel: false,
      isArchive: false,
      isComplete: false,
    },
    {
      id: 2,
      seq: 2,
      dong: "반송동",
      name: "반송2동 경로당",
      roadAddress: "부산광역시 해운대구 반송순환로 45",
      isCancel: false,
      isArchive: true,
      isComplete: false,
    },
    {
      id: 3,
      seq: 3,
      dong: "재송동",
      name: "재송푸르지오 경로당",
      roadAddress: "부산광역시 해운대구 재반로 67",
      isCancel: false,
      isArchive: false,
      isComplete: true,
    },
  ]);

  // 탭 및 검색 조건에 따른 필터링된 아이템
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeTab === "LIST" && (item.isArchive || item.isComplete || item.isCancel)) return false;
      if (activeTab === "ARCHIVE" && (!item.isArchive || item.isComplete || item.isCancel)) return false;
      if (activeTab === "COMPLETE" && !item.isComplete) return false;

      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        const matchName = item.name.toLowerCase().includes(keyword);
        const matchAddress = item.roadAddress.toLowerCase().includes(keyword);
        const matchDong = item.dong.toLowerCase().includes(keyword);
        if (!matchName && !matchAddress && !matchDong) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === "seq") {
        comparison = a.seq - b.seq;
      } else if (sortField === "dong") {
        comparison = a.dong.localeCompare(b.dong);
      } else if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      }
      return sortOrder === "ASC" ? comparison : -comparison;
    });
  }, [items, activeTab, searchKeyword, sortField, sortOrder]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearchKeyword(searchInput);
    setPage(1);
  };

  // ✅ 스와이프 시 동작하는 동선 추가/복구 핸들러
  const handleArchive = useCallback(async (id: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextArchiveStatus = !item.isArchive;
          
          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
          });
          Toast.fire({
            icon: 'success',
            title: nextArchiveStatus ? '작업 동선에 추가됨' : '목록으로 복구됨'
          });

          return { ...item, isArchive: nextArchiveStatus };
        }
        return item;
      })
    );
  }, []);

  // 작업 완료 핸들러 (SweetAlert2 적용)
  const handleComplete = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: `${name} 작업을 완료 처리하시겠습니까?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      confirmButtonText: '완료',
      cancelButtonText: '취소'
    });

    if (result.isConfirmed) {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isComplete: true, isArchive: false } : item))
      );
      Swal.fire('완료!', '작업이 완료 처리되었습니다.', 'success');
    }
  };

  // 순서 변경 (위/아래)
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredItems.length) return;
    
    const currentItem = filteredItems[index];
    const targetItem = filteredItems[targetIndex];
    
    setItems((prev) => {
      const newItems = [...prev];
      const realIdx1 = newItems.findIndex(i => i.id === currentItem.id);
      const realIdx2 = newItems.findIndex(i => i.id === targetItem.id);
      
      const temp = newItems[realIdx1];
      newItems[realIdx1] = newItems[realIdx2];
      newItems[realIdx2] = temp;
      return newItems;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur px-5 h-14 flex items-center justify-between">
        <h1 className="text-lg font-black tracking-tight text-gray-900">
          {activeTab === "LIST" && "청소목록"}
          {activeTab === "ARCHIVE" && "오늘 작업 동선"}
          {activeTab === "COMPLETE" && "작업완료 목록"}
        </h1>
      </header>

      <main className="mx-auto w-full max-w-md px-4 py-4 space-y-4">
        {/* 통계 섹션 */}
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400">전체 건수</p>
            <p className="mt-0.5 text-xl font-black text-gray-900">{items.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400">조회 건수</p>
            <p className="mt-0.5 text-xl font-black text-gray-900">{filteredItems.length}</p>
          </div>
        </section>

        {/* 검색 섹션 */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                2026년 경로당 사업<br /> 대상자 목록
              </h2>
              <p className="mt-1 text-sm text-gray-500 font-medium">
                성명, 행정동, 도로명주소로 검색할 수 있습니다.
              </p>
            </div>

            <form onSubmit={handleSearch} className="space-y-3 max-w-md mx-auto">
              <div className="grid grid-cols-2 gap-2">
                {activeTab !== "ARCHIVE" && (
                  <>
                    <select
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500 font-bold bg-white"
                    >
                      <option value="seq">연번 정렬</option>
                      <option value="dong">동별 정렬</option>
                      <option value="name">이름 정렬</option>
                    </select>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500 font-bold bg-white"
                    >
                      <option value="ASC">오름차순</option>
                      <option value="DESC">내림차순</option>
                    </select>
                  </>
                )}

                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500 font-bold col-span-2 bg-white"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}개씩 보기
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="성명 / 동 / 주소 검색"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 font-bold bg-white"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 active:scale-95"
              >
                검색하기
              </button>
            </form>
          </div>
        </section>

        {/* 리스트 본문 (스와이프 적용) */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500 shadow-sm">
              조회된 데이터가 없습니다.
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isItemCanceled = item.isCancel;

              return (
                <div 
                  key={item.id} 
                  className={isItemCanceled ? "pointer-events-none opacity-40 grayscale select-none transition-all" : ""}
                >
                  {/* ✅ SeniorCenterSwipeableItem을 통해 좌우 스와이프 시 동선추가/복구 동작 */}
                  <SeniorCenterSwipeableItem
                    isArchive={activeTab === "ARCHIVE"}
                    onArchive={() => handleArchive(item.id)}
                  >
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <Link 
                          href={isItemCanceled ? "#" : `/mobile/senior/view/${item.id}`} 
                          onClick={(e) => { if (isItemCanceled) e.preventDefault(); }}
                          className="flex items-center gap-4 flex-1 min-w-0 active:opacity-60 transition-opacity"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">{item.dong}</span>
                              <span className="text-[10px] font-mono text-gray-300 font-bold uppercase tracking-widest">NO.{item.seq}</span>
                            </div>
                            <h3 className="text-[15px] font-black text-gray-900 truncate">{item.name}</h3>
                            <div className="flex items-center gap-1 text-gray-400 mt-0.5">
                              <MapPin size={10} strokeWidth={3} className="shrink-0" />
                              <span className="text-[11px] font-bold truncate">{item.roadAddress}</span>
                            </div>
                          </div>
                        </Link>

                        {/* 작업 완료 버튼 (작업동선 탭 전용) */}
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          {activeTab === "ARCHIVE" && (
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); handleComplete(item.id, item.name); }}
                              className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white active:scale-95 transition-all shadow-sm hover:bg-blue-700"
                            >
                              <CheckCircle size={18} strokeWidth={2.5} className="mb-0.5" />
                              <span className="text-[11px] font-black">완료</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {activeTab === "ARCHIVE" && (
                        <div className="border-t border-gray-100 pt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              alert("카카오내비 길안내 시작 (UI 테스트)");
                              openKakaoNavi(item.roadAddress, "", "");
                            }}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3 text-sm font-bold text-[#191919] active:opacity-80"
                          >
                            <span className="text-xs">카카오내비 길안내 시작</span>
                          </button>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleMove(index, 'up')}
                              disabled={index === 0}
                              className="rounded-xl bg-gray-100 p-2.5 disabled:opacity-20 active:scale-95"
                            >
                              <ChevronUp size={18} className="text-gray-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMove(index, 'down')}
                              disabled={index === filteredItems.length - 1}
                              className="rounded-xl bg-gray-100 p-2.5 disabled:opacity-20 active:scale-95"
                            >
                              <ChevronDown size={18} className="text-gray-600" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </SeniorCenterSwipeableItem>
                </div>
              );
            })
          )}
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm mb-20">
          <div className="space-y-3">
            <div className="text-center text-sm text-gray-500">
              총 <span className="font-semibold text-gray-900">{filteredItems.length}</span>건 / {page} 페이지
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold disabled:opacity-50 bg-white"
              >
                이전
              </button>
              <div className="min-w-[72px] text-center text-sm font-medium text-gray-900">
                {page} / 1
              </div>
              <button
                type="button"
                disabled={true}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold disabled:opacity-50 bg-white"
              >
                다음
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 하단 탭 내비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/95 pb-safe backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around">
          <button onClick={() => alert("홈으로 이동 (UI 테스트)")} className="flex flex-col items-center gap-1 text-gray-400">
            <Home size={22} />
            <span className="text-[10px] font-bold">홈</span>
          </button>
          <button onClick={() => handleTabChange("LIST")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "LIST" ? "text-blue-600" : "text-gray-400"}`}>
            <List size={22} strokeWidth={activeTab === "LIST" ? 2.5 : 2} />
            <span className="text-[10px] font-black">청소목록</span>
          </button>
          <button onClick={() => handleTabChange("ARCHIVE")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "ARCHIVE" ? "text-blue-600" : "text-gray-400"}`}>
            <Archive size={22} strokeWidth={activeTab === "ARCHIVE" ? 2.5 : 2} />
            <span className="text-[10px] font-black">작업동선</span>
          </button>
          <button onClick={() => handleTabChange("COMPLETE")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "COMPLETE" ? "text-blue-600" : "text-gray-400"}`}>
            <CheckCircle size={22} strokeWidth={activeTab === "COMPLETE" ? 2.5 : 2} />
            <span className="text-[10px] font-black">완료항목</span>
          </button>
        </div>
      </nav>

      {/* 플로팅 버튼 */}
      <Link href="/mobile/senior/register" className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-xl">
        <Plus size={28} />
      </Link>
    </div>
  );
}