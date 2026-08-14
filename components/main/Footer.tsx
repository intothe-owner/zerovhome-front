"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, X } from "lucide-react"; // 💡 자물쇠 및 닫기 아이콘 임포트

interface FooterProps {
  companyName?: string;
  address?: string;
  contactNumber?: string;
  memberSettings?: any; // 💡 회원 설정 Props
}

export default function Footer({ companyName, address, contactNumber, memberSettings }: FooterProps) {
  const currentYear = new Date().getFullYear();
  
  // 현재 운영 모드 확인
  const authMode = memberSettings?.memberSystemMode || "ALL";

  // 💡 [신규 추가] 모달 상태 관리
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; content: string }>({
    isOpen: false,
    title: "",
    content: ""
  });

  // 💡 [신규 추가] 모달 열기 함수
  const openModal = (e: React.MouseEvent, type: 'terms' | 'privacy') => {
    e.preventDefault();
    if (type === 'terms') {
      setModalConfig({
        isOpen: true,
        title: "이용약관",
        content: memberSettings?.termsContent || "이용약관 내용이 등록되지 않았습니다."
      });
    } else {
      setModalConfig({
        isOpen: true,
        title: "개인정보처리방침",
        content: memberSettings?.privacyContent || "개인정보처리방침 내용이 등록되지 않았습니다."
      });
    }
  };

  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });

  return (
    <>
      <footer className="w-full bg-slate-50 border-t border-slate-200 dark:bg-slate-950 dark:border-slate-800 transition-colors mt-auto">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12 flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
          
          {/* 회사 정보 영역 */}
          <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
            {companyName && (
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {companyName}
              </h3>
            )}
            
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 space-y-1">
              {address && <p>주소 : {address}</p>}
              {contactNumber && <p>고객센터 : {contactNumber}</p>}
            </div>
          </div>

          {/* 카피라이트 및 부가 링크 영역 */}
          <div className="flex flex-col items-center md:items-end gap-3">
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
              {/* 💡 a 태그 대신 button 형태로 변경하여 모달 오픈 연결 */}
              <button 
                onClick={(e) => openModal(e, 'terms')} 
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                이용약관
              </button>
              <span className="w-px h-3 bg-slate-300 dark:bg-slate-700"></span>
              <button 
                onClick={(e) => openModal(e, 'privacy')} 
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                개인정보처리방침
              </button>
            </div>

            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                © {currentYear} {companyName || "Company"}. All rights reserved.
              </p>
            
              {/* 폐쇄형(NONE) 모드일 때만 노출되는 관리자/회원 전용 자물쇠 링크 */}
              {authMode === "NONE" && (
                <Link 
                  href="/login" 
                  title="로그인 페이지로 이동 (폐쇄형 운영 중)" 
                  className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1"
                >
                  <Lock size={14} />
                </Link>
              )}
            </div>
          </div>

        </div>
      </footer>

      {/* 💡 [신규 추가] 약관 및 정책 모달 UI */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {modalConfig.title}
              </h2>
              <button 
                onClick={closeModal} 
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* 모달 컨텐츠 (스크롤) */}
            <div className="p-6 overflow-y-auto">
              <div 
                className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-slate-600 dark:text-slate-300"
                dangerouslySetInnerHTML={{ __html: modalConfig.content }}
              />
            </div>

            {/* 모달 푸터 (닫기 버튼) */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl flex justify-end">
              <button 
                onClick={closeModal}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}