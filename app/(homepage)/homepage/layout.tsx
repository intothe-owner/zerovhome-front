import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: '인투더(IntoThe) | 전문 웹 아웃소싱 파트너',
  description: 'Next.js와 Node.js 기반 커스텀 웹사이트 개발',
};

export default function HomepageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 전체 배경색을 연한 파란색으로 지정
    <div className="min-h-screen bg-[#F4F8FB] text-[#1A1A1A] font-sans selection:bg-blue-200">
      
      {/* 글로벌 네비게이션 바 (Glassmorphism 적용) */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-white/40 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* 로고 영역 */}
          <Link href="/homepage" className="text-2xl font-bold tracking-tighter text-blue-600">
            IntoThe.
          </Link>

          {/* 메뉴 영역 (한글) */}
          <nav className="hidden md:flex items-center space-x-8 font-medium">
            <Link href="#home" className="hover:text-blue-600 transition-colors">홈</Link>
            <Link href="#philosophy" className="hover:text-blue-600 transition-colors">철학</Link>
            <Link href="#features" className="hover:text-blue-600 transition-colors">핵심 기능</Link>
            <Link href="#tech" className="hover:text-blue-600 transition-colors">기술 스택</Link>
          </nav>

          {/* CTA 버튼 (외주 개발 파트너로서의 전환 유도) */}
          <Link 
            href="#contact" 
            className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30"
          >
            프로젝트 문의
          </Link>
        </div>
      </header>

      {/* 메인 콘텐츠 영역 (페이지 내용이 여기에 들어감) */}
      <main className="relative w-full">
        {children}
      </main>

      {/* 간단한 푸터 */}
      <footer className="py-8 bg-[#EBF3FE] text-center text-sm text-gray-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <p>© 2026 IntoThe. All rights reserved.</p>
          <p>전문 외주 개발 파트너, 인투더</p>
        </div>
      </footer>
      
    </div>
  );
}