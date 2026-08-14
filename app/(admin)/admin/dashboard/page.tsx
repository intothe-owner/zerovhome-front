"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, FileText, MessageSquare, Settings, 
  Activity, ArrowRight, LayoutTemplate, ShieldCheck 
} from "lucide-react";

export default function AdminDashboard() {
  const [adminName, setAdminName] = useState("관리자");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setAdminName(user.name);
      } catch (e) {}
    }
  }, []);

  // 대시보드 통계 목업 데이터
  const stats = [
    { title: "총 회원 수", value: "1,248", desc: "전월 대비 +12%", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "생성된 페이지", value: "24", desc: "최근 7일간 +3", icon: LayoutTemplate, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "신규 게시글", value: "156", desc: "어제 대비 +8%", icon: MessageSquare, color: "text-amber-600", bg: "bg-amber-100" },
    { title: "일일 방문자", value: "892", desc: "전일 대비 +24%", icon: Activity, color: "text-indigo-600", bg: "bg-indigo-100" },
  ];

  // 빠른 실행 링크
  const quickLinks = [
    { title: "사이트 설정", desc: "기본 정보 및 테마 변경", href: "/admin/settings", icon: Settings },
    { title: "회원 관리", desc: "가입자 목록 및 권한 설정", href: "/admin/member", icon: ShieldCheck },
    { title: "페이지 빌더", desc: "신규 페이지 생성 및 수정", href: "/admin/pages", icon: FileText },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* 1. 환영 메시지 배너 */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2 tracking-tight">환영합니다, {adminName}님! 👋</h1>
          <p className="text-indigo-200 font-medium leading-relaxed">
            오늘도 CMS 시스템이 안정적으로 운영되고 있습니다.<br className="hidden sm:block" /> 
            우측의 바로가기나 좌측 메뉴를 통해 관리를 시작해 보세요.
          </p>
        </div>
        <div className="relative z-10 flex gap-3 w-full md:w-auto">
          <Link href="/" target="_blank" className="flex-1 md:flex-none text-center px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold transition-colors">
            내 사이트 보기
          </Link>
          <Link href="/admin/pages" className="flex-1 md:flex-none text-center px-6 py-3 bg-indigo-500 hover:bg-indigo-400 rounded-xl font-bold shadow-lg transition-colors">
            새 페이지 작성
          </Link>
        </div>
        
        {/* 장식용 배경 효과 */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* 2. 요약 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <Icon size={24} className={stat.color} />
                </div>
              </div>
              <h3 className="text-slate-500 font-bold text-sm mb-1">{stat.title}</h3>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black text-slate-800">{stat.value}</span>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">
                  {stat.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. 빠른 실행 (Quick Links) 및 최근 활동 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* 빠른 실행 */}
        <div className="xl:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800">빠른 실행</h3>
          </div>
          <div className="p-3">
            {quickLinks.map((link, idx) => {
              const LinkIcon = link.icon;
              return (
                <Link 
                  key={idx} 
                  href={link.href}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                      <LinkIcon size={20} className="text-slate-500 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{link.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{link.desc}</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* 시스템 안내 영역 (공간 채우기 용도) */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center items-center p-12 text-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
            <Activity size={40} className="text-indigo-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">통계 및 최근 활동 데이터 연동 대기중</h2>
          <p className="text-slate-500 text-sm max-w-md leading-relaxed">
            차후 백엔드에서 방문자 통계, 최신 가입자 목록, 최근 작성된 게시글 등의 
            API를 추가하면 이곳에 대시보드 차트와 목록이 렌더링됩니다.
          </p>
        </div>

      </div>
    </div>
  );
}