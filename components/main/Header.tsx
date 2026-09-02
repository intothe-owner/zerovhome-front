// src/app/components/main/Header.tsx
"use client";

import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, UserCircle, Sun, Moon } from "lucide-react";
import { useTheme } from "@teispace/next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
interface MenuType {
  id: number;
  name: string;
  url: string;
  children?: MenuType[];
}

interface HeaderProps {
  menus: MenuType[];
  logoUrl?: string;
  siteName: string;
  hasSlider?: boolean;
  memberSettings?: any;
  themeMode?: string;
}

export default function Header({ menus, logoUrl, siteName, hasSlider = true, memberSettings, themeMode }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    setMounted(true);

    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      setIsLoggedIn(true);
      try {
        setUserData(JSON.parse(userStr));
      } catch (e) { }
    }

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      setIsLoggedIn(true);
      try {
        setUserData(JSON.parse(userStr));
      } catch (e) { }
    } else {
      // 💡 링크 이동 시 토큰이 없다면 로그아웃 상태로 갱신!
      setIsLoggedIn(false);
      setUserData(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUserData(null);
    alert("로그아웃 되었습니다.");
    window.location.href = "/";
  };

  const isSolid = !hasSlider || isScrolled || isMobileMenuOpen;

  const headerClasses = `fixed top-0 z-50 w-full transition-all duration-300 ${isSolid
    ? "bg-white/90 backdrop-blur-md border-b border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 shadow-sm"
    : "bg-transparent border-transparent"
    }`;

  const textClasses = isSolid
    ? "text-slate-800 dark:text-slate-200 hover:text-indigo-600"
    : "text-white hover:text-indigo-300 drop-shadow-md";

  const authMode = memberSettings?.memberSystemMode || "ALL";

  return (
    <header className={headerClasses}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 w-full">

        <div className="w-auto md:w-1/4 flex items-center">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="w-[200px] h-auto max-h-12 object-contain" />
            ) : (
              <span className={`text-xl font-extrabold transition-colors whitespace-nowrap ${isSolid ? "text-slate-900 dark:text-white" : "text-white drop-shadow-md"}`}>
                {siteName}
              </span>
            )}
          </Link>
        </div>

        <nav className="hidden md:flex flex-1 justify-center items-center gap-4 lg:gap-8">
          {menus.map((menu) => (
            <div
              key={menu.id}
              className="relative group"
              onMouseEnter={() => setOpenDropdownId(menu.id)}
              onMouseLeave={() => setOpenDropdownId(null)}
            >
              <Link
                href={menu.url || "#"}
                className={`flex items-center gap-1 text-[15px] font-bold py-5 transition-colors whitespace-nowrap ${textClasses}`}
              >
                {menu.name}
                {menu.children && menu.children.length > 0 && (
                  <ChevronDown size={14} className="opacity-70 group-hover:rotate-180 transition-transform" />
                )}
              </Link>

              {menu.children && menu.children.length > 0 && openDropdownId === menu.id && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 min-w-[160px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-2 animate-in fade-in slide-in-from-top-2">
                  {menu.children.map((child) => (
                    <Link
                      key={child.id}
                      href={child.url || "#"}
                      className="block px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition-colors whitespace-nowrap"
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="w-auto md:w-1/4 flex justify-end items-center gap-2 sm:gap-4">

          {themeMode === "MENUAL" && (
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className={`p-2 rounded-full transition-colors ${isSolid ? "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" : "text-white hover:bg-black/20"}`}
              aria-label="테마 변경"
            >
              {mounted ? (
                resolvedTheme === "dark" ? <Sun size={20} /> : <Moon size={20} />
              ) : (
                <div className="w-5 h-5" />
              )}
            </button>
          )}
 
          <div className="hidden md:flex items-center gap-5 ml-2">
            
            {/* 💡 추가된 부분: 고객지원 메뉴 (제휴문의 왼쪽) */}
            {/* <Link href="/support" className={`text-[13px] font-extrabold transition-colors whitespace-nowrap ${textClasses}`}>
              고객지원
            </Link>

            <Link href="/contact" className={`text-[13px] font-extrabold transition-colors whitespace-nowrap ${textClasses}`}>
              제휴문의
            </Link> */}

            {isLoggedIn ? (
              <div
                className="relative group py-5"
                onMouseEnter={() => setIsUserMenuOpen(true)}
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <div className={`flex items-center gap-1.5 text-[13px] font-extrabold cursor-pointer transition-colors whitespace-nowrap ${textClasses}`}>
                  <UserCircle size={18} />
                  <span>{userData?.name}님</span>
                  <ChevronDown size={14} className="opacity-70 group-hover:rotate-180 transition-transform" />
                </div>

                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 min-w-[140px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-2 animate-in fade-in slide-in-from-top-2">
                    {userData?.level >= 9 && (
                      <Link
                        href="/admin/dashboard"
                        className="block px-4 py-2.5 text-sm font-bold text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
                      >
                        관리자
                      </Link>
                    )}
                    <Link
                      href="/mypage"
                      className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition-colors whitespace-nowrap"
                    >
                      마이페이지
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {authMode !== "NONE" && (
                  <Link href="/login" className={`text-[13px] font-extrabold transition-colors whitespace-nowrap ${textClasses}`}>
                    로그인
                  </Link>
                )}
                {authMode === "ALL" && (
                  <Link href="/register" className="text-[13px] font-extrabold px-5 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap">
                    회원가입
                  </Link>
                )}
              </>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 md:hidden rounded-lg transition-colors ${isSolid ? "text-slate-600 dark:text-slate-300 hover:bg-slate-100" : "text-white hover:bg-black/20"}`}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto flex flex-col">
          <nav className="flex flex-col py-2">
            {menus.map((menu) => (
              <div key={menu.id} className="border-b border-slate-100 dark:border-slate-800 last:border-none">
                <div className="flex items-center justify-between px-6 py-4">
                  <Link
                    href={menu.url || "#"}
                    className="text-base font-bold text-slate-800 dark:text-slate-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {menu.name}
                  </Link>
                  {menu.children && menu.children.length > 0 && (
                    <button
                      onClick={() => setOpenDropdownId(openDropdownId === menu.id ? null : menu.id)}
                      className="p-2 text-slate-400"
                    >
                      <ChevronDown size={20} className={`transition-transform ${openDropdownId === menu.id ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>

                {menu.children && menu.children.length > 0 && openDropdownId === menu.id && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 flex flex-col gap-3">
                    {menu.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.url || "#"}
                        className="text-sm font-medium text-slate-600 dark:text-slate-400 pl-4 border-l-2 border-indigo-200 dark:border-indigo-900"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {isLoggedIn ? (
            <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3 bg-slate-50 dark:bg-slate-800/30 mt-auto">
              <div className="flex items-center gap-2 mb-2 px-2">
                <UserCircle size={24} className="text-indigo-600" />
                <span className="font-bold text-slate-800 dark:text-white text-lg">{userData?.name}님</span>
              </div>
              
              {/* 💡 모바일용 고객지원 버튼 추가 */}
              <Link
                href="/support"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 text-center text-sm font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition"
              >
                고객지원
              </Link>

              <Link
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 text-center text-sm font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition"
              >
                제휴문의
              </Link>

              {userData?.level >= 9 && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 text-center text-sm font-extrabold text-white bg-emerald-500 rounded-xl shadow-sm hover:bg-emerald-600 transition"
                >
                  관리자 페이지
                </Link>
              )}

              <Link
                href="/mypage"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 text-center text-sm font-extrabold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition"
              >
                정보수정
              </Link>
              <button
                onClick={handleLogout}
                className="w-full py-3 text-center text-sm font-extrabold text-white bg-slate-800 rounded-xl shadow-sm hover:bg-slate-900 transition"
              >
                로그아웃
              </button>
            </div>
          ) : (
            authMode !== "NONE" && (
              <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3 bg-slate-50 dark:bg-slate-800/30 mt-auto">
                
                {/* 💡 모바일용 고객지원 버튼 추가 */}
                <Link
                  href="/support"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 text-center text-sm font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition"
                >
                  고객지원
                </Link>

                <Link
                  href="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 text-center text-sm font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition"
                >
                  제휴문의
                </Link>

                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 text-center text-sm font-extrabold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition"
                >
                  로그인
                </Link>
                {authMode === "ALL" && (
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-3 text-center text-sm font-extrabold text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-700 transition"
                  >
                    회원가입
                  </Link>
                )}
              </div>
            )
          )}
        </div>
      )}
    </header>
  );
}