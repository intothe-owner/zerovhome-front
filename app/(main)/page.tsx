"use client"; // 💡 1. 클라이언트 컴포넌트로 선언 (React Query 훅을 쓰기 위해 필수)

import Link from "next/link";
import BlockRenderer from "@/components/main/BlockRenderer";
import MainSlider from "@/components/main/MainSlider";
import { useQuery } from "@tanstack/react-query";

// 💡 2. 데이터를 가져오는 순수 통신 함수들을 컴포넌트 밖으로 분리합니다.
const fetchMainPageData = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pages/0`);
  const json = await res.json();
  if (!json.success) throw new Error("메인 페이지 데이터 로딩 실패");
  return json.data;
};

const fetchMainBoards = async () => {
  // 게시판 설정 불러오기
  const configsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/board-configs`);
  const configsJson = await configsRes.json();
  
  if (!configsJson.success) return [];

  const mainBoards = (configsJson.data || [])
    .filter((b: any) => b.showOnMain)
    .sort((a: any, b: any) => (a.exposureOrder || 0) - (b.exposureOrder || 0));

  // 각 게시판별 최신 게시글 가져오기
  const boardsWithPosts = await Promise.all(mainBoards.map(async (board: any) => {
    const postsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boards/${board.tableName || board.id}/posts?page=1&limit=${board.mainExposureCount || 5}`);
    const postsJson = postsRes.ok ? await postsRes.json() : { data: [] };
    return { ...board, posts: postsJson.data || [] };
  }));

  return boardsWithPosts;
};

// 💡 3. 더 이상 async function이 아닙니다!
export default function MainPage() {
  
  // 💡 4. React Query의 useQuery 훅으로 데이터를 가져오고 상태를 관리합니다.
  const { 
    data: mainPageData, 
    isLoading: isMainLoading, 
    isError: isMainError 
  } = useQuery({
    queryKey: ['mainPageData'],
    queryFn: fetchMainPageData,
  });

  const { 
    data: mainBoardsWithPosts = [], 
    isLoading: isBoardsLoading 
  } = useQuery({
    queryKey: ['mainBoards'],
    queryFn: fetchMainBoards,
  });

  // 💡 5. 로딩 중일 때 보여줄 UI를 간단하게 처리할 수 있습니다.
  if (isMainLoading || isBoardsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <h1 className="text-xl font-bold text-slate-500">데이터를 불러오는 중입니다...</h1>
      </div>
    );
  }

  // 에러가 났거나 데이터가 없을 때의 처리
  if (isMainError || !mainPageData) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <h1 className="text-2xl font-bold text-slate-500">메인 페이지가 아직 설정되지 않았습니다.</h1>
      </div>
    );
  }

  // 💡 6. 렌더링 영역 (기존과 동일합니다)
  return (
    <div className="w-full flex flex-col pb-24">
      {/* 슬라이더 영역 */}
      {mainPageData.sliderData && mainPageData.sliderData.length > 0 && (
        <MainSlider slides={mainPageData.sliderData} />
      )}

      {/* 빌더 콘텐츠 영역 */}
      {mainPageData.contentBlocks && mainPageData.contentBlocks.length > 0 && (
        <BlockRenderer blocks={mainPageData.contentBlocks} />
      )}

      {/* 메인 노출 게시판 렌더링 영역 */}
      {mainBoardsWithPosts.length > 0 && (
        <div className="w-full max-w-6xl mx-auto px-4 mt-16 flex flex-col gap-16">
          {mainBoardsWithPosts.map((board: any) => (
            <section key={board.id} className="w-full">
              {/* ... (이하 기존 JSX 코드와 100% 동일) ... */}
              {/* 코드 길이가 너무 길어 생략했지만 기존 리턴문 안에 있던 JSX를 그대로 쓰시면 됩니다. */}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}