// src/components/main/TabMenu.tsx

import Link from "next/link";

interface TabMenuProps {
  allMenus: any[];
  currentMenuId?: number | null;
}

export default function TabMenu({ allMenus, currentMenuId }: TabMenuProps) {
  if (!currentMenuId || !allMenus || allMenus.length === 0) return null;

  const currentMenu = allMenus.find((m: any) => m.id === currentMenuId);
  if (!currentMenu) return null;

  const parentMenuId = currentMenu.depth === 1 ? currentMenu.id : currentMenu.parentId;

  const tabMenus = allMenus
    .filter((m: any) => m.parentId === parentMenuId && m.depth === 2)
    .sort((a: any, b: any) => a.order - b.order);

  if (tabMenus.length === 0) return null;

  // 💡 현재 접속한 메뉴가 1뎁스 메뉴인지 확인
  const isParentMenu = currentMenu.depth === 1;

  return (
    <div className="w-full bg-white border-b border-slate-200 mt-6 pb-2">
      <div className="max-w-6xl mx-auto px-4 flex flex-wrap gap-2 justify-center">
        {tabMenus.map((tab, index) => {
          // 💡 핵심 로직: 
          // 1. 현재 탭의 id와 페이지의 메뉴 id가 일치하거나
          // 2. 1뎁스 메뉴로 직접 들어온 상태이면서 첫 번째 탭(index === 0)일 경우 활성화
          const isActive = tab.id === currentMenuId || (isParentMenu && index === 0);
          
          return (
            <a
              key={tab.id}
              href={tab.url || '#'}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.name}
            </a>
          );
        })}
      </div>
    </div>
  );
}