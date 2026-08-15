
import PushNotification from "@/components/PushNotification";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning은 서버/클라이언트 테마 불일치 경고를 방지합니다.
    <html lang="ko" suppressHydrationWarning>
      <body>
        <PushNotification/>
          {children}
        
      </body>
    </html>
  );
}