import { Suspense } from "react";
import SeniorCenterListTable from "@/components/admin/SeniorCenterListTable"; 

export default function SeniorCenterListPage() {
  return (
      <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-gray-500 font-medium">관리자 화면 로딩 중...</p>
      </div>
    }>
      <SeniorCenterListTable />
    </Suspense>
   
  );
}