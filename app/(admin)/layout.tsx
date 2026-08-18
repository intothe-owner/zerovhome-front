// src/app/(admin)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Settings, Users, UserCheck, Menu as MenuIcon, 
  FileText, MessageSquare, LogOut, UserCircle, Megaphone,
  BarChart2, Briefcase, ChevronDown, ChevronRight,
  ClipboardList, Sparkles, Home, UserPlus // 💡 새로 추가된 아이콘
} from "lucide-react";

// 💡 새로운 '신청 내역' 메뉴 그룹 추가
const MENU_GROUPS = [
  {
    id: "settings",
    title: "환경 설정",
    items: [
      { name: "사이트 설정", href: "/admin/settings", icon: Settings },
      { name: "회원 설정", href: "/admin/members/settings", icon: Users },
    ]
  },
  {
    id: "applications",
    title: "신청 내역",
    items: [
      { name: "설문조사 설정", href: "/admin/clean/survey", icon: ClipboardList },
      { name: "클린UP 관리", href: "/admin/clean/cleanup", icon: Sparkles },
      { name: "경로당 관리", href: "/admin/clean/senior", icon: Home },
      { name: "일반고객 관리", href: "/admin/clean/customers", icon: UserPlus },
    ]
  },
  {
    id: "contents",
    title: "컨텐츠 관리",
    items: [
      { name: "회원 관리", href: "/admin/member", icon: UserCheck },
      { name: "메뉴 관리", href: "/admin/menus", icon: MenuIcon },
      { name: "페이지 관리", href: "/admin/pages", icon: FileText },
      { name: "게시판 관리", href: "/admin/boards", icon: MessageSquare },
      { name: "팝업 관리", href: "/admin/popup", icon: Megaphone },
    ]
  },
  {
    id: "statistics",
    title: "통계 및 부가기능",
    items: [
      { name: "방문자 통계", href: "/admin/statistics", icon: BarChart2 },
      { name: "사업지원금", href: "/admin/support", icon: Briefcase },
    ]
  }
];

export default function AdminLayoutUI({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); 
  
  // 💡 UI 확인용 가짜 관리자 정보 (권한 체크 로직 제거)
  const adminInfo = { name: "최고관리자", level: 10 };
  
  // 열려있는 아코디언 그룹 상태 (id를 key로 boolean 값 저장)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // 페이지 이동 시, 현재 경로가 포함된 아코디언 메뉴를 자동으로 열어줌
  useEffect(() => {
    const activeGroup = MENU_GROUPS.find(group => 
      group.items.some(item => pathname === item.href || pathname.startsWith(`${item.href}/`))
    );
    if (activeGroup) {
      setOpenGroups(prev => ({ ...prev, [activeGroup.id]: true }));
    }
  }, [pathname]);

  const handleLogout = () => {
    alert("로그아웃 버튼 클릭 (UI 테스트)");
  };

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getLevelName = (level: number) => level === 10 ? "최고관리자" : "관리자";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      
      {/* 💡 사이드바 영역 */}
      <aside className="w-64 bg-slate-900 flex flex-col h-full flex-shrink-0 shadow-2xl z-20">
        <div className="h-16 flex items-center justify-center bg-slate-950 border-b border-slate-800 shadow-sm flex-shrink-0">
          <Link href="/admin/dashboard" className="text-xl font-black text-white tracking-widest hover:text-indigo-400 transition-colors">
            CMS ADMIN
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar-dark">
          {MENU_GROUPS.map((group, index) => {
            const isOpen = openGroups[group.id];
            
            return (
              <div key={group.id} className={index !== 0 ? "mt-6" : ""}>
                {/* 아코디언 헤더 */}
                <button 
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center justify-between px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
                >
                  <span>{group.title}</span>
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {/* 아코디언 내용 */}
                <div className={`space-y-1 overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                  {group.items.map((item) => {
                    // 현재 페이지와 메뉴의 href가 일치하는지 확인 (서브페이지 포함)
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    
                    return (
                      <Link 
                        key={item.href} 
                        href={item.href} 
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                          isActive 
                            ? "bg-indigo-600 text-white shadow-md font-bold" 
                            : "text-slate-300 hover:bg-slate-800 hover:text-white font-medium"
                        }`}
                      >
                        <item.icon size={18} className={isActive ? "text-white" : "text-slate-400"} />
                        <span className="text-sm">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* 💡 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* 상단 헤더 */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm flex-shrink-0 z-10">
          <div className="text-slate-500 font-bold text-sm tracking-wide">
            관리자 대시보드
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
              <UserCircle size={20} className="text-indigo-600" />
              <span className="text-sm font-extrabold text-slate-700">
                {adminInfo.name} <span className="text-slate-400 font-medium ml-1">({getLevelName(adminInfo.level)})</span>
              </span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-red-500 transition-colors"
            >
              <LogOut size={16} /> 로그아웃
            </button>
          </div>
        </header>

        {/* 렌더링 영역 (Children) */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>

      {/* 다크 테마 사이드바 전용 커스텀 스크롤바 스타일 */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar-dark::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-track {
          background: transparent; 
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb {
          background: #334155; 
          border-radius: 4px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
          background: #475569; 
        }
      `}} />
    </div>
  );
}