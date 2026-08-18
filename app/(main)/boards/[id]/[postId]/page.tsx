'use client';

import Link from 'next/link';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import PostActionButtons from './PostActionButtons';

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

  const mediaUrls: string[] = typeof post.mediaUrls === 'string' ? JSON.parse(post.mediaUrls) : (post.mediaUrls || []);
  const hasFiles = boardConfig?.useEditor ? mediaUrls.length > 0 : mediaUrls.some((url: string) => !isImage(url) && !isVideo(url));
  const extraFields = boardConfig?.extraFields || [];

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
            {boardConfig?.useEditor ? (
              <div className="text-slate-800 text-lg leading-relaxed min-h-[250px] editor-output" dangerouslySetInnerHTML={{ __html: post.content }} />
            ) : (
              <div className="text-slate-800 text-lg leading-relaxed whitespace-pre-wrap min-h-[250px]">{post.content}</div>
            )}
          </div>
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