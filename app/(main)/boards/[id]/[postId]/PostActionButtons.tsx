'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function PostActionButtons({ boardId, postId, boardConfig }: { boardId: string, postId: string, boardConfig: any }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userLevel, setUserLevel] = useState(1);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) { try { setUserLevel(JSON.parse(userStr).level); } catch (e) { } }
  }, []);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boards/posts/${postId}`, { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }) 
        }
      });

      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('로그인 세션 만료');
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '삭제 실패');
      }
      return res.json();
    },
    onSuccess: () => {
      // 💡 삭제 후 목록 캐시 만료 처리
      queryClient.invalidateQueries({ queryKey: ['boardPosts', boardId] });
      alert('게시글이 삭제되었습니다.');
      router.push(`/boards/${boardId}`);
      router.refresh();
    },
    onError: (error: any) => {
      if (error.message !== '로그인 세션 만료') {
        alert(`삭제 실패: ${error.message}`);
      }
    }
  });

  const handleDelete = () => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.')) return;
    deleteMutation.mutate();
  };

  return (
    <div className="flex gap-2">
      {userLevel >= boardConfig?.writeLevel && (
        <Link href={`/boards/${boardId}/${postId}/edit`} className="px-5 py-2.5 font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors">
          수정
        </Link>
      )}
      {userLevel >= boardConfig?.deleteLevel && (
        <button onClick={handleDelete} disabled={deleteMutation.isPending} className="px-5 py-2.5 font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50">
          삭제
        </button>
      )}
    </div>
  );
}