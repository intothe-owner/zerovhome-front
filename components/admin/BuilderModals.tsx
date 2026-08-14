// @/components/main/BuilderModals.tsx
import React from "react";
import { X, Type, ImageIcon, Video, Music, Square, TableIcon, Minus, Box } from "lucide-react";
import { ContainerNode, ElementNode, ElementType, AnimationConfig } from "@/types/types";

interface BuilderModalsProps {
    layoutModalOpen: boolean;
    setLayoutModalOpen: (isOpen: boolean) => void;
    addContainer: (layoutStr: string) => void;
    
    elementModalOpen: { containerId: string; columnId: string } | null;
    setElementModalOpen: (modal: { containerId: string; columnId: string } | null) => void;
    addElement: (type: ElementType) => void;
    
    tableConfigModalOpen: { containerId: string; columnId: string } | null;
    setTableConfigModalOpen: (modal: { containerId: string; columnId: string } | null) => void;
    tableInputs: { rows: number; cols: number };
    setTableInputs: (inputs: { rows: number; cols: number }) => void;
    openTableConfig: () => void;
    confirmTableConfig: () => void;
    
    animModalOpen: string | null;
    setAnimModalOpen: (modal: string | null) => void;
    tempAnim: AnimationConfig;
    setTempAnim: (anim: AnimationConfig) => void;
    saveAnimConfig: () => void;
    
    containers: ContainerNode[];
    setContainers: (containers: ContainerNode[]) => void;
}

