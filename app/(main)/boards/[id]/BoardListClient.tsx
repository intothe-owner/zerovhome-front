'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function BoardListClient({ boardId, boardConfig, initialPosts, initialTotalPages, initialTotalCount = 0, initialCategory = '' }: any) {
  const router = useRouter();
  
  const [posts, setPosts] = useState(initialPosts);
  const [page, setPage] = useState(1);
  const [startPage, setStartPage] = useState(1); // 💡 페이지 이동 시 넘버링 기준점이 되는 상태 추가
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  // 서버에서 initialTotalCount가 누락되어도 첫 화면 번호가 0, -1, -2가 되지 않도록 처리
  const [totalCount, setTotalCount] = useState(
    initialTotalCount > 0 ? initialTotalCount : initialPosts.length
  );
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory); 
  const [loading, setLoading] = useState(false);

  const boardType = boardConfig.boardType;
  const listCount = boardConfig.listCount || 10;
  
  const categories = boardConfig.categories ? boardConfig.categories.split(',').map((c: string) => c.trim()) : [];

  const [userLevel, setUserLevel] = useState(1);
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) { try { setUserLevel(JSON.parse(userStr).level); } catch (e) { } }
  }, []);

  const fetchPosts = async (currentPage: number, searchQuery: string, categoryQuery: string, isAppend: boolean = false) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boards/${boardId}/posts?page=${currentPage}&limit=${listCount}&search=${searchQuery}&category=${encodeURIComponent(categoryQuery)}`);
      const json = await res.json();
      if (json.success) {
        if (isAppend) {
          // 무한 스크롤로 이어붙일 때는 startPage를 변경하지 않음
          setPosts([...posts, ...json.data]);
        } else {
          // 페이지 번호를 누르거나 검색/카테고리를 클릭해 새 목록을 부를 때 기준점 업데이트
          setStartPage(currentPage);
          setPosts(json.data);
        }
        setTotalPages(json.totalPages);
        setTotalCount(json.totalCount);
      }
    } catch (error) { console.error('데이터 페칭 오류:', error); }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPosts(1, search, selectedCategory, false);
  };

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    setPage(1);
    
    const newUrl = cat ? `/boards/${boardId}?category=${encodeURIComponent(cat)}` : `/boards/${boardId}`;
    router.push(newUrl, { scroll: false });
    
    fetchPosts(1, search, cat, false);
  };

  const handlePageClick = (p: number) => {
    setPage(p);
    fetchPosts(p, search, selectedCategory, false);
  };

  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useCallback((node: any) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && page < totalPages) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPosts(nextPage, search, selectedCategory, true);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, page, totalPages, search, selectedCategory]);

  return (
    <div className="w-full flex flex-col pt-12 pb-24">
      <div className="max-w-6xl mx-auto px-4 w-full">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-6 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{boardConfig.boardName}</h1>
            <p className="text-slate-500 mt-2 text-sm">새로운 소식과 다양한 정보를 확인하세요.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <form onSubmit={handleSearch} className="flex flex-1 sm:flex-none">
              <input 
                type="text" 
                placeholder="제목 검색" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-l-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button type="submit" className="bg-slate-800 text-white px-5 py-2.5 rounded-r-xl text-sm font-medium hover:bg-slate-700 transition-colors shrink-0">
                검색
              </button>
            </form>
            {userLevel >= boardConfig.writeLevel && (
              <Link href={`/boards/${boardId}/write`} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shrink-0 flex items-center justify-center">
                글쓰기
              </Link>
            )}
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button 
              onClick={() => handleCategoryClick('')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${selectedCategory === '' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              전체
            </button>
            {categories.map((cat: string) => (
              <button 
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${selectedCategory === cat ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {boardType === 'GENERAL' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6 text-sm font-semibold text-slate-600 text-center w-24">번호</th>
                    <th className="py-4 px-6 text-sm font-semibold text-slate-600">제목</th>
                    <th className="py-4 px-6 text-sm font-semibold text-slate-600 text-center w-32">작성자</th>
                    <th className="py-4 px-6 text-sm font-semibold text-slate-600 text-center w-36">등록일</th>
                    <th className="py-4 px-6 text-sm font-semibold text-slate-600 text-center w-24">조회</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {posts.map((post: any, index: number) => (
                    <tr key={post.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-6 text-center text-sm text-slate-500 font-medium">
                        {/* 💡 페이지네이션 오프셋을 반영한 정확한 번호 계산식 */}
                        {totalCount - ((startPage - 1) * listCount) - index}
                      </td>
                      <td className="py-4 px-6">
                        <Link href={`/boards/${boardId}/${post.id}`} className="flex items-center text-slate-800 group-hover:text-blue-600 font-medium transition-colors">
                          {post.isNotice && <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-600 mr-2 shrink-0">공지</span>}
                          {post.category && <span className="text-slate-400 font-bold mr-2 shrink-0">[{post.category}]</span>}
                          <span className="truncate">{post.title}</span>
                        </Link>
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-slate-600 truncate">{post.writerName}</td>
                      <td className="py-4 px-6 text-center text-sm text-slate-500">{new Date(post.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 px-6 text-center text-sm text-slate-500">{post.hitCount}</td>
                    </tr>
                  ))}
                  {posts.length === 0 && <tr><td colSpan={5} className="py-16 text-center text-slate-500">등록된 게시글이 없습니다.</td></tr>}
                </tbody>
              </table>
            </div>
            
            <ul className="block md:hidden divide-y divide-slate-100">
              {posts.map((post: any, index: number) => (
                <li key={post.id} ref={index === posts.length - 1 ? lastPostElementRef : null} className="p-4 hover:bg-slate-50 transition-colors">
                  <Link href={`/boards/${boardId}/${post.id}`} className="block">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-400 shrink-0">
                        {/* 💡 모바일 뷰 넘버링도 동일하게 수정 */}
                        {totalCount - ((startPage - 1) * listCount) - index}
                      </span>
                      <div className="text-base font-semibold text-slate-800 truncate">
                        {post.isNotice && <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-600 mr-2">공지</span>}
                        {post.category && <span className="text-slate-400 font-bold mr-2">[{post.category}]</span>}
                        {post.title}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span className="font-medium text-slate-600">{post.writerName}</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()} | 조회 {post.hitCount}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {boardType === 'GALLERY' && (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {posts.map((post: any, index: number) => (
              <Link key={post.id} href={`/boards/${boardId}/${post.id}`} ref={index === posts.length - 1 ? lastPostElementRef : null} className="group flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all">
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                  {post.thumbnailUrl ? <img src={post.thumbnailUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  {post.category && <span className="text-xs text-blue-600 font-bold mb-1">{post.category}</span>}
                  <h3 className="font-bold text-slate-800 text-lg line-clamp-1 mb-2 group-hover:text-blue-600">{post.title}</h3>
                  <div className="mt-auto flex justify-between items-center text-sm text-slate-500">
                    <span className="font-medium">{post.writerName}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {boardType === 'FAQ' && (
          <div className="space-y-4">
            {posts.map((post: any, index: number) => (
              <details key={post.id} ref={index === posts.length - 1 ? lastPostElementRef : null} className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <summary className="cursor-pointer flex items-center justify-between p-5 list-none hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4 pr-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold shrink-0">Q</span>
                    <span className="font-semibold text-slate-800">
                      {post.category && <span className="text-slate-400 mr-2">[{post.category}]</span>}
                      {post.title}
                    </span>
                  </div>
                  <span className="text-slate-400 group-open:rotate-180 transition-transform duration-300 shrink-0">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                  </span>
                </summary>
                <div className="p-6 pt-2 bg-slate-50/50 border-t border-slate-100 text-slate-600 leading-relaxed">
                  <div className="flex items-start gap-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold shrink-0 mt-1">A</span>
                    <div className="whitespace-pre-wrap pt-1" dangerouslySetInnerHTML={{ __html: post.content }} />
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}

        <div className="hidden md:flex justify-center items-center gap-2 mt-12">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => handlePageClick(p)} className={`w-10 h-10 rounded-xl font-medium transition-all ${page === p ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{p}</button>
          ))}
        </div>
      </div>
    </div>
  );
}