'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Blocks, Zap, Database } from 'lucide-react';

export default function Homepage() {
  const [showIntro, setShowIntro] = useState(true);

  // 인트로 타이머 (2초 후 메인 화면으로 전환)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    // 전체 배경을 깊은 블랙(Zinc-950)으로 변경하고 텍스트를 흰색으로 반전
    <div className="w-full flex flex-col relative overflow-hidden bg-[#09090B] text-white">
      
      {/* --- 1. 스태거드 그리드(Staggered Grid) 화려한 인트로 --- */}
      <AnimatePresence>
        {showIntro && (
          <div className="fixed inset-0 z-[100] flex">
            {/* 배경을 5개의 세로 블록으로 나누어 순차적으로 열리게 연출 */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ height: '100%' }}
                exit={{ height: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: i * 0.1 + 1, // 1초 대기 후 순차적으로 열림
                  ease: [0.7, 0, 0.3, 1] 
                }}
                className="flex-1 bg-zinc-900 border-r border-zinc-800"
              />
            ))}
            
            {/* 중앙에서 빛나는 제로브이 로고 */}
            <motion.div
               className="absolute inset-0 flex items-center justify-center pointer-events-none"
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }}
               transition={{ duration: 0.8, ease: "easeOut" }}
            >
               <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
                 ZeroV.
               </h1>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- 메인 콘텐츠 시작 --- */}
      
      {/* 1. 홈 (Hero Section) */}
      <section id="home" className="relative w-full h-screen flex flex-col items-center justify-center pt-20 overflow-hidden">
        {/* 화려한 네온 그라데이션 배경 효과 (블러 처리된 빛 번짐) */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
          className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full filter blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }}
          transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-[100px]"
        />

        <div className="relative z-10 text-center flex flex-col items-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.8, delay: 2.0 }} // 인트로 블록이 열린 직후 등장
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 drop-shadow-lg"
          >
            템플릿을 넘어선 <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              맞춤형 웹 퍼포먼스
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.8, delay: 2.3 }}
            className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10"
          >
            Next.js와 자체 개발 Node.js CMS로 완성하는 가장 강력한 커스텀 웹.<br />
            비즈니스에 완벽히 핏(Fit)되는 외주 개발 파트너, 제로브이입니다.
          </motion.p>
        </div>
      </section>

      {/* 2. 철학 (Philosophy) */}
      <section id="philosophy" className="w-full min-h-screen py-24 flex items-center justify-center relative">
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold mb-12"
          >
            무거운 템플릿과 타협하시겠습니까?
          </motion.h2>
          
          {/* 양쪽에서 나타나는 다크 글래스모피즘 카드 */}
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
            <motion.div 
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="w-full md:w-1/2 p-10 bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-3xl"
            >
              <h3 className="text-xl font-bold text-zinc-500 mb-4">기존 빌더의 한계</h3>
              <p className="text-zinc-400">느린 로딩 속도, 제한된 기능 확장, 천편일률적인 디자인.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.8, type: "spring", delay: 0.2 }}
              className="w-full md:w-1/2 p-10 bg-gradient-to-br from-zinc-800 to-zinc-900 backdrop-blur-md border border-purple-500/30 rounded-3xl text-left shadow-[0_0_30px_rgba(168,85,247,0.2)]"
            >
              <h3 className="text-2xl font-bold mb-4 text-cyan-400">제로브이 커스텀 개발</h3>
              <p className="text-zinc-300 mb-2">✓ 비즈니스 로직에 맞춘 맞춤형 CMS</p>
              <p className="text-zinc-300 mb-2">✓ 외부 아웃소싱 파트너로서의 철저한 관리</p>
              <p className="text-zinc-300">✓ 압도적인 SEO 및 성능 최적화</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. 핵심 기능 (Core Features) */}
      <section id="features" className="w-full min-h-screen py-24 relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            className="text-4xl font-bold mb-16 text-center"
          >
            레고 조립하듯 쉬운 웹 관리
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "드래그 앤 드롭 빌더", desc: "코딩 없이 누구나 쉽게 페이지를 구성하고 수정합니다.", icon: <Blocks size={40} className="text-cyan-400"/> },
              { title: "Next.js SSR 퍼포먼스", desc: "최상의 검색 엔진 최적화(SEO)와 쾌적한 로딩 속도를 보장합니다.", icon: <Zap size={40} className="text-purple-400"/> },
              { title: "맞춤형 Node.js 백엔드", desc: "결제, 회원관리 등 복잡한 비즈니스 확장을 유연하게 지원합니다.", icon: <Database size={40} className="text-cyan-400"/> }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 80 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
                className="bg-zinc-900/40 backdrop-blur-sm p-8 rounded-3xl border border-zinc-800 hover:border-cyan-500/50 hover:bg-zinc-800/50 hover:-translate-y-2 transition-all duration-300 group"
              >
                <div className="mb-6 bg-zinc-950 w-16 h-16 rounded-2xl flex items-center justify-center border border-zinc-800 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. 기술 스택 (Tech Stack) */}
      <section id="tech" className="w-full py-32 flex items-center justify-center overflow-hidden relative">
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            className="text-4xl font-bold mb-12"
          >
            트렌드를 선도하는 풀스택 기술
          </motion.h2>
          
          <div className="flex flex-wrap justify-center gap-4">
            {['Next.js', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'MySQL'].map((tech, idx) => (
              <motion.div
                key={tech}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ type: "spring", stiffness: 200, delay: idx * 0.1 }}
                className="px-6 py-3 bg-zinc-900 text-zinc-300 font-medium rounded-full border border-zinc-700 hover:border-purple-500 hover:text-purple-400 transition-colors cursor-default"
              >
                {tech}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. 프로젝트 문의 (Contact Us) */}
      <section id="contact" className="w-full py-32 flex items-center justify-center relative">
        <motion.div 
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl w-full mx-auto px-6 bg-zinc-900/60 backdrop-blur-xl p-12 rounded-[2.5rem] border border-zinc-800 relative z-10 shadow-[0_0_50px_rgba(168,85,247,0.1)]"
        >
          <h2 className="text-3xl font-bold mb-4 text-center">성공적인 비즈니스를 위한 첫걸음</h2>
          <p className="text-center text-zinc-400 mb-10">외주 전문 파트너 제로브이에 프로젝트를 의뢰해 보세요.</p>
          
          <form className="flex flex-col gap-4">
            <input type="text" placeholder="회사명 / 담당자 성함" className="w-full px-6 py-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition-all" />
            <input type="email" placeholder="이메일 주소" className="w-full px-6 py-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition-all" />
            <textarea placeholder="프로젝트에 대해 간단히 설명해 주세요." rows={4} className="w-full px-6 py-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition-all resize-none"></textarea>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 mt-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all"
            >
              프로젝트 문의하기
            </motion.button>
          </form>
        </motion.div>
      </section>

    </div>
  );
}