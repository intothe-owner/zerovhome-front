// src/app/components/main/MainSlider.tsx
"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";

interface SlideItem {
  type: "image" | "video";
  mediaUrl: string;
  titleHtml: string;
  descHtml: string;
  titleStyle: {
    fontSize: number;
    color: string;
    fontFamily: string;
    textAlign: "left" | "center" | "right";
  };
  descStyle: {
    fontSize: number;
    color: string;
    fontFamily: string;
    textAlign: "left" | "center" | "right";
  };
}

interface MainSliderProps {
  slides: SlideItem[];
}

export default function MainSlider({ slides }: MainSliderProps) {
  if (!slides || slides.length === 0) return null;

  const isVideoMode = slides[0].type === "video";

  return (
    <div className="w-full h-screen group">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        loop={slides.length > 1}
        effect={isVideoMode ? "fade" : undefined}
        fadeEffect={isVideoMode ? { crossFade: true } : undefined}
        
        // 슬라이드가 넘어갈 때의 애니메이션(페이드) 속도는 부드럽게 1초 유지
        speed={1000} 
        
        autoplay={{
          // 💡 화면에 머무는 시간을 정확히 5초(5000ms)로 변경
          delay: 5000, 
          disableOnInteraction: false,
        }}
        pagination={{ clickable: true }}
        navigation={!isVideoMode ? {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        } : false}
        className="w-full h-full relative"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index} className="relative w-full h-full">
            
            {slide.type === "video" ? (
              slide.mediaUrl ? (
                <video
                  src={slide.mediaUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-slate-900" />
              )
            ) : (
              slide.mediaUrl ? (
                <img
                  src={slide.mediaUrl}
                  alt={`Slide ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600" />
              )
            )}
            
            <div className="absolute inset-0 bg-black/20" />
            
            <SlideContent slide={slide} />
          </SwiperSlide>
        ))}

        {!isVideoMode && (
          <>
            <div className="swiper-button-prev !text-white opacity-0 group-hover:opacity-100 transition-opacity after:!text-2xl drop-shadow-md hidden md:flex" />
            <div className="swiper-button-next !text-white opacity-0 group-hover:opacity-100 transition-opacity after:!text-2xl drop-shadow-md hidden md:flex" />
          </>
        )}
      </Swiper>
    </div>
  );
}

function SlideContent({ slide }: { slide: SlideItem }) {
  const getFontFamily = (fontFamily: string) => 
    fontFamily !== "default" ? fontFamily : "inherit";

  return (
    <div className="absolute inset-0 flex flex-col justify-center items-center max-w-6xl mx-auto px-6 md:px-12 z-10 pt-16 pointer-events-none">
      <div className="w-full flex flex-col items-center text-center gap-4 pointer-events-auto">
        
        <div
          style={{
            fontSize: `${slide.titleStyle.fontSize}px`,
            color: slide.titleStyle.color,
            fontFamily: getFontFamily(slide.titleStyle.fontFamily),
          }}
          className="drop-shadow-lg leading-tight w-full"
          dangerouslySetInnerHTML={{ __html: slide.titleHtml }}
        />
        
        <div
          style={{
            fontSize: `${slide.descStyle.fontSize}px`,
            color: slide.descStyle.color,
            fontFamily: getFontFamily(slide.descStyle.fontFamily),
          }}
          className="drop-shadow-md max-w-2xl leading-relaxed w-full"
          dangerouslySetInnerHTML={{ __html: slide.descHtml }}
        />
      </div>
    </div>
  );
}