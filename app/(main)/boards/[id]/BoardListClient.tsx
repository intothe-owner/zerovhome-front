// src/app/(main)/boards/[id]/BoardListClient.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

interface BoardListClientProps {
  boardId: string;
  boardConfig: any;
  initialPosts: any[];
  initialTotalPages: number;
  initialTotalCount?: number;
  initialCategory?: string;
}

const fetchBoardPosts = async (boardId: string, page: number, limit: number, search: string, category: string) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boards/${boardId}/posts?page=${page}&limit=${limit}&search=${search}&category=${encodeURIComponent(category)}`);
  const json = await res.json();
  if (!json.success) throw new Error('게시글 목록 불러오기 실패');
  return json;
};

export default function BoardListClient({ boardId, boardConfig, initialPosts, initialTotalPages, initialTotalCount = 0, initialCategory = '' }: BoardListClientProps) {
  const router = useRouter();
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [allPosts, setAllPosts] = useState(initialPosts);

  const boardType = boardConfig.boardType;
  const listCount = boardConfig.listCount || 10;
  const categories = boardConfig.categories ? boardConfig.categories.split(',').map((c: string) => c.trim()) : [];

  const [userLevel, setUserLevel] = useState(1);
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) { try { setUserLevel(JSON.parse(userStr).level); } catch (e) { } }
  }, []);

  // React Query를 통한 데이터 페칭
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['boardPosts', boardId, page, submittedSearch, selectedCategory],
    queryFn: () => fetchBoardPosts(boardId, page, listCount, submittedSearch, selectedCategory),
    initialData: page === 1 && !submittedSearch && selectedCategory === initialCategory 
      ? { success: true, data: initialPosts, totalPages: initialTotalPages, totalCount: initialTotalCount > 0 ? initialTotalCount : initialPosts.length }
      : undefined,
  });

  const posts = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const totalCount = data?.totalCount || posts.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSubmittedSearch(search);
  };

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    setPage(1);
    setSubmittedSearch('');
    setSearch('');
    
    const newUrl = cat ? `/boards/${boardId}?category=${encodeURIComponent(cat)}` : `/boards/${boardId}`;
    router.push(newUrl, { scroll: false });
  };

  const handlePageClick = (p: number) => {
    setPage(p);
  };

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
                        {totalCount - ((page - 1) * listCount) - index}
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
                <li key={post.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <Link href={`/boards/${boardId}/${post.id}`} className="block">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-400 shrink-0">
                        {totalCount - ((page - 1) * listCount) - index}
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
            {posts.map((post: any) => (
              <Link key={post.id} href={`/boards/${boardId}/${post.id}`} className="group flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all">
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
            {posts.map((post: any) => (
              <details key={post.id} className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
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