// src/components/TokenChecker.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function TokenChecker() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // 1. 로컬 스토리지에서 토큰 가져오기 (저장 방식에 따라 키 이름 수정 필요)
    const token = localStorage.getItem("token"); 

    if (token) {
      try {
        // 2. JWT 토큰 구조(Header.Payload.Signature)에서 Payload 분리 및 디코딩
        const payloadBase64 = token.split(".")[1];
        // base64 디코딩 후 JSON 파싱
        const decodedJson = atob(payloadBase64);
        const payload = JSON.parse(decodedJson);

        // 3. 만료 시간 확인 (payload.exp는 초 단위이므로 밀리초를 초 단위로 변환해서 비교)
        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < currentTime) {
          // 토큰이 만료된 경우
          alert("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.");
          
          // 유저 정보 및 토큰 초기화
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          
          // 강제 새로고침 또는 로그인 페이지로 이동
          window.location.href = "/login"; // 경로에 맞게 수정하세요
        }
      } catch (error) {
        console.error("토큰 검증 중 오류 발생:", error);
      }
    }
  }, [pathname, router]); // pathname이 변경될 때마다(페이지 이동 시) 실행됨

  // UI를 렌더링하지 않는 백그라운드 컴포넌트입니다.
  return null; 
}