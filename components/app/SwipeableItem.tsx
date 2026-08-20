// components/mobile/SwipeableItem.tsx
"use client";

import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { Archive, RotateCcw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  onArchive?: () => void | Promise<void>; // '?'를 추가하여 선택적 속성으로 변경
  isArchive?: boolean;
}

const SwipeableItem = ({ children, onArchive, isArchive }: Props) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const canSwipe = typeof onArchive === "function";
  // 배경색 변화: 일반 목록은 회색, 보관함은 주황색 계열
  const backgroundColor = useTransform(
    x,
    [-200, 0],
    [!isArchive ? "#4b5563" : "#de7a24", "#ffffff"]
  );

  const opacity = useTransform(x, [-100, -20], [1, 0]);
  const scale = useTransform(x, [-200, -100], [1.2, 1]);

  return (
    <div className="relative overflow-hidden border-b border-gray-100 bg-white">
      {/* 배경 레이어: 아이템이 밀릴 때 아래에서 나타남 */}
      <motion.div 
        style={{ backgroundColor }}
        className="absolute inset-0 flex items-center justify-end px-10 text-white"
      >
        <motion.div style={{ opacity, scale }} className="flex flex-col items-center gap-1">
          {isArchive ? <RotateCcw size={28} /> : <Archive size={28} />}
          <span className="text-[10px] font-bold">
            {isArchive ? '목록으로' : '작업 동선'}
          </span>
        </motion.div>
      </motion.div>

      {/* 리스트 본체 */}
      <motion.div
        drag={canSwipe ? "x" : false}
        style={{ x }}
        animate={controls}
        dragConstraints={{ left: -300, right: 0 }}
        dragElastic={0.1} // 너무 많이 밀리지 않게 탄성 조절
        onDragEnd={async (_, info) => {
          if (!canSwipe) return;

          if (info.offset.x < -150) {
            await controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } });
            // 4. 안전하게 호출하기 위해 옵셔널 체이닝(?.) 사용
            onArchive?.(); 
            controls.set({ x: 0, opacity: 1 });
          } else {
            controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 40 } });
          }
        }}
        className="relative z-10 bg-white"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default SwipeableItem;