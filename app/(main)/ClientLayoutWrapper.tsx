// src/app/(main)/ClientLayoutWrapper.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes"; // 💡 next-themes 추가
import Header from "@/components/main/Header";
import Footer from "@/components/main/Footer";
import PopupRenderer from "@/components/main/PopupRenderer";

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
  settings: any;
  menus: any[];
  memberSettings: any;
  hasSlider?: boolean; 
}

export default function ClientLayoutWrapper({ 
  children, 
  settings, 
  menus,
  memberSettings,
  hasSlider: initialHasSlider = false
}: ClientLayoutWrapperProps) {
  const [hasSlider, setHasSlider] = useState<boolean>(initialHasSlider);
  const pathname = usePathname();
  
  // 💡 next-themes 훅 사용
  const { setTheme } = useTheme();

  // 1. 방문자 통계 추적 API 호출
  useEffect(() => {
    const trackVisitor = async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/visitors/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pageUrl: pathname }),
        });
      } catch (error) {
        console.error('방문자 통계 기록 실패:', error);
      }
    };

    if (pathname) {
      trackVisitor();
    }
  }, [pathname]);

  // 2. 페이지(URL) 이동 시 실시간으로 슬라이드 데이터 존재 여부 검사
  useEffect(() => {
    const checkSliderData = async () => {
      try {
        const targetId = pathname === "/" ? "0" : pathname.substring(1);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pages/${targetId}`);
        const json = await res.json();

        if (json.success && json.data?.sliderData && json.data.sliderData.length > 0) {
          setHasSlider(true);
        } else {
          setHasSlider(false);
        }
      } catch (error) {
        setHasSlider(false);
      }
    };

    checkSliderData();
  }, [pathname]);

  // 3. 테마(다크모드) 제어 - 💡 next-themes 방식으로 통합
  useEffect(() => {
    if (!settings) return;

    const applyTheme = () => {
      if (settings.themeMode === "DARK") {
        setTheme("dark");
      } else if (settings.themeMode === "LIGHT") {
        setTheme("light");
      } else if (settings.themeMode === "AUTO_TIME") {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        const [startH, startM] = (settings.nightModeStartTime || "18:00").split(":").map(Number);
        const [endH, endM] = (settings.nightModeEndTime || "06:00").split(":").map(Number);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;

        let shouldBeDark = false;
        if (startTotal > endTotal) {
          shouldBeDark = currentMinutes >= startTotal || currentMinutes <= endTotal;
        } else {
          shouldBeDark = currentMinutes >= startTotal && currentMinutes <= endTotal;
        }
        
        setTheme(shouldBeDark ? "dark" : "light");
      }
      // 💡 "MENUAL" 모드일 때는 next-themes가 로컬 스토리지를 기반으로 알아서 기억하고 유지하므로 별도로 개입하지 않습니다.
    };

    // 마운트 시 즉시 테마 적용
    applyTheme();

    // AUTO_TIME 모드일 경우 1분(60초)마다 시간이 지났는지 체크하여 테마 변경
    let intervalId: NodeJS.Timeout;
    if (settings.themeMode === "AUTO_TIME") {
      intervalId = setInterval(applyTheme, 60000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [settings, setTheme]);

  if (!settings) return null;

  // 4. 레이아웃 Display 모드 설정
  let displayClass = "w-full transition-colors duration-300 min-h-screen flex flex-col mx-auto ";
  
  switch (settings.displayMode) {
    case "MOBILE_ONLY":
      displayClass += "max-w-md shadow-2xl bg-white dark:bg-slate-900 border-x border-slate-200 dark:border-slate-800";
      break;
    case "PC_ONLY":
      displayClass += "min-w-[1024px] bg-white dark:bg-slate-900";
      break;
    case "ADAPTIVE":
    case "RESPONSIVE":
    default:
      displayClass += "bg-white dark:bg-slate-900";
      break;
  }

  const wrapperClass = settings.displayMode === "MOBILE_ONLY" 
    ? "min-h-screen bg-slate-100 dark:bg-black" 
    : "min-h-screen";

  return (
    <div className={wrapperClass}>
      <PopupRenderer/>
      <div className={displayClass}>
        <Header 
          menus={menus} 
          logoUrl={settings.logoUrl} 
          siteName={settings.siteName} 
          hasSlider={hasSlider} 
          memberSettings={memberSettings} 
          themeMode={settings.themeMode}
        />
        
        <main className="flex-1 w-full relative">
          {children}
        </main>
        
        <Footer 
          companyName={settings.companyName} 
          address={settings.address} 
          contactNumber={settings.contactNumber} 
          memberSettings={memberSettings}
        />
      </div>
    </div>
  );
}