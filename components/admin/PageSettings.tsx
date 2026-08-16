// @/components/admin/PageSettings.tsx
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
    isSaving: boolean; // 💡 [추가] 저장 중 상태를 받는 Prop
}

export default function PageSettings({
    selectedMenuId,
    setSelectedMenuId,
    menus,
    title,
    handleSave,
    isSaving, // 💡 [추가]
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
            setShowFixedSave(rect.top <= 40);
        };

        updateFixedSave();

        window.addEventListener("scroll", updateFixedSave, true);
        window.addEventListener("resize", updateFixedSave);

        return () => {
            window.removeEventListener("scroll", updateFixedSave, true);
            window.removeEventListener("resize", updateFixedSave);
        };
    }, []);

    return (
        <>
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

                    {/* 💡 기본 저장 버튼 수정 */}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`ml-4 flex flex-shrink-0 items-center gap-2 rounded-lg px-8 py-3 font-bold text-white shadow-md transition ${
                            isSaving ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
                        }`}
                    >
                        {isSaving ? (
                            <>
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                저장중...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                저장하기
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* 💡 플로팅(고정) 저장 버튼 수정 */}
            {showFixedSave && (
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`fixed right-6 top-20 z-[9999] flex items-center gap-2 rounded-full px-6 py-3 font-bold text-white shadow-2xl transition-all ${
                        isSaving ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                >
                    {isSaving ? (
                        <>
                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                            저장중...
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            저장하기
                        </>
                    )}
                </button>
            )}
        </>
    );
}