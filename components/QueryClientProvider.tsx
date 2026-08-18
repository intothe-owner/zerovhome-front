// src/components/QueryProvider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // 💡 useState를 사용해 클라이언트(브라우저)에서 단 한 번만 QueryClient 인스턴스를 생성하게 합니다.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 원하신다면 기본 옵션을 설정할 수 있습니다. (예: 창을 벗어났다가 돌아와도 새로고침 안 함)
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}