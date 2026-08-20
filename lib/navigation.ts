declare global {
  interface Window {
    Android?: {
      openKakaoNavi?: (name: string, x: string, y: string) => void;
    };
  }
}

export const openKakaoNavi = (name: string, x: number | string, y: number | string) => {
  if (typeof window === "undefined") return;

  const sx = String(x);
  const sy = String(y);
  console.log(`${name},${sx},${sy}`);
  if (window.Android?.openKakaoNavi) {
    window.Android.openKakaoNavi(name, sx, sy);
    return;
  }

  // 웹뷰 밖 일반 브라우저 fallback
  const kakaoMapWeb = `https://map.kakao.com/link/to/${encodeURIComponent(name)},${sy},${sx}`;
  window.open(kakaoMapWeb, "_blank", "noopener,noreferrer");
};