// src/app/(main)/boards/[id]/posts/[postId]/page.tsx (또는 PostDetail 컴포넌트 경로)
'use client';

import Link from 'next/link';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import PostActionButtons from './PostActionButtons'; // 경로에 맞게 수정해주세요

const fetchPostDetail = async (boardId: string, postId: string) => {
  const [boardRes, postRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/board-configs/${boardId}`),
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boards/posts/${postId}`)
  ]);
  
  const postData = postRes.ok ? await postRes.json() : null;
  const boardConfig = boardRes.ok ? (await boardRes.json()).data : null;

  return {
    boardConfig,
    post: postData?.data || null,
    prevPost: postData?.prevPost || null,
    nextPost: postData?.nextPost || null
  };
};

const isImage = (url: string) => /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
const isVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

// URL에서 파일명만 추출하는 헬퍼 함수
const getFileName = (url: string) => {
  try {
    const decoded = decodeURIComponent(url);
    return decoded.split('/').pop() || '첨부파일';
  } catch {
    return '첨부파일';
  }
};

export default function PostDetailPage({ params }: { params: Promise<{ id: string, postId: string }> }) {
  const resolvedParams = use(params);
  const { id: boardId, postId } = resolvedParams;

  const { data, isLoading } = useQuery({
    queryKey: ['postDetail', postId],
    queryFn: () => fetchPostDetail(boardId, postId),
  });

  if (isLoading) {
    return <div className="w-full text-center pt-32 text-slate-500 font-medium">로딩 중...</div>;
  }

  const { boardConfig, post, prevPost, nextPost } = data || {};

  if (!post) {
    return (
      <div className="w-full flex justify-center pt-32">
        <div className="text-center bg-slate-50 p-12 rounded-2xl border border-slate-200">
          <p className="text-xl font-bold text-slate-700 mb-4">게시글을 찾을 수 없습니다.</p>
          <Link href={`/boards/${boardId}`} className="text-blue-600 font-medium hover:underline">목록으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  // 파일 데이터 파싱
  const mediaUrls: string[] = typeof post.mediaUrls === 'string' ? JSON.parse(post.mediaUrls) : (post.mediaUrls || []);
  
  // 이미지와 일반 파일(다운로드용) 분리
  const imageUrls = mediaUrls.filter(isImage);
  const fileUrls = mediaUrls.filter((url: string) => !isImage(url) && !isVideo(url));

  return (
    <div className="w-full flex flex-col pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-4 w-full">
        <article className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <header className="px-6 py-8 md:px-10 md:py-10 border-b border-slate-100 bg-slate-50/30">
            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              {post.category && <span className="text-blue-600 mr-3">[{post.category}]</span>}
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-1.5 text-slate-700">{post.writerName}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>{new Date(post.createdAt).toLocaleString()}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>조회 {post.hitCount}</span>
            </div>
          </header>

          <div className="px-6 py-8 md:px-10 md:py-12">
            {/* 글 본문 영역 */}
            {boardConfig?.useEditor ? (
              <div className="text-slate-800 text-lg leading-relaxed min-h-[250px] editor-output" dangerouslySetInnerHTML={{ __html: post.content }} />
            ) : (
              <div className="text-slate-800 text-lg leading-relaxed whitespace-pre-wrap min-h-[250px]">{post.content}</div>
            )}

            {/* 이미지 렌더링 영역 (글 내용 하단에 이미지 출력) */}
            {imageUrls.length > 0 && (
              <div className="mt-10 flex flex-col gap-6">
                {imageUrls.map((url, index) => (
                  <img 
                    key={index} 
                    src={url} 
                    alt={`본문 첨부 이미지 ${index + 1}`} 
                    className="max-w-full h-auto rounded-xl shadow-sm border border-slate-100"
                    loading="lazy"
                  />
                ))}
              </div>
            )}
          </div>

          {/* 일반 파일 다운로드 영역 */}
          {fileUrls.length > 0 && (
            <div className="px-6 py-5 md:px-10 bg-slate-50 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                </svg>
                첨부파일 ({fileUrls.length}개)
              </h3>
              <ul className="space-y-2">
                {fileUrls.map((url, index) => (
                  <li key={index} className="flex items-center">
                    <a 
                      href={url} 
                      download 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors break-all"
                    >
                      {getFileName(url)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>

        <div className="flex justify-between items-center mt-8">
          <Link href={`/boards/${boardId}`} className="px-6 py-2.5 font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors">
            목록으로
          </Link>
          <PostActionButtons boardId={boardId} postId={postId} boardConfig={boardConfig}/>
        </div>
      </div>
    </div>
  );
}