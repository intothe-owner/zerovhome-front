// app/admin/page.tsx
import AdminDashboardTemplate from "@/components/admin/AdminDashboardTemplate"; 
import { Suspense } from "react";

export default function AdminPage() {
  return (
    // ✅ 빌드 시 searchParams를 안전하게 처리하기 위해 여기서 감싸줍니다.
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-gray-500 font-medium">관리자 화면 로딩 중...</p>
      </div>
    }>
      <AdminDashboardTemplate />
    </Suspense>
  );
}