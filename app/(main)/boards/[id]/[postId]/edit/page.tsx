// src/app/(main)/boards/[id]/[postId]/edit/page.tsx
'use client';

import { useState, use, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import CustomEditor from '@/components/main/CustomEditor';

export default function PostEditPage({ params }: { params: Promise<{ id: string, postId: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const resolvedParams = use(params);
  const { id: boardId, postId } = resolvedParams;

  const [boardConfig, setBoardConfig] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [formData, setFormData] = useState({ writerName: '', password: '', title: '', content: '', category: '' });
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [extraData, setExtraData] = useState<Record<string, any>>({});
  const [editorFiles, setEditorFiles] = useState<{ file: File, id: string }[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setIsLoggedIn(true);
    }

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/board-configs/${boardId}`).then(res => res.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boards/posts/${postId}`).then(res => res.json())
    ]).then(([boardRes, postRes]) => {
      if (boardRes.success) setBoardConfig(boardRes.data);
      if (postRes.success) {
        const post = postRes.data;
        setFormData({ 
          writerName: post.writerName || '', 
          password: '', 
          title: post.title || '', 
          content: post.content || '', 
          category: post.category || '' 
        });
        if (post.extraData) setExtraData(post.extraData);
        if (post.mediaUrls) setExistingFiles(typeof post.mediaUrls === 'string' ? JSON.parse(post.mediaUrls) : post.mediaUrls);
      }
    });
  }, [boardId, postId]);

  const editMutation = useMutation({
    mutationFn: async (submitData: FormData) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boards/posts/${postId}`, { 
        method: 'PUT', 
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: submitData 
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '수정 실패');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postDetail', postId] });
      queryClient.invalidateQueries({ queryKey: ['boardPosts', boardId] });
      router.push(`/boards/${boardId}/${postId}`);
      router.refresh();
    },
    onError: (error: any) => {
      alert(`수정 실패: ${error.message}`);
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditorImageAttach = (file: File, id: string) => {
    setEditorFiles(prev => [...prev, { file, id }]);
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

  const removeExistingFile = (indexToRemove: number) => {
    setExistingFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const pureText = formData.content.replace(/<[^>]*>?/gm, '').trim();
    if (!formData.content.includes('<img') && pureText === '') {
      alert('내용을 입력해주세요.');
      return;
    }

    const submitData = new FormData(); 
    submitData.append('writerName', formData.writerName);
    
    if (!isLoggedIn) submitData.append('password', formData.password);
    submitData.append('title', formData.title);
    
    let finalContent = formData.content;
    if (boardConfig?.useEditor) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = finalContent;
      tempDiv.querySelectorAll('img[data-file-id]').forEach(img => {
        const id = img.getAttribute('data-file-id');
        img.setAttribute('src', `cid:${id}`); 
        img.removeAttribute('data-file-id');
      });
      finalContent = tempDiv.innerHTML;
    }
    submitData.append('content', finalContent);

    if (formData.category) submitData.append('category', formData.category);
    if (Object.keys(extraData).length > 0) submitData.append('extraData', JSON.stringify(extraData));
    submitData.append('existingFiles', JSON.stringify(existingFiles));

    editorFiles.forEach(ef => {
      submitData.append('editorImages', ef.file, `${ef.id}.${ef.file.name.split('.').pop()}`);
    });

    files.forEach((file) => { if (file) submitData.append('attachments', file); });

    editMutation.mutate(submitData);
  };

  if (!boardConfig) return <div className="w-full text-center pt-32 text-slate-500 font-medium">로딩 중...</div>;

  const categories = boardConfig.categories ? boardConfig.categories.split(',').map((c: string) => c.trim()) : [];

  return (
    <div className="w-full flex flex-col pt-24 pb-24 bg-slate-50/50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 w-full">
        <div className="mb-8"><h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{boardConfig.boardName} 수정</h1></div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.length > 0 && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">카테고리</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                    <option value="">카테고리 선택</option>
                    {categories.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              )}
              
              {!isLoggedIn && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">작성자 *</label>
                    <input type="text" name="writerName" value={formData.writerName} required onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">비밀번호 확인 *</label>
                    <input type="password" name="password" value={formData.password} required onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">제목 *</label>
              <input type="text" name="title" value={formData.title} required onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">내용 *</label>
              {boardConfig.useEditor ? (
                <CustomEditor value={formData.content} onChange={(val) => setFormData(prev => ({ ...prev, content: val }))} onImageAttach={handleEditorImageAttach} />
              ) : (
                <textarea name="content" value={formData.content} required rows={12} onChange={handleChange} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 resize-none leading-relaxed" />
              )}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button type="button" onClick={() => router.back()} className="px-6 py-3 font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">취소</button>
              <button type="submit" disabled={editMutation.isPending} className="px-8 py-3 font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">수정 완료</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}