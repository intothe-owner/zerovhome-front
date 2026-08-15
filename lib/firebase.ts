// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Next.js는 SSR(서버사이드 렌더링)을 하므로, 중복 초기화를 방지하고 브라우저 환경에서만 Messaging을 가져오도록 처리합니다.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const messaging = typeof window !== "undefined" ? getMessaging(app) : null;

export { app, messaging, getToken, onMessage };