export default function BuilderModals({
    layoutModalOpen, setLayoutModalOpen, addContainer,
    elementModalOpen, setElementModalOpen, addElement,
    tableConfigModalOpen, setTableConfigModalOpen, tableInputs, setTableInputs, openTableConfig, confirmTableConfig,
    animModalOpen, setAnimModalOpen, tempAnim, setTempAnim, saveAnimConfig,
    containers, setContainers
}: BuilderModalsProps) {
    return (
        <>
            {/* 레이아웃 모달 */}
            {layoutModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e88e5] border-b-4">
                            <h3 className="text-lg font-bold text-slate-800">레이아웃 선택</h3>
                            <button onClick={() => setLayoutModalOpen(false)} className="text-slate-400 hover:text-red-500"><X size={24} /></button>
                        </div>
                        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 h-[60vh] overflow-y-auto">
                            {["1/1", "1/2+1/2", "1/3+1/3+1/3", "1/4+1/4+1/4+1/4", "2/3+1/3", "1/3+2/3", "1/4+3/4", "3/4+1/4"].map(layout => (
                                <button
                                    key={layout} onClick={() => addContainer(layout)}
                                    className="bg-white border border-slate-200 p-2 hover:border-indigo-500 hover:shadow-md transition group flex h-24 gap-1"
                                >
                                    {layout.split("+").map((w, i) => (
                                        <div key={i} className="bg-slate-300 group-hover:bg-[#1e88e5] flex items-center justify-center transition-colors h-full text-white text-xs font-bold" style={{ width: `calc(${eval(w) * 100}%)` }}>{w}</div>
                                    ))}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 엘리먼트 추가 모달 */}
            {elementModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                            <h3 className="text-2xl font-bold text-slate-800">Select Element</h3>
                            <button onClick={() => setElementModalOpen(null)} className="text-slate-400 hover:text-red-500"><X size={24} /></button>
                        </div>
                        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50">
                            <button onClick={() => addElement("TEXT")} className="bg-white border border-slate-200 p-4 flex items-center gap-4 hover:border-[#0088cc] hover:shadow-md transition rounded">
                                <Type size={20} className="text-slate-600" /> <span className="font-bold text-slate-700">Text Block</span>
                            </button>
                            <button onClick={() => addElement("IMAGE")} className="bg-white border border-slate-200 p-4 flex items-center gap-4 hover:border-[#0088cc] hover:shadow-md transition rounded">
                                <ImageIcon size={20} className="text-slate-600" /> <span className="font-bold text-slate-700">Image</span>
                            </button>
                            <button onClick={() => addElement("VIDEO")} className="bg-white border border-slate-200 p-4 flex items-center gap-4 hover:border-[#0088cc] hover:shadow-md transition rounded">
                                <Video size={20} className="text-slate-600" /> <span className="font-bold text-slate-700">Video</span>
                            </button>
                            <button onClick={() => addElement("AUDIO")} className="bg-white border border-slate-200 p-4 flex items-center gap-4 hover:border-[#0088cc] hover:shadow-md transition rounded">
                                <Music size={20} className="text-slate-600" /> <span className="font-bold text-slate-700">Audio</span>
                            </button>
                            <button onClick={() => {
                                if (!elementModalOpen) return;
                                const { containerId, columnId } = elementModalOpen;
                                setContainers(containers.map(c => c.id === containerId ? { ...c, columns: c.columns.map(col => col.id === columnId ? { ...col, elements: [...col.elements, { id: Math.random().toString(36).substr(2, 9), type: "BUTTON", content: "", buttonStyles: { text: "버튼", backgroundColor: "#1e88e5", color: "#ffffff", fontSize: 16, width: 120, borderRadius: 6, layerAlign: "center" } }] } : col) } : c));
                                setElementModalOpen(null);
                            }} className="bg-white border border-slate-200 p-4 flex items-center gap-4 hover:border-[#0088cc] hover:shadow-md transition rounded">
                                <Square size={20} className="text-slate-600" /> <span className="font-bold text-slate-700">Button</span>
                            </button>
                            <button onClick={openTableConfig} className="bg-white border border-slate-200 p-4 flex items-center gap-4 hover:border-[#0088cc] hover:shadow-md transition rounded">
                                <TableIcon size={20} className="text-slate-600" /> <span className="font-bold text-slate-700">Table</span>
                            </button>
                            <button onClick={() => addElement("SEPARATOR")} className="bg-white border border-slate-200 p-4 flex items-center gap-4 hover:border-[#0088cc] hover:shadow-md transition rounded">
                                <Minus size={20} className="text-slate-600" /> <span className="font-bold text-slate-700">Separator</span>
                            </button>
                            <button onClick={() => {
                                if (!elementModalOpen) return;
                                const { containerId, columnId } = elementModalOpen;
                                const newCard: ElementNode = {
                                    id: Math.random().toString(36).substr(2, 9),
                                    type: "CARD",
                                    content: "카드 내용을 입력하세요.",
                                    cardData: { layout: "row", iconUrl: "", iconSize: 64, animation: "none", backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, shadow: "md", padding: 20, verticalAlign: "center" },
                                    styles: { fontFamily: "default", fontSize: 16, color: "#000000", textAlign: "left", layerAlign: "flex-start", linkUrl: "", fontWeight: "normal", fontStyle: "normal" }
                                };
                                setContainers(containers.map(c => c.id === containerId ? { ...c, columns: c.columns.map(col => col.id === columnId ? { ...col, elements: [...col.elements, newCard] } : col) } : c));
                                setElementModalOpen(null);
                            }} className="bg-white border border-slate-200 p-4 flex items-center gap-4 hover:border-[#0088cc] hover:shadow-md transition rounded">
                                <Box size={20} className="text-slate-600" /> <span className="font-bold text-slate-700">Card</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 테이블 설정 모달 */}
            {tableConfigModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800">표(Table) 설정</h3>
                            <button onClick={() => setTableConfigModalOpen(null)} className="text-slate-400 hover:text-red-500"><X size={20} /></button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <label className="font-bold text-slate-700 text-sm">줄 (Rows / 가로줄)</label>
                                <input
                                    type="number" min="1" max="20"
                                    value={tableInputs.rows}
                                    onChange={(e) => setTableInputs({ ...tableInputs, rows: Number(e.target.value) })}
                                    className="border border-slate-300 rounded px-3 py-1.5 w-20 text-center outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="font-bold text-slate-700 text-sm">칸 (Cols / 세로칸)</label>
                                <input
                                    type="number" min="1" max="20"
                                    value={tableInputs.cols}
                                    onChange={(e) => setTableInputs({ ...tableInputs, cols: Number(e.target.value) })}
                                    className="border border-slate-300 rounded px-3 py-1.5 w-20 text-center outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="flex bg-slate-50 p-4 border-t border-slate-200 justify-end gap-2">
                            <button onClick={() => setTableConfigModalOpen(null)} className="px-4 py-2 bg-white border border-slate-300 rounded text-sm font-bold text-slate-600 hover:bg-slate-100">취소</button>
                            <button onClick={confirmTableConfig} className="px-6 py-2 bg-indigo-600 rounded text-sm font-bold text-white hover:bg-indigo-700 shadow-sm">표 생성</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 애니메이션 설정 모달 */}
            {animModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800">등장 애니메이션 설정</h3>
                            <button onClick={() => setAnimModalOpen(null)} className="text-slate-400 hover:text-red-500"><X size={20} /></button>
                        </div>
                        <div className="p-6 flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-slate-700 text-sm">애니메이션 효과</label>
                                <select
                                    value={tempAnim.type}
                                    onChange={(e) => setTempAnim({ ...tempAnim, type: e.target.value as AnimationConfig['type'] })}
                                    className="border border-slate-300 rounded px-3 py-2 outline-none focus:border-indigo-500 text-sm"
                                >
                                    <option value="none">사용 안 함 (None)</option>
                                    <option value="fadeIn">서서히 나타나기 (Fade In)</option>
                                    <option value="slideUp">아래에서 위로 (Slide Up)</option>
                                    <option value="slideDown">위에서 아래로 (Slide Down)</option>
                                    <option value="slideLeft">오른쪽에서 왼쪽으로 (Slide Left)</option>
                                    <option value="slideRight">왼쪽에서 오른쪽으로 (Slide Right)</option>
                                    <option value="zoomIn">확대되며 나타나기 (Zoom In)</option>
                                </select>
                            </div>

                            {tempAnim.type !== "none" && (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between">
                                            <label className="font-bold text-slate-700 text-sm">지속 시간 (Duration)</label>
                                            <span className="text-xs text-indigo-600 font-bold">{tempAnim.duration}초</span>
                                        </div>
                                        <input
                                            type="range" min="0.1" max="3" step="0.1"
                                            value={tempAnim.duration}
                                            onChange={(e) => setTempAnim({ ...tempAnim, duration: Number(e.target.value) })}
                                            className="w-full accent-indigo-600"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between">
                                            <label className="font-bold text-slate-700 text-sm">지연 시간 (Delay)</label>
                                            <span className="text-xs text-indigo-600 font-bold">{tempAnim.delay}초</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="2" step="0.1"
                                            value={tempAnim.delay}
                                            onChange={(e) => setTempAnim({ ...tempAnim, delay: Number(e.target.value) })}
                                            className="w-full accent-indigo-600"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex bg-slate-50 p-4 border-t border-slate-200 justify-end gap-2">
                            <button onClick={() => setAnimModalOpen(null)} className="px-4 py-2 bg-white border border-slate-300 rounded text-sm font-bold text-slate-600 hover:bg-slate-100">취소</button>
                            <button onClick={saveAnimConfig} className="px-6 py-2 bg-indigo-600 rounded text-sm font-bold text-white hover:bg-indigo-700 shadow-sm">적용하기</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}