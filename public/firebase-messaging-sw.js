// public/firebase-messaging-sw.js

// Firebase JS SDK 가져오기 (버전은 호환성을 위해 compat 사용)
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// 2단계에서 복사한 firebaseConfig 내용을 똑같이 넣어주세요. (process.env 사용 불가)
const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 백그라운드 메시지 수신 시 시스템 알림 띄우기
messaging.onBackgroundMessage((payload) => {
  
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png' // public 폴더 안의 로고 이미지 경로
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});