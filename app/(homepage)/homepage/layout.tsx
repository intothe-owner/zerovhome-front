'use client';

import React from 'react';
import Link from 'next/link';

export default function HomepageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  // 스무스 스크롤 핸들러 함수
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      // 해당 ID를 가진 요소로 부드럽게 스크롤 이동
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 font-sans selection:bg-purple-500/30">
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-[#09090B]/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <Link href="/homepage" className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
            ZeroV.
          </Link>

          {/* onClick 이벤트로 스무스 스크롤 연결 */}
          <nav className="hidden md:flex items-center space-x-8 font-medium text-zinc-400">
            <a href="#home" onClick={(e) => handleScroll(e, 'home')} className="cursor-pointer hover:text-cyan-400 transition-colors">홈</a>
            <a href="#philosophy" onClick={(e) => handleScroll(e, 'philosophy')} className="cursor-pointer hover:text-cyan-400 transition-colors">철학</a>
            <a href="#features" onClick={(e) => handleScroll(e, 'features')} className="cursor-pointer hover:text-cyan-400 transition-colors">핵심 기능</a>
            <a href="#tech" onClick={(e) => handleScroll(e, 'tech')} className="cursor-pointer hover:text-cyan-400 transition-colors">기술 스택</a>
          </nav>

          <a 
            href="#contact" 
            onClick={(e) => handleScroll(e, 'contact')}
            className="cursor-pointer px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-full font-bold hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300"
          >
            프로젝트 문의
          </a>
        </div>
      </header>

      <main className="relative w-full">
        {children}
      </main>

      <footer className="py-12 bg-zinc-950 border-t border-zinc-900 text-center text-sm text-zinc-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 ZeroV. All rights reserved.</p>
          <p>전문 외주 개발 파트너, 제로브이</p>
        </div>
      </footer>
    </div>
  );
}