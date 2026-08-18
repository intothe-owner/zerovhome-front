// src/app/(main)/boards/[id]/write/page.tsx (또는 PostWriteClient.tsx)
'use client';

import { useState, use, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import CustomEditor from '@/components/main/CustomEditor';

export default function PostWritePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const resolvedParams = use(params);
  const boardId = resolvedParams.id;

  const [boardConfig, setBoardConfig] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [extraData, setExtraData] = useState<Record<string, any>>({});
  
  const [content, setContent] = useState('');
  const [editorFiles, setEditorFiles] = useState<{ file: File, id: string }[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    let currentLevel = 1;
    
    if (userStr) {
      const user = JSON.parse(userStr);
      currentLevel = user.level;
      setIsLoggedIn(true);
      setUserData(user);
    }

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/board-configs/${boardId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          if (currentLevel < json.data.writeLevel) {
            alert('글쓰기 권한이 없습니다.');
            router.push(`/boards/${boardId}`);
            return;
          }
          setBoardConfig(json.data);
        }
      });
  }, [boardId, router]);

  // 글 작성 뮤테이션 정의
  const writeMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boards/${boardId}/posts`, {
        method: 'POST', 
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || '게시글 등록에 실패했습니다.');
      }
      return res.json();
    },
    onSuccess: () => {
      // 💡 게시글 목록 캐시 무효화로 최신화
      queryClient.invalidateQueries({ queryKey: ['boardPosts', boardId] });
      router.push(`/boards/${boardId}`);
      router.refresh();
    },
    onError: (error: any) => {
      alert(error.message || '서버 오류가 발생했습니다.');
    }
  });

  const handleEditorImageAttach = (file: File, id: string) => {
    setEditorFiles(prev => [...prev, { file, id }]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addFiles = (newFiles: File[]) => {
    setFiles(prev => {
      const totalFiles = [...prev, ...newFiles];
      if (totalFiles.length > boardConfig.fileUploadCount) {
        alert(`첨부파일은 최대 ${boardConfig.fileUploadCount}개까지만 업로드 가능합니다.`);
        return totalFiles.slice(0, boardConfig.fileUploadCount);
      }
      return totalFiles;
    });
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const pureText = content.replace(/<[^>]*>?/gm, '').trim();
    if (!content.includes('<img') && pureText === '') {
      alert('내용을 입력해주세요.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const imgs = tempDiv.querySelectorAll('img[data-file-id]');
    
    imgs.forEach(img => {
      const id = img.getAttribute('data-file-id');
      img.setAttribute('src', `cid:${id}`);
      img.removeAttribute('data-file-id');
    });
    
    formData.set('content', tempDiv.innerHTML);

    editorFiles.forEach(ef => {
      const ext = ef.file.name.split('.').pop();
      formData.append('editorImages', ef.file, `${ef.id}.${ext}`);
    });

    files.forEach(file => { if (file) formData.append('attachments', file); });
    
    if (Object.keys(extraData).length > 0) formData.append('extraData', JSON.stringify(extraData));
    if (isLoggedIn && userData) formData.append('memberId', userData.id);

    writeMutation.mutate(formData);
  };

  if (!boardConfig) return <div className="w-full text-center pt-32 text-slate-500 font-medium">로딩 중...</div>;

  const categories = boardConfig.categories ? boardConfig.categories.split(',').map((c: string) => c.trim()) : [];
  
  return (
    <div className="w-full flex flex-col pt-24 pb-24 bg-slate-50/50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{boardConfig.boardName} 글 작성</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.length > 0 && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">카테고리</label>
                  <select name="category" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                    <option value="">카테고리 선택</option>
                    {categories.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              )}
              {!isLoggedIn ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">작성자 *</label>
                    <input type="text" name="writerName" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">비밀번호 *</label>
                    <input type="password" name="password" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                  </div>
                </>
              ) : (
                <input type="hidden" name="writerName" value={userData?.name || '회원'} />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">제목 *</label>
              <input type="text" name="title" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">내용 *</label>
              {boardConfig.useEditor ? (
                <CustomEditor 
                  value={content} 
                  onChange={setContent} 
                  onImageAttach={handleEditorImageAttach}
                  placeholder="자유롭게 내용을 작성해주세요." 
                />
              ) : (
                <textarea 
                  name="content" 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required 
                  rows={12} 
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none leading-relaxed"
                />
              )}
            </div>

            {boardConfig.fileUploadCount > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-bold text-slate-700">첨부파일</label>
                  <span className="text-xs text-slate-500">({files.length} / {boardConfig.fileUploadCount}개)</span>
                </div>
                
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
                >
                  <p className="text-sm text-slate-600 font-medium">클릭하거나 파일을 이곳으로 드래그 하세요.</p>
                  <input type="file" multiple ref={fileInputRef} onChange={handleFileInputChange} className="hidden" />
                </div>

                {files.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {files.map((file, index) => (
                      <li key={index} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <span className="text-sm text-slate-700 truncate">{file.name}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(index); }} className="text-red-500 text-sm font-medium px-2 py-1">삭제</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button type="button" onClick={() => router.back()} className="px-6 py-3 font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">취소</button>
              <button type="submit" disabled={writeMutation.isPending} className="px-8 py-3 font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">등록 완료</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}