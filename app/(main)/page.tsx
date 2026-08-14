// src/app/page.tsx
import Link from "next/link";
import BlockRenderer from "@/components/main/BlockRenderer";
import MainSlider from "@/components/main/MainSlider";

export default async function MainPage() {
  let mainPageData = null;
  let mainBoardsWithPosts: any[] = [];

  try {
    // 1. 메인 빌더 페이지 데이터 페칭
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pages`, { cache: "no-store" });
    const json = await res.json();
    if (json.success) {
      mainPageData = json.data.find((p: any) => p.menuId === null);
    }

    // 💡 2. 메인에 노출될 게시판 설정들 불러오기 (exposureOrder 오름차순 정렬)
    const configsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/board-configs`, { cache: "no-store" });
    const configsJson = await configsRes.json();
    
    if (configsJson.success) {
      const mainBoards = (configsJson.data || [])
        .filter((b: any) => b.showOnMain)
        .sort((a: any, b: any) => (a.exposureOrder || 0) - (b.exposureOrder || 0));

      // 💡 3. 각 게시판별 최신 게시글 가져오기
      mainBoardsWithPosts = await Promise.all(mainBoards.map(async (board: any) => {
        const postsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boards/${board.tableName || board.id}/posts?page=1&limit=${board.mainExposureCount || 5}`, { cache: 'no-store' });
        const postsJson = postsRes.ok ? await postsRes.json() : { data: [] };
        return { ...board, posts: postsJson.data || [] };
      }));
    }
  } catch (error) {
    console.error("데이터 로딩 실패:", error);
  }

  if (!mainPageData) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <h1 className="text-2xl font-bold text-slate-500">메인 페이지가 아직 설정되지 않았습니다.</h1>
      </div>
    );
  }

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

      {/* 💡 메인 노출 게시판 렌더링 영역 */}
      {mainBoardsWithPosts.length > 0 && (
        <div className="w-full max-w-6xl mx-auto px-4 mt-16 flex flex-col gap-16">
          {mainBoardsWithPosts.map(board => (
            <section key={board.id} className="w-full">
              {/* 타이틀 및 더보기 버튼 */}
              <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-slate-900">
                <h2 className="text-2xl font-extrabold text-slate-800">{board.boardName}</h2>
                <Link href={`/boards/${board.tableName || board.id}`} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition">
                  더보기 +
                </Link>
              </div>

              {/* 게시판 타입별 렌더링 분기 */}
              {board.boardType === 'GALLERY' ? (
                // 💡 갤러리: 썸네일과 제목 노출
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {board.posts.map((post: any) => (
                    <Link key={post.id} href={`/boards/${board.tableName || board.id}/${post.id}`} className="block group">
                      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mb-3 relative">
                        {post.thumbnailUrl ? (
                          <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400 text-sm font-medium">No Image</div>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition">{post.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">{new Date(post.createdAt).toLocaleDateString()}</p>
                    </Link>
                  ))}
                  {board.posts.length === 0 && <div className="col-span-full text-center text-sm text-slate-400 py-8">등록된 게시글이 없습니다.</div>}
                </div>
              ) : (
                // 💡 일반/FAQ: 리스트 노출 (제목, 날짜)
                <ul className="flex flex-col">
                  {board.posts.map((post: any) => (
                    <li key={post.id} className="border-b border-slate-100 last:border-none">
                      <Link href={`/boards/${board.tableName || board.id}/${post.id}`} className="flex justify-between items-center py-4 hover:bg-slate-50 px-2 rounded-lg transition group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          {post.isNotice && <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600">공지</span>}
                          {post.category && <span className="shrink-0 text-sm font-bold text-indigo-600">[{post.category}]</span>}
                          <span className="font-medium text-slate-700 group-hover:text-indigo-600 truncate">{post.title}</span>
                        </div>
                        <span className="text-sm font-medium text-slate-400 shrink-0 ml-4">{new Date(post.createdAt).toLocaleDateString()}</span>
                      </Link>
                    </li>
                  ))}
                  {board.posts.length === 0 && <li className="text-center text-sm text-slate-400 py-8 border-b border-slate-100">등록된 게시글이 없습니다.</li>}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}