'use client';
import DashboardContent from "@/components/app/DashboardContent";
import { Suspense } from "react";

// 3. 최종 Export 시 Suspense로 감싸기
const MobileDashboardPage = () => {
  return (
    <Suspense fallback={<div className="p-10 text-center">로딩 중...</div>}>
      <DashboardContent />
    </Suspense>
  );
};

export default MobileDashboardPage;