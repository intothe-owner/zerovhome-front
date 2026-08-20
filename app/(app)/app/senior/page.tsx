'use client';
import SeniorCenterList from "@/components/app/SeniorCenterList";
import { Suspense } from "react";

// 3. 최종 Export 시 Suspense로 감싸기
const MobileSeniorPage = () => {
  return (
    <Suspense fallback={<div className="p-10 text-center">로딩 중...</div>}>
      <SeniorCenterList/>
    </Suspense>
  );
};

export default MobileSeniorPage;