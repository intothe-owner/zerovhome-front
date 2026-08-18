// src/app/(main)/boards/[id]/[postId]/page.tsx
import Link from 'next/link';
import PostActionButtons from './PostActionButtons';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function getPostData(boardId: string, postId: string) {
  const [boardRes, postRes] = await Promise.all([
    fetch(`${API_URL}/api/board-configs/${boardId}`, { cache: 'no-store' }),
    fetch(`${API_URL}/api/boards/posts/${postId}`, { cache: 'no-store' })
  ]);
  
  const postData = postRes.ok ? await postRes.json() : null;

  return {
    boardConfig: boardRes.ok ? (await boardRes.json()).data : null,
    post: postData?.data || null,
    prevPost: postData?.prevPost || null,
    nextPost: postData?.nextPost || null
  };
}

const isImage = (url: string) => /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
const isVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

export default async function PostDetailPage({ params }: { params: Promise<{ id: string, postId: string }> }) {
  const resolvedParams = await params;
  const { id: boardId, postId } = resolvedParams;
  const { boardConfig, post, prevPost, nextPost } = await getPostData(boardId, postId);

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
  
  // 💡 에디터를 사용하면 모든 파일을 첨부파일 목록으로 보여주고, 에디터 미사용시 이미지/영상이 아닌 것만 보여줍니다.
  const hasFiles = boardConfig?.useEditor 
    ? mediaUrls.length > 0 
    : mediaUrls.some((url: string) => !isImage(url) && !isVideo(url));
    
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
              <span className="flex items-center gap-1.5 text-slate-700">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600">👤</div>
                {post.writerName}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>{new Date(post.createdAt).toLocaleString()}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="flex items-center gap-1">
                조회 {post.hitCount}
              </span>
            </div>
          </header>

          <div className="px-6 py-8 md:px-10 md:py-12">
            
            {boardConfig?.useExtraFields && post.extraData && extraFields.length > 0 && (
              <div className="mb-10 bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h4 className="font-bold text-slate-700 mb-4 text-sm border-b border-slate-200 pb-2">상세 정보</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {extraFields.map((field: any, idx: number) => {
                    const value = post.extraData[field.fieldName];
                    if (!value || (Array.isArray(value) && value.length === 0)) return null;
                    return (
                      <div key={idx} className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-400">{field.fieldName}</span>
                        <span className="text-sm font-semibold text-slate-800">
                          {Array.isArray(value) ? value.join(', ') : value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 💡 에디터를 사용하지 않을 때만 이미지를 본문에 노출합니다. */}
            {!boardConfig?.useEditor && mediaUrls.length > 0 && (
              <div className="mb-10 space-y-6">
                {mediaUrls.map((url: string, idx: number) => {
                  if (isImage(url)) return <img key={idx} src={url} alt="첨부 이미지" className="w-full max-w-3xl mx-auto rounded-xl border border-slate-100 shadow-sm" />;
                  if (isVideo(url)) return <video key={idx} src={url} controls className="w-full max-w-3xl mx-auto rounded-xl border border-slate-100 shadow-sm" />;
                  return null;
                })}
              </div>
            )}

            {boardConfig?.useEditor ? (
              <div 
                className="text-slate-800 text-lg leading-relaxed min-h-[250px] editor-output"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            ) : (
              <div className="text-slate-800 text-lg leading-relaxed whitespace-pre-wrap min-h-[250px]">
                {post.content}
              </div>
            )}
          </div>

          {hasFiles && (
            <div className="mx-6 md:mx-10 mb-8 border border-slate-200 rounded-xl p-5 bg-slate-50">
              <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">첨부파일</h4>
              <ul className="space-y-2">
                {mediaUrls.map((url: string, idx: number) => {
                  // 💡 에디터 사용 시 모든 파일을 표시, 미사용 시 이미지/영상이 아닌 것만 표시
                  const showAsFile = boardConfig?.useEditor ? true : (!isImage(url) && !isVideo(url));
                  
                  if (showAsFile) {
                    const fileName = url.split('/').pop();
                    return (
                      <li key={idx}>
                        <a href={url} download className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2">
                          <span className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-500">FILE</span>
                          {fileName || `첨부파일 ${idx + 1}`}
                        </a>
                      </li>
                    );
                  }
                  return null;
                })}
              </ul>
            </div>
          )}
        </article>

        {/* 이전글 / 다음글 네비게이션 영역 */}
        {(prevPost || nextPost) && (
          <div className="mt-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {prevPost && (
                <li className="flex items-center px-6 py-4 hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-bold text-slate-500 w-24 shrink-0">▲ 이전글</span>
                  <Link href={`/boards/${boardId}/${prevPost.id}`} className="group relative flex-1 text-slate-700 hover:text-blue-600 font-medium truncate">
                    <span className="truncate block w-full">{prevPost.title}</span>
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-slate-800 text-white text-xs rounded-lg py-1.5 px-3 z-10 whitespace-nowrap shadow-lg">
                      {prevPost.title}
                      <svg className="absolute text-slate-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="0,0 127.5,127.5 255,0" /></svg>
                    </div>
                  </Link>
                </li>
              )}
              {nextPost && (
                <li className="flex items-center px-6 py-4 hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-bold text-slate-500 w-24 shrink-0">▼ 다음글</span>
                  <Link href={`/boards/${boardId}/${nextPost.id}`} className="group relative flex-1 text-slate-700 hover:text-blue-600 font-medium truncate">
                    <span className="truncate block w-full">{nextPost.title}</span>
                    <div className="absolute left-0 top-full mt-2 hidden group-hover:block bg-slate-800 text-white text-xs rounded-lg py-1.5 px-3 z-10 whitespace-nowrap shadow-lg">
                      <svg className="absolute text-slate-800 h-2 w-full left-0 bottom-full rotate-180" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="0,0 127.5,127.5 255,0" /></svg>
                      {nextPost.title}
                    </div>
                  </Link>
                </li>
              )}
            </ul>
          </div>
        )}

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