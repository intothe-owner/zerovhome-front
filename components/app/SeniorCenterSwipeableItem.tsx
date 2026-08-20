"use client";

import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { Archive, RotateCcw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  onArchive?: () => void | Promise<void>;
  isArchive?: boolean; // 현재 탭이 '작업동선'인지 여부
}

const SeniorCenterSwipeableItem = ({ children, onArchive, isArchive }: Props) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const canSwipe = typeof onArchive === "function";

  // 배경색: 일반 목록에서는 남색(작업동선 추가), 작업동선에서는 주황색(복구)
  const backgroundColor = useTransform(
    x,
    [-200, 0],
    [!isArchive ? "#4f46e5" : "#f59e0b", "#ffffff"]
  );

  const opacity = useTransform(x, [-100, -20], [1, 0]);
  const scale = useTransform(x, [-200, -100], [1.2, 1]);

  return (
    <div className="relative overflow-hidden border-b border-gray-100 bg-white">
      {/* 밀었을 때 나타나는 배경 (작업동선 액션) */}
      <motion.div 
        style={{ backgroundColor }}
        className="absolute inset-0 flex items-center justify-end px-10 text-white"
      >
        <motion.div style={{ opacity, scale }} className="flex flex-col items-center gap-1">
          {isArchive ? <RotateCcw size={28} /> : <Archive size={28} />}
          <span className="text-[10px] font-black uppercase tracking-tighter">
            {isArchive ? '목록으로' : '작업동선'}
          </span>
        </motion.div>
      </motion.div>

      {/* 실제 리스트 카드 콘텐츠 */}
      <motion.div
        drag={canSwipe ? "x" : false}
        style={{ x }}
        animate={controls}
        dragConstraints={{ left: -300, right: 0 }}
        dragElastic={0.1}
        onDragEnd={async (_, info) => {
          if (!canSwipe) return;

          // 왼쪽으로 150px 이상 밀었을 때 액션 실행
          if (info.offset.x < -150) {
            await controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } });
            if (onArchive) await onArchive();
            // 액션 후 위치 초기화
            controls.set({ x: 0, opacity: 1 });
          } else {
            // 충분히 밀지 않았다면 다시 제자리로
            controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } });
          }
        }}
        className="relative z-10 bg-white"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default SeniorCenterSwipeableItem;