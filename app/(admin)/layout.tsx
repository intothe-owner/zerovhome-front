// src/app/(admin)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Settings, Users, UserCheck, Menu as MenuIcon, 
  FileText, MessageSquare, LogOut, UserCircle, Megaphone,
  BarChart2, Briefcase, ChevronDown, ChevronRight,
  ClipboardList, Sparkles, Home, UserPlus, CalendarDays, FolderTree // 💡 캘린더 및 카테고리 아이콘 추가
} from "lucide-react";

// 💡 '신청 내역' 및 '서비스 관리' 메뉴 그룹 확장
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
    id: "service",
    title: "서비스 관리", // 💡 새로 추가된 그룹 (예약 및 카테고리)
    items: [
      { name: "예약/견적 관리", href: "/admin/service/reservations", icon: CalendarDays },
      { name: "카테고리 관리", href: "/admin/service/category", icon: FolderTree },
    ]
  },
  {
    id: "applications",
    title: "기존 신청 내역",
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
  const [isAuthorized, setIsAuthorized] = useState(false);
   const [adminInfo, setAdminInfo] = useState({ name: "", level: 0 });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      alert("관리자 페이지입니다. 먼저 로그인해 주세요.");
      window.location.href = "/login";
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.level < 9) {
        alert("관리자 페이지에 접근할 권한이 없습니다.");
        window.location.href = "/";
        return;
      }
      setAdminInfo({ name: user.name, level: user.level });
      setIsAuthorized(true);
    } catch (e) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  }, []);

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
    if (confirm("로그아웃 하시겠습니까?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
  };

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getLevelName = (level: number) => level === 10 ? "최고관리자" : "관리자";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      
      {/* 사이드바 영역 */}
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
                <button 
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center justify-between px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
                >
                  <span>{group.title}</span>
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                <div className={`space-y-1 overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                  {group.items.map((item) => {
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

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
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

        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>

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