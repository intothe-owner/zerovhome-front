// src/app/(main)/layout.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import ClientLayoutWrapper from "./ClientLayoutWrapper";
import { ThemeProvider } from "@/components/ThemeProvider"; // 경로에 맞게 수정
import TokenChecker from "@/components/TokenChecker"; // 💡 추가: 방금 만든 TokenChecker 임포트

export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/settings`, { cache: "no-store" });
    const json = await res.json();
    if (json.success && json.data) {
      return {
        title: json.data.siteName,
        description: json.data.metaDescription,
        keywords: json.data.metaKeywords,
        icons: { icon: json.data.faviconUrl || "/favicon.ico" },
      };
    }
  } catch (e) {}
  return { title: "기본 사이트명" };
}

export const dynamic = 'force-dynamic';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  
  // 1. 최고관리자 존재 여부 확인
  let hasAdmin = false;
  try {
    const adminCheckRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/check-admin`, { 
      cache: "no-store" 
    });
    const adminCheckJson = await adminCheckRes.json();
    if (adminCheckJson.success) {
      hasAdmin = adminCheckJson.hasAdmin;
    }
  } catch (error) {
    console.error("관리자 확인 통신 실패:", error);
  }

  // 2. 관리자가 없으면 /setup 으로 강제 이동
  if (!hasAdmin) {
    redirect("/setup");
  }

  // 3. 이후 기존 데이터 페칭 로직 정상 실행
  let settings = null;
  let flatMenus = [];
  let memberSettings = null;

  try {
    const [settingsRes, menusRes, memberSettingsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/settings`, { cache: "no-store" }),
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/menus`, { cache: "no-store" }),
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/member-settings`, { cache: "no-store" }),
    ]);

    if (settingsRes.ok) {
      const settingsJson = await settingsRes.json();
      settings = settingsJson.success ? settingsJson.data : null;
    }

    if (menusRes.ok) {
      const menusJson = await menusRes.json();
      flatMenus = menusJson.success ? menusJson.data : [];
    }

    if (memberSettingsRes.ok) {
      const memberSettingsJson = await memberSettingsRes.json();
      memberSettings = memberSettingsJson.success ? memberSettingsJson.data : null;
    }

  } catch (error) {
    console.error("메인 레이아웃 데이터 페칭 완전 실패:", error);
  }

  const buildMenuTree = (flat: any[]) => {
    const map: Record<number, any> = {};
    const roots: any[] = [];
    flat.forEach(m => { map[m.id] = { ...m, children: [] }; });
    flat.forEach(m => {
      if (m.parentId && map[m.parentId]) map[m.parentId].children.push(map[m.id]);
      else roots.push(map[m.id]);
    });
    return roots;
  };

  return (
    <ThemeProvider
          attribute="class" // (권장) TailwindCSS의 dark 클래스와 연동하기 위함
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
      {/* 💡 매 페이지 접근마다 토큰 만료를 감시하는 컴포넌트 추가 */}
      <TokenChecker /> 
      
      <ClientLayoutWrapper settings={settings} menus={buildMenuTree(flatMenus)} memberSettings={memberSettings} hasSlider={false}>
        {children}
      </ClientLayoutWrapper>
    </ThemeProvider>
  );
}