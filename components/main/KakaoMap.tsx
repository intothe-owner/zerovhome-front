"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

// 💡 1. 외부에서 주소와 장소명을 받을 수 있도록 인터페이스 추가
interface KakaoMapProps {
  address?: string;
  companyName?: string;
}

export default function KakaoMap({
  address = "부산광역시 해운대구 신반송로 151", // 기본값
  companyName = "오시는 길"                   // 기본값
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 스크립트가 완전히 로드되었는지 확인
    if (isLoaded && typeof window !== "undefined" && (window as any).kakao) {
      const kakao = (window as any).kakao;

      // autoload=false로 스크립트를 불렀기 때문에 콜백으로 지도를 초기화해야 합니다.
      kakao.maps.load(() => {
        const container = mapRef.current;
        if (!container) return;

        // 기본 좌표 (주소 검색 실패 시 사용할 예비 좌표)
        const fallbackPosition = new kakao.maps.LatLng(35.2290, 129.1520);
        
        const mapOptions = {
          center: fallbackPosition,
          level: 4,
        };

        // 지도 생성
        const map = new kakao.maps.Map(container, mapOptions);
        
        // 줌 컨트롤 및 지도 타입 컨트롤 추가
        const zoomControl = new kakao.maps.ZoomControl();
        map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);
        const mapTypeControl = new kakao.maps.MapTypeControl();
        map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);

        // 마커 생성
        const marker = new kakao.maps.Marker({
          position: fallbackPosition,
          map: map,
        });

        // 주소-좌표 변환 객체 생성
        const geocoder = new kakao.maps.services.Geocoder();

        // 💡 2. props로 받은 동적 address 사용
        geocoder.addressSearch(address, function (result: any, status: any) {
          if (status === kakao.maps.services.Status.OK) {
            const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
            
            // 마커 및 지도 중심 이동
            marker.setPosition(coords);
            map.setCenter(coords);

            // 💡 3. props로 받은 동적 companyName 및 address 사용
            const infoContent = `
              <div style="padding:13px 18px; font-family:sans-serif; line-height:1.55; white-space:nowrap;">
                <strong style="display:block; margin-bottom:3px; font-size:14px; color:#0f172a;">${companyName}</strong>
                <span style="font-size:12px; color:#64748b;">${address}</span>
              </div>
            `;
            
            const infoWindow = new kakao.maps.InfoWindow({ content: infoContent });
            
            // 모바일 화면이 아닐 때만 인포윈도우 열기
            if (window.innerWidth > 768) {
              infoWindow.open(map, marker);
            }
          }
        });
      });
    }
  }, [isLoaded, address, companyName]); // 💡 4. 주소나 이름이 바뀌면 지도를 다시 그리도록 의존성 배열에 추가

  return (
    // 💡 5. h-[400px] 고정 대신 부모(BlockRenderer)의 높이를 따라가도록 h-full 적용 (최소 400px)
    <div className="relative w-full h-full min-h-[400px] bg-slate-100 rounded-lg overflow-hidden">
      {/* Next.js Script 컴포넌트를 이용한 SDK 로드 */}
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=f560bf58d09c10884b45a0e3ce3e733d&libraries=services&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => setIsLoaded(true)}
      />
      
      {/* 로딩 표시 */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10 text-slate-500 font-medium text-sm">
          지도를 불러오는 중입니다...
        </div>
      )}
      
      {/* 지도가 그려질 DOM */}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}