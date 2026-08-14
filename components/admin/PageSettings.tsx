"use client";

import { useEffect, useRef, useState } from "react";
import { Save } from "lucide-react";
import { MenuType } from "@/types/types";

interface PageSettingsProps {
    selectedMenuId: string;
    setSelectedMenuId: (id: string) => void;
    menus: MenuType[];
    title: string;
    setTitle: (title: string) => void;
    handleSave: () => void;
}

export default function PageSettings({
    selectedMenuId,
    setSelectedMenuId,
    menus,
    title,
    handleSave,
}: PageSettingsProps) {
    const [showFixedSave, setShowFixedSave] = useState(false);
    const scrollPointRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
    const updateFixedSave = () => {
        const scrollPoint = scrollPointRef.current;

        if (!scrollPoint) {
            setShowFixedSave(false);
            return;
        }

        const rect = scrollPoint.getBoundingClientRect();

        // 기준점이 화면 상단 144px 위로 올라가면 버튼 표시
        setShowFixedSave(rect.top <= 40);
    };

    // 처음 화면이 열렸을 때도 한 번 확인
    updateFixedSave();

    /*
     * true를 넣어야 window뿐 아니라
     * 내부 스크롤 영역에서 발생한 스크롤도 감지할 수 있습니다.
     */
    window.addEventListener("scroll", updateFixedSave, true);
    window.addEventListener("resize", updateFixedSave);

    return () => {
        window.removeEventListener("scroll", updateFixedSave, true);
        window.removeEventListener("resize", updateFixedSave);
    };
}, []);

    return (
        <>
            {/* absolute/invisible을 사용하지 않고 실제 스크롤 기준점으로 둡니다. */}
            <div
    ref={scrollPointRef}
    className="h-px w-full"
    aria-hidden="true"
/>

            <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-4 pt-4">
                <div className="flex items-center gap-4">
                    <select
                        value={selectedMenuId}
                        onChange={(e) => setSelectedMenuId(e.target.value)}
                        className="w-64 rounded-lg border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="0">메인</option>
                        {menus.map((menu) => (
                            <option key={menu.id} value={menu.id}>
                                {"\u00A0".repeat((menu.depth - 1) * 4)}
                                {menu.depth > 1 ? "└ " : ""}
                                {menu.name}
                            </option>
                        ))}
                    </select>

                    <p className="text-sm text-slate-500">
                        선택된 메뉴와 연동될 페이지 콘텐츠를 구성합니다.
                    </p>
                </div>

                <div className="flex items-center justify-between">
                    <input
                        type="text"
                        value={title}
                        readOnly
                        placeholder="메뉴를 선택하면 제목이 자동으로 기입됩니다."
                        className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-3xl font-extrabold text-slate-600 outline-none"
                    />

                    <button
                        type="button"
                        onClick={handleSave}
                        className="ml-4 flex flex-shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-8 py-3 font-bold text-white shadow-md transition hover:bg-indigo-700"
                    >
                        <Save size={18} />
                        저장하기
                    </button>
                </div>
            </div>

            {showFixedSave && (
    <button
        type="button"
        onClick={handleSave}
        className="fixed right-6 top-20 z-[9999] flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 font-bold text-white shadow-2xl transition-all hover:bg-indigo-700"
    >
        <Save size={18} />
        저장하기
    </button>
)}
        </>
    );
}