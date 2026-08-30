"use client";

import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  onSwipeAction?: () => void | Promise<void>;
  swipeText: string;
  swipeColor: string;
  icon: ReactNode;
}

export default function SwipeableWorkItem({ children, onSwipeAction, swipeText, swipeColor, icon }: Props) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const canSwipe = typeof onSwipeAction === "function";

  // 동적으로 전달받은 색상 적용[cite: 3]
  const backgroundColor = useTransform(x, [-200, 0], [swipeColor, "#ffffff"]);
  const opacity = useTransform(x, [-100, -20], [1, 0]);
  const scale = useTransform(x, [-200, -100], [1.2, 1]);

  return (
    <div className="relative overflow-hidden border-b border-gray-100 bg-white">
      {/* 밀었을 때 나타나는 배경[cite: 2] */}
      <motion.div 
        style={{ backgroundColor }}
        className="absolute inset-0 flex items-center justify-end px-8 text-white"
      >
        <motion.div style={{ opacity, scale }} className="flex flex-col items-center gap-1">
          {icon}
          <span className="text-[11px] font-bold uppercase tracking-tighter">
            {swipeText}
          </span>
        </motion.div>
      </motion.div>

      {/* 실제 리스트 카드 콘텐츠[cite: 3] */}
      <motion.div
        drag={canSwipe ? "x" : false}
        style={{ x }}
        animate={controls}
        dragConstraints={{ left: -300, right: 0 }}
        dragElastic={0.1}
        onDragEnd={async (_, info) => {
          if (!canSwipe) return;

          // 왼쪽으로 150px 이상 밀었을 때 액션 실행[cite: 3]
          if (info.offset.x < -150) {
            await controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } });
            if (onSwipeAction) await onSwipeAction();
            controls.set({ x: 0, opacity: 1 });
          } else {
            controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } });
          }
        }}
        className="relative z-10 bg-white"
      >
        {children}
      </motion.div>
    </div>
  );
}