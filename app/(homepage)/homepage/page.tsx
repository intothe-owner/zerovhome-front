import React from 'react';

export default function Homepage() {
  return (
    <div className="w-full flex flex-col">
      
      {/* 1. 홈 (Hero Section) */}
      <section id="home" className="relative w-full h-screen flex flex-col items-center justify-center pt-20">
        {/* TODO: 여기에 마우스에 반응하는 Three.js Canvas 배치 */}
        <div className="relative z-10 text-center flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-gray-900 drop-shadow-sm">
            템플릿을 넘어선 <br className="hidden md:block" />
            <span className="text-blue-600">맞춤형 웹 퍼포먼스</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-10">
            Next.js와 자체 개발 Node.js CMS로 완성하는 가장 강력한 커스텀 웹.<br />
            비즈니스에 완벽히 핏(Fit)되는 외주 개발 파트너, 인투더입니다.
          </p>
        </div>
      </section>

      {/* 2. 철학 (Philosophy) */}
      <section id="philosophy" className="w-full min-h-screen py-24 flex items-center justify-center">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-8">무거운 템플릿과 타협하시겠습니까?</h2>
          {/* TODO: 스크롤에 따라 큐브가 유연한 액체로 변하는 3D 모핑 효과 배치 */}
        </div>
      </section>

      {/* 3. 핵심 기능 (Core Features) */}
      <section id="features" className="w-full min-h-screen py-24 bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-16 text-center">레고 조립하듯 쉬운 웹 관리</h2>
          {/* TODO: 3D UI 블록들이 위에서 떨어지며 조립되는 Isometric 애니메이션 배치 */}
        </div>
      </section>

      {/* 4. 기술 스택 (Tech Stack) */}
      <section id="tech" className="w-full min-h-screen py-24 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-8">트렌드를 선도하는 풀스택 기술</h2>
          {/* TODO: Next.js, Node.js, AWS, Docker 로고가 3D로 떠다니는 효과 배치 */}
        </div>
      </section>

      {/* 5. 프로젝트 문의 (Contact Us) */}
      <section id="contact" className="w-full py-32 flex items-center justify-center">
        <div className="max-w-3xl w-full mx-auto px-6 bg-white/50 backdrop-blur-md p-12 rounded-3xl shadow-xl border border-white/40">
          <h2 className="text-3xl font-bold mb-6 text-center">성공적인 비즈니스를 위한 첫걸음</h2>
          <p className="text-center text-gray-600 mb-8">요구사항을 남겨주시면, 인투더가 최적의 솔루션을 제안해 드립니다.</p>
          {/* TODO: 연락처 입력 폼(Form) UI 배치 */}
        </div>
      </section>

    </div>
  );
}