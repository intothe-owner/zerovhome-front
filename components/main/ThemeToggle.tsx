"use client";

import { useTheme } from "@teispace/next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Hydration 에러를 방지하기 위해 마운트된 후에만 렌더링합니다.
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 border rounded-md"
    >
      {theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
    </button>
  );
}