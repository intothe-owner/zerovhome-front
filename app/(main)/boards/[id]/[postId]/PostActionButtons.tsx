'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PostActionButtons({ boardId, postId,boardConfig }: { boardId: string, postId: string,boardConfig:any }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.')) return;

    // 💡 1. 로컬 스토리지에서 토큰 가져오기 (저장하신 키 이름에 맞게 확인해주세요)
    const token = localStorage.getItem('token');
    
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boards/posts/${postId}`, { 
        method: 'DELETE',
        // 💡 2. 헤더에 토큰 추가하기
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }) 
        }
      });
      
      // 💡 3. 토큰이 만료되었거나 없을 때 (401 에러) 처리
      if (res.status === 401) {
        alert('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login'; // 로그인 페이지로 이동
        return;
      }

      if (res.ok) {
        alert('게시글이 삭제되었습니다.');
        router.push(`/boards/${boardId}`);
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(`삭제 실패: ${errorData.message}`);
      }
    } catch (error) {
      alert('서버 통신 오류가 발생했습니다.');
    }
  };
  console.log(boardConfig);
  const [userLevel, setUserLevel] = useState(1);
      useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) { try { setUserLevel(JSON.parse(userStr).level); } catch (e) { } }
      }, []);
  return (
    <div className="flex gap-2">
      
      {userLevel >= boardConfig.writeLevel && (
        <Link 
        href={`/boards/${boardId}/${postId}/edit`} 
        className="px-5 py-2.5 font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
      >
        수정
      </Link>
      )}
      {userLevel >= boardConfig.deleteLevel && (
      <button 
        onClick={handleDelete} 
        className="px-5 py-2.5 font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
      >
        삭제
      </button>
      )}
    </div>
  );
}