"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";

// 인증·인허가 데이터 패칭 함수
const fetchCertifications = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/certifications`);
  const json = await res.json();
  if (!json.success) throw new Error("인증서 데이터를 불러오는데 실패했습니다.");
  return json.data.filter((cert: any) => cert.isActive);
};

export default function CertificationList() {
  const { data: certs, isLoading } = useQuery({
    queryKey: ['certifications'],
    queryFn: fetchCertifications,
  });

  // 모달 상태 관리
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // 💡 돋보기(Loupe) 기능 상태 관리
  const [isLoupeMode, setIsLoupeMode] = useState(false);
  const [loupe, setLoupe] = useState({ show: false, x: 0, y: 0, bgX: 0, bgY: 0, bgW: 0, bgH: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  // 돋보기 설정값
  const LOUPE_SIZE = 240; // 돋보기 원형 크기 (px)
  const ZOOM_LEVEL = 2.5; // 확대 비율

  // 🖱️ [PC] 마우스 이동 이벤트
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isLoupeMode || !imgRef.current) return;
    updateLoupePosition(e.clientX, e.clientY);
  };

  // 📱 [모바일] 터치 이동 이벤트
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isLoupeMode || !imgRef.current) return;
    const touch = e.touches[0]; // 첫 번째 터치 지점의 좌표를 가져옴
    updateLoupePosition(touch.clientX, touch.clientY);
  };

  // 📱 [모바일] 터치 시작 이벤트 (터치하는 순간 돋보기 표시)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isLoupeMode || !imgRef.current) return;
    const touch = e.touches[0];
    updateLoupePosition(touch.clientX, touch.clientY);
  };

  // 공통 돋보기 위치 계산 로직
  const updateLoupePosition = (clientX: number, clientY: number) => {
    if (!imgRef.current) return;

    const { left, top, width, height } = imgRef.current.getBoundingClientRect();
    
    const x = clientX - left;
    const y = clientY - top;

    const bgW = width * ZOOM_LEVEL;
    const bgH = height * ZOOM_LEVEL;

    const bgX = -((x * ZOOM_LEVEL) - LOUPE_SIZE / 2);
    const bgY = -((y * ZOOM_LEVEL) - LOUPE_SIZE / 2);

    setLoupe({ show: true, x, y, bgX, bgY, bgW, bgH });
  };

  const closeModal = () => {
    setSelectedImage(null);
    setIsLoupeMode(false);
    setLoupe((prev) => ({ ...prev, show: false }));
  };

  if (isLoading) {
    return <div className="py-20 text-center text-slate-500">인증서 정보를 불러오는 중입니다...</div>;
  }

  if (!certs || certs.length === 0) {
    return <div className="py-20 text-center text-slate-500">등록된 인증·인허가 정보가 없습니다.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* 1. 인증서 목록 (리스트) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12">
        {certs.map((cert: any) => (
          <div key={cert.id} className="flex flex-col items-center group">
            <div 
              className="relative w-full aspect-[3/4] bg-white border border-slate-200 p-2 shadow-sm cursor-pointer overflow-hidden transition-transform duration-300 group-hover:-translate-y-2"
              onClick={() => setSelectedImage(cert.imageUrl)}
            >
              <img 
                src={cert.imageUrl} 
                alt={cert.title} 
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="w-[105%] h-3 bg-gradient-to-b from-slate-200 to-slate-300 shadow-md rounded-b-md mb-6"></div>
            <h3 className="text-lg font-bold text-slate-800 text-center">
              {cert.title}
            </h3>
          </div>
        ))}
      </div>

      {/* 2. 이미지 확대 및 돋보기(Loupe) 모달 */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          {/* 우측 상단 버튼 영역 */}
          <div className="absolute top-6 right-6 flex flex-col gap-4">
            <button 
              onClick={(e) => { e.stopPropagation(); closeModal(); }}
              className="text-white/60 hover:text-white transition-colors"
              title="닫기"
            >
              <X size={40} />
            </button>
            
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setIsLoupeMode(!isLoupeMode); 
              }}
              className={`p-2.5 rounded-lg border-2 transition-all duration-200 flex items-center justify-center shadow-lg ${
                isLoupeMode 
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-400 scale-110' 
                  : 'border-white/40 text-white/60 hover:text-white hover:border-white'
              }`}
              title="돋보기 모드 켜기/끄기"
            >
              <Search size={28} />
            </button>
          </div>
          
          {/* 이미지 표시 영역 */}
          <div 
            className="relative bg-white p-4 rounded shadow-2xl inline-block"
            onClick={(e) => e.stopPropagation()} 
          >
            <div
              className={`relative overflow-hidden ${isLoupeMode ? 'cursor-none' : 'cursor-default'}`}
              // 💡 핵심: 돋보기 모드일 때 모바일에서 터치 드래그 시 화면이 스크롤되는 것을 방지
              style={{ touchAction: isLoupeMode ? 'none' : 'auto' }} 
              
              // PC 마우스 이벤트
              onMouseMove={handleMouseMove}
              onMouseEnter={() => isLoupeMode && setLoupe(prev => ({ ...prev, show: true }))}
              onMouseLeave={() => setLoupe(prev => ({ ...prev, show: false }))}
              
              // 모바일 터치 이벤트 추가
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => setLoupe(prev => ({ ...prev, show: false }))}
              onTouchCancel={() => setLoupe(prev => ({ ...prev, show: false }))}
            >
              <img 
                ref={imgRef}
                src={selectedImage} 
                alt="확대된 인증서" 
                className="max-h-[85vh] w-auto object-contain block pointer-events-none" 
              />
              
              {/* 💡 마우스를 따라다니는 동그라미 돋보기 (Loupe) */}
              {isLoupeMode && loupe.show && (
                <div 
                  className="absolute rounded-full border-[3px] border-white shadow-[0_0_15px_rgba(0,0,0,0.5)] pointer-events-none z-50 bg-white"
                  style={{
                    width: `${LOUPE_SIZE}px`,
                    height: `${LOUPE_SIZE}px`,
                    // 모바일에서는 손가락에 가려지지 않도록 돋보기를 살짝 위로 올리고 싶다면 top 좌표에서 값을 빼주셔도 됩니다.
                    left: `${loupe.x - LOUPE_SIZE / 2}px`,
                    top: `${loupe.y - LOUPE_SIZE / 2}px`, 
                    backgroundImage: `url(${selectedImage})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: `${loupe.bgW}px ${loupe.bgH}px`,
                    backgroundPosition: `${loupe.bgX}px ${loupe.bgY}px`,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}