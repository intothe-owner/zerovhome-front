// src/app/(main)/boards/[id]/write/page.tsx
'use client';

import { useState, use, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CustomEditor from '@/components/main/CustomEditor'; // 경로 맞춰 수정

export default function PostWritePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const boardId = resolvedParams.id;

  const [boardConfig, setBoardConfig] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [extraData, setExtraData] = useState<Record<string, any>>({});
  
  const [content, setContent] = useState('');
  const [editorFiles, setEditorFiles] = useState<{ file: File, id: string }[]>([]);

  // 💡 드래그 앤 드롭 상태 관리를 위한 state 및 ref 추가
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

  const handleEditorImageAttach = (file: File, id: string) => {
    setEditorFiles(prev => [...prev, { file, id }]);
  };

  const handleCheckboxChange = (name: string, value: string, checked: boolean) => {
    setExtraData(prev => {
      const current = prev[name] || [];
      if (checked) return { ...prev, [name]: [...current, value] };
      else return { ...prev, [name]: current.filter((v: string) => v !== value) };
    });
  };

  // 💡 파일 첨부 관련 핸들러들
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
      const droppedFiles = Array.from(e.dataTransfer.files);
      addFiles(droppedFiles);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
    // 동일한 파일 재선택 가능하도록 value 초기화
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addFiles = (newFiles: File[]) => {
    setFiles(prev => {
      const totalFiles = [...prev, ...newFiles];
      // 최대 업로드 개수 제한 설정
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const pureText = content.replace(/<[^>]*>?/gm, '').trim();
    if (!content.includes('<img') && pureText === '') {
      alert('내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
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

    // 💡 변경된 파일 배열을 formData에 추가
    files.forEach(file => { if (file) formData.append('attachments', file); });
    
    if (Object.keys(extraData).length > 0) formData.append('extraData', JSON.stringify(extraData));
    if (isLoggedIn && userData) formData.append('memberId', userData.id);

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boards/${boardId}/posts`, {
        method: 'POST', 
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: formData,
      });
      if (res.ok) {
        router.push(`/boards/${boardId}`);
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.message || '게시글 등록에 실패했습니다.');
      }
    } catch (error) { 
      alert('서버 오류가 발생했습니다.'); 
    }
    setIsSubmitting(false);
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
            
            {/* 기본 입력 폼 */}
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

            {/* 에디터 */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">내용 *</label>
              {boardConfig.useEditor ? (
                <CustomEditor 
                  value={content} 
                  onChange={setContent} 
                  onImageAttach={handleEditorImageAttach}
                  placeholder="자유롭게 내용을 작성해주세요. (이미지 드래그 후 크기 조절 가능)" 
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

            {/* 💡 파일 드래그 앤 드롭 컴포넌트 */}
            {boardConfig.fileUploadCount > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-bold text-slate-700">첨부파일</label>
                  <span className="text-xs text-slate-500">
                    ({files.length} / {boardConfig.fileUploadCount}개)
                  </span>
                </div>
                
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors cursor-pointer 
                    ${isDragging 
                      ? 'border-blue-500 bg-blue-50/50' 
                      : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
                    }`}
                >
                  <svg className="w-8 h-8 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-slate-600 font-medium">클릭하거나 파일을 이곳으로 드래그 하세요.</p>
                  <p className="text-xs text-slate-500 mt-1">개별 첨부 시 Ctrl(Cmd)을 누르고 다중 선택할 수 있습니다.</p>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>

                {/* 첨부된 파일 리스트 */}
                {files.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {files.map((file, index) => (
                      <li key={index} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <span className="text-sm text-slate-700 truncate">{file.name} <span className="text-xs text-slate-400 ml-1">({(file.size / 1024 / 1024).toFixed(2)} MB)</span></span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                          className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          삭제
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button type="button" onClick={() => router.back()} className="px-6 py-3 font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">취소</button>
              <button type="submit" disabled={isSubmitting} className="px-8 py-3 font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">등록 완료</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}