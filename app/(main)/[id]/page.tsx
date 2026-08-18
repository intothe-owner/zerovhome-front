"use client"; // 💡 클라이언트 컴포넌트 선언

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import BlockRenderer from "@/components/main/BlockRenderer";
import MainSlider from "@/components/main/MainSlider";
import TabMenu from "@/components/main/TabMenu";

// 💡 API 통신 함수들을 밖으로 분리
const fetchSubPageData = async (id: string) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pages/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error("페이지 데이터 로딩 실패");
  return json.data;
};

const fetchMenus = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/menus`);
  const json = await res.json();
  return json.success ? json.data : [];
};

export default function SubPage() {
  const { id } = useParams<{ id: string }>(); // 💡 클라이언트에서는 useParams 사용

  // 1. 페이지 데이터 쿼리
  const { data: pageData, isLoading: isPageLoading } = useQuery({
    queryKey: ['subPage', id],
    queryFn: () => fetchSubPageData(id),
    enabled: !!id, // id가 있을 때만 실행
  });

  // 2. 메뉴 데이터 쿼리
  const { data: allMenus = [] } = useQuery({
    queryKey: ['allMenus'],
    queryFn: fetchMenus,
  });

  // 로딩 UI
  if (isPageLoading) {
    return <div className="flex h-[70vh] items-center justify-center">로딩 중...</div>;
  }

  // 데이터가 없을 때 UI
  if (!pageData) {
    return (
      <div className="flex h-[70vh] items-center justify-center pt-16">
        <h1 className="text-2xl font-bold text-slate-500">해당 페이지를 찾을 수 없습니다.</h1>
      </div>
    );
  }

  const hasSlider = pageData.sliderData && 
                    pageData.sliderData.length > 0 && 
                    pageData.sliderData.some((slide: any) => slide.mediaUrl && slide.mediaUrl.trim() !== "");
                    
  const meta = pageData.pageMeta || {};

  return (
    <div className={`w-full flex flex-col ${hasSlider || meta.bgImage ? '' : 'pt-24'}`}>
      {/* 1. 슬라이드 */}
      {hasSlider && <MainSlider slides={pageData.sliderData} />}
      
      {/* 2. 배경이미지 헤더 */}
      {!hasSlider && meta.bgImage && (
        <div className="relative w-full h-[400px] flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url(${meta.bgImage})` }}>
          <div className="absolute inset-0 bg-black/40"></div>
          <h1 className="relative z-10 text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg">
            {meta.bgTitle || pageData.title}
          </h1>
        </div>
      )}

      {/* 3. 기본 텍스트 */}
      {!hasSlider && !meta.bgImage && (
        <div className="max-w-6xl mx-auto px-4 w-full mt-8 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900">{pageData.title}</h1>
        </div>
      )}

      {/* 4. 탭 메뉴 */}
      <TabMenu allMenus={allMenus} currentMenuId={pageData.menuId} />

      {/* 본문 */}
      {pageData.contentBlocks && pageData.contentBlocks.length > 0 && (
        <div className="mt-8">
          <BlockRenderer blocks={pageData.contentBlocks} />
        </div>
      )}
    </div>
  );
}