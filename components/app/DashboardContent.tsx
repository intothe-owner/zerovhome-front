"use client";

import Link from "next/link";
import Swal from 'sweetalert2';
import { ChangeEvent, FormEvent, useMemo, useState, useCallback } from "react";
import SwipeableItem from "./SwipeableItem"; // 외부 스와이프 컴포넌트 가정
import {
  List,
  Archive,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Search,
  Home
} from "lucide-react";
// import { openKakaoNavi } from "@/lib/navigation"; // 필요 시 주석 해제

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
type TabType = "LIST" | "ARCHIVE" | "COMPLETE";

export default function DashboardPureUXUI() {
  // --- UI/UX 상태 관리 ---
  const [activeTab, setActiveTab] = useState<TabType>("LIST");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState("localNo");
  const [order, setOrder] = useState("asc");
  const [group, setGroup] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // --- 가짜(Mock) 데이터 ---
  const [items, setItems] = useState([
    { id: 1, no: "2026-001", name: "김철수", phone: "010-1234-5678", roadAddress: "부산광역시 해운대구 반송로 123", isCancel: false, isArchive: false, isComplete: false },
    { id: 2, no: "2026-002", name: "이영희", phone: "010-2345-6789", roadAddress: "부산광역시 해운대구 반송순환로 45", isCancel: false, isArchive: true, isComplete: false },
    { id: 3, no: "2026-003", name: "박민수", phone: "010-3456-7890", roadAddress: "부산광역시 해운대구 재반로 67", isCancel: true, isArchive: false, isComplete: false },
    { id: 4, no: "2026-004", name: "최동훈", phone: "010-1111-2222", roadAddress: "부산광역시 해운대구 해운대로 111", isCancel: false, isArchive: false, isComplete: true },
    { id: 5, no: "2026-005", name: "정수진", phone: "010-5555-4444", roadAddress: "부산광역시 해운대구 우동1로 22", isCancel: false, isArchive: false, isComplete: false },
  ]);

  // --- 상태별 필터링 ---
  const displayedItems = useMemo(() => {
    let result = items.filter(item => {
      if (activeTab === "LIST") return !item.isArchive && !item.isComplete;
      if (activeTab === "ARCHIVE") return item.isArchive && !item.isComplete;
      if (activeTab === "COMPLETE") return item.isComplete;
      return true;
    });

    if (searchInput) {
      result = result.filter(item => 
        item.name.includes(searchInput) || 
        item.roadAddress.includes(searchInput) || 
        item.phone.includes(searchInput)
      );
    }

    return result;
  }, [items, activeTab, searchInput]);

  const totalCompleted = items.filter(item => item.isComplete).length;

  // --- UX 핸들러 ---
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
    setSearchInput("");
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  // 취소 처리
  const handleDeleteTask = useCallback(async (id: number, name: string) => {
    const result = await Swal.fire({
      title: '취소 확인',
      text: `${name}님의 작업을 취소하시겠습니까? 취소하시면 보고서 작성이 불가능합니다.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '확인',
      cancelButtonText: '취소',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, isCancel: true, isArchive: false, isComplete: false } : item
      ));
      Swal.fire('취소됨', '성공적으로 취소되었습니다.', 'success');
    }
  }, []);

  // 보관/복구 토글 (스와이프)
  const handleToggleArchive = async (id: number, name: string, isFromList: boolean) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, isArchive: isFromList } : item
    ));

    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
    });
    Toast.fire({
      icon: 'success',
      title: isFromList ? '작업 동선에 추가됨' : '목록으로 복구됨'
    });
  };

  // 작업 완료 처리
  const handleCompleteTask = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: '작업 완료 처리',
      text: `${name}님의 작업을 완료 상태로 변경하시겠습니까?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '완료 처리',
      cancelButtonText: '취소',
      confirmButtonColor: '#2563eb'
    });

    if (result.isConfirmed) {
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, isComplete: true, isArchive: false } : item
      ));
      Swal.fire('완료!', '작업이 완료 처리되었습니다.', 'success');
    }
  };

  // 순서 변경
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= displayedItems.length) return;

    setItems(prev => {
      const newItems = [...prev];
      // 원본 배열에서의 실제 인덱스 찾기
      const dragIndex = newItems.findIndex(i => i.id === displayedItems[index].id);
      const dropIndex = newItems.findIndex(i => i.id === displayedItems[targetIndex].id);
      
      const temp = newItems[dragIndex];
      newItems[dragIndex] = newItems[dropIndex];
      newItems[dropIndex] = temp;
      
      return newItems;
    });
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
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">조회 건수</p>
            <p className="mt-1 text-xl font-bold">{displayedItems.length}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">보고서 완료건수</p>
            <p className="mt-1 text-xl font-bold">{totalCompleted}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-bold">2026년 냉방기 세척 클린UP 사업<br /> 대상자 목록</h2>
              <p className="mt-1 text-sm text-gray-500">
                성명, 휴대폰, 대리인 연락처, 도로명주소로 검색할 수 있습니다.
              </p>
            </div>

            <form onSubmit={handleSearch} className="space-y-3 max-w-md mx-auto">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="hidden w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">전체 그룹</option>
                  <option value="vulnerable">취약계층</option>
                  <option value="senior">어르신</option>
                </select>

                {activeTab !== "ARCHIVE" && (
                  <>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="localNo">연번 정렬</option>
                      <option value="dong">동별 정렬</option>
                    </select>
                    <select
                      value={order}
                      onChange={(e) => setOrder(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="asc">오름차순</option>
                      <option value="desc">내림차순</option>
                    </select>
                  </>
                )}

                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
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
                  placeholder="성명 / 휴대폰 / 주소 검색"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </form>
          </div>
        </section>

        <section className="space-y-3">
          {displayedItems.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500 shadow-sm">
              조회된 데이터가 없습니다.
            </div>
          ) : displayedItems.map((item, index) => (
            <SwipeableItem
              key={item.id}
              isArchive={activeTab === "ARCHIVE"}
              onArchive={
                activeTab === "COMPLETE" || item.isCancel
                  ? undefined
                  : () => handleToggleArchive(item.id, item.name, activeTab === "LIST")
              }
            >
              <div className={`relative block p-4 transition ${item.isCancel ? 'bg-gray-50 opacity-60 grayscale pointer-events-none select-none' : 'active:bg-gray-50 bg-white'}`}>
                <div className="flex items-start justify-between">
                  <Link href={item.isCancel ? '#' : `/mobile/views/${item.id}`} onClick={(e) => { if (item.isCancel) e.preventDefault(); }} className="flex-1 block">
                    <p className="text-[11px] font-medium text-gray-400">연번 {item.no ?? "-"}</p>
                    <h3 className="mt-0.5 text-lg font-extrabold text-blue-600 inline-block">{item.name}</h3>
                  </Link>

                  <div className="flex items-center gap-2">
                    {(activeTab === "LIST" || activeTab === "ARCHIVE") && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteTask(item.id, item.name); }}
                        className="flex flex-col items-center justify-center rounded-lg border border-red-500 p-1 px-2 text-red-500 active:bg-red-50"
                      >
                        <Trash2 size={20} />
                        <span className="text-[10px] font-bold">취소</span>
                      </button>
                    )}

                    {activeTab === "ARCHIVE" && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCompleteTask(item.id, item.name); }}
                        className="flex flex-col items-center justify-center rounded-lg border border-blue-600 p-1 px-2 text-blue-600 active:bg-blue-50"
                      >
                        <CheckCircle size={20} />
                        <span className="text-[10px] font-bold">완료</span>
                      </button>
                    )}
                  </div>
                </div>

                <Link href={item.isCancel ? '#' : `/mobile/views/${item.id}`} onClick={(e) => { if (item.isCancel) e.preventDefault(); }} className="block mt-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 space-y-1 text-[13px]">
                      <div className="flex items-center gap-3">
                        <span className="w-16 font-semibold text-gray-400">휴대폰</span>
                        <span className="font-medium text-gray-700">{item.phone || "-"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-16 font-semibold text-gray-400">도로명주소</span>
                        <span className="flex-1 truncate font-medium text-gray-700">
                          {item.roadAddress || "-"}
                        </span>
                      </div>
                    </div>

                    {activeTab === "ARCHIVE" && (
                      <div className="flex flex-col gap-1 border-l border-gray-100 pl-3">
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMove(index, 'up'); }}
                          disabled={index === 0}
                          className="rounded-md bg-gray-50 p-1.5 disabled:opacity-20"
                        >
                          <ChevronUp size={20} className="text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMove(index, 'down'); }}
                          disabled={index === displayedItems.length - 1}
                          className="rounded-md bg-gray-50 p-1.5 disabled:opacity-20"
                        >
                          <ChevronDown size={20} className="text-gray-600" />
                        </button>
                      </div>
                    )}
                  </div>
                </Link>

                {activeTab === "ARCHIVE" && (
                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        alert("카카오내비 길안내 실행 (UI 테스트)");
                        // openKakaoNavi(item.roadAddress, "", "");
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3 text-sm font-bold text-[#191919] active:opacity-80"
                    >
                      <img src="/icons/kakaonavi.png" alt="" className="w-5 h-5" />
                      카카오내비 길안내 시작
                    </button>
                  </div>
                )}
              </div>
            </SwipeableItem>
          ))}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm mb-20">
          <div className="space-y-3">
            <div className="text-center text-sm text-gray-500">
              총 <span className="font-semibold text-gray-900">{displayedItems.length}</span>건
              {" / "} {page} 페이지
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold disabled:opacity-50"
              >
                이전
              </button>

              <div className="min-w-[72px] text-center text-sm font-medium text-gray-900">
                {page} / 1
              </div>

              <button
                type="button"
                disabled={true}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold disabled:opacity-50"
              >
                다음
              </button>
            </div>
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 pb-safe backdrop-blur">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around">
          <button
            onClick={() => alert("홈으로 이동 (UI 테스트)")}
            className={`flex flex-col items-center gap-1 `}
          >
            <Home size={20} />
            <span className="text-[10px] font-bold">홈</span>
          </button>
          <button
            onClick={() => handleTabChange("LIST")}
            className={`flex flex-col items-center gap-1 ${activeTab === "LIST" ? "text-blue-600" : "text-gray-400"}`}
          >
            <List size={20} />
            <span className="text-[10px] font-bold">청소목록</span>
          </button>

          <button
            onClick={() => handleTabChange("ARCHIVE")}
            className={`flex flex-col items-center gap-1 ${activeTab === "ARCHIVE" ? "text-blue-600" : "text-gray-400"}`}
          >
            <Archive size={20} />
            <span className="text-[10px] font-bold">작업동선</span>
          </button>

          <button
            onClick={() => handleTabChange("COMPLETE")}
            className={`flex flex-col items-center gap-1 ${activeTab === "COMPLETE" ? "text-green-600" : "text-gray-400"}`}
          >
            <CheckCircle size={20} />
            <span className="text-[10px] font-bold">작업완료</span>
          </button>
        </div>
      </nav>

      <Link
        href="/mobile/register"
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-xl transition-transform active:scale-95"
      >
        <Plus size={28} />
      </Link>
    </div>
  );
};