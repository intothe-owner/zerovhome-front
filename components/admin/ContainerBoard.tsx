// @/components/admin/ContainerBoard.tsx
import React, { useState, useRef, useEffect } from "react";
import {
    LayoutTemplate, Trash2, Wand2, Plus,
    Bold, Italic, Underline, Link as LinkIcon, Box, AlignLeft, AlignCenter, AlignRight,
    Upload, Video, Music, ImageIcon, X, Merge, Split, Sparkles, ImagePlus, Code, GripVertical
} from "lucide-react";
import { ContainerNode, ElementNode, TableData, TableCell } from "@/types/types";

interface ContainerBoardProps {
    containers: ContainerNode[];
    setContainers: (containers: ContainerNode[]) => void;
    activeElementId: string | null;
    setActiveElementId: (id: string | null) => void;
    setLayoutModalOpen: (isOpen: boolean) => void;
    setElementModalOpen: (modal: { containerId: string; columnId: string } | null) => void;
    openAnimModal: (item: any, type?: 'container' | 'element', containerId?: string, columnId?: string) => void;
    deleteElement: (containerId: string, columnId: string, elementId: string) => void;
    handleFileUpload: (containerId: string, columnId: string, elementId: string, file: File) => void;
    updateElementStyle: (containerId: string, columnId: string, elementId: string, key: any, value: any) => void;
    updateElementProps: (containerId: string, columnId: string, elementId: string, category: 'styles' | 'buttonStyles' | 'tableData' | 'cardData', key: string, value: any) => void;
    updateElementHtmlContent: (elementId: string, htmlContent: string) => void;
    applyStyleToSelection: (styleType: any, value: any) => boolean;
    handleSelection: () => void;
    handleResizeStart: (e: React.MouseEvent, containerId: string, columnId: string, el: ElementNode, direction: string) => void;
    selectedCells: Set<string>;
    setSelectedCells: (cells: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
    isDraggingCell: boolean;
    setIsDraggingCell: (isDragging: boolean) => void;
    mergeCells: (containerId: string, columnId: string, elementId: string, tableData: TableData) => void;
    unmergeCells: (containerId: string, columnId: string, elementId: string, cellKey: string, tableData: TableData) => void;
    getCommonBorderWidth: (tableData: TableData) => number;
    getCommonBorderColor: (tableData: TableData) => string;
    applyToTableCells: (containerId: string, columnId: string, elementId: string, tableData: TableData, key: any, value: any) => void;
    savedRangeRef: React.MutableRefObject<Range | null>;
    setAiModalOpen?: (type: string, id?: string, content?: string) => void;
}

export default function ContainerBoard({
    containers, setContainers, activeElementId, setActiveElementId,
    setLayoutModalOpen, setElementModalOpen, openAnimModal,
    deleteElement, handleFileUpload, updateElementStyle, updateElementProps, updateElementHtmlContent,
    applyStyleToSelection, handleSelection, handleResizeStart,
    selectedCells, setSelectedCells, isDraggingCell, setIsDraggingCell,
    mergeCells, unmergeCells, getCommonBorderWidth, getCommonBorderColor, applyToTableCells, savedRangeRef,
    setAiModalOpen
}: ContainerBoardProps) {

    const [htmlModeElements, setHtmlModeElements] = useState<Record<string, boolean>>({});

    const dragItem = useRef<{ containerId: string, columnId: string, elementIndex: number } | null>(null);
    const dragOverItem = useRef<{ containerId: string, columnId: string, elementIndex: number } | null>(null);
    const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);

    // 💡 HTML 내부 인라인 이미지를 클릭했을 때 띄울 툴바의 상태 관리
    const [selectedInlineImg, setSelectedInlineImg] = useState<{
        elId: string;
        node: HTMLImageElement;
        top: number;
        left: number;
        cellKey?: string;
    } | null>(null);

    // 활성화된 엘리먼트가 바뀌거나 스크롤이 발생하면 인라인 이미지 툴바 닫기
    useEffect(() => {
        if (!activeElementId) setSelectedInlineImg(null);
    }, [activeElementId]);

    useEffect(() => {
        const handleScroll = () => { if (selectedInlineImg) setSelectedInlineImg(null); };
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [selectedInlineImg]);

    // 💡 인라인 이미지 클릭 핸들러
    const handleInlineImgClick = (e: React.MouseEvent, elId: string, cellKey?: string) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG') {
            const rect = target.getBoundingClientRect();
            setSelectedInlineImg({
                elId,
                node: target as HTMLImageElement,
                top: rect.top,
                left: rect.left,
                cellKey
            });
        } else {
            setSelectedInlineImg(null);
        }
    };

    // 💡 인라인 이미지 변경/삭제 후 HTML 내용을 저장하는 함수
    const applyInlineImageChange = (elId: string, cellKey?: string) => {
        if (cellKey) {
            // 테이블 셀 내부 이미지일 경우
            const container = containers.find(c => c.columns.some(col => col.elements.some(e => e.id === elId)));
            if (!container) return;
            const column = container.columns.find(col => col.elements.some(e => e.id === elId));
            if (!column) return;
            const el = column.elements.find(e => e.id === elId);
            if (!el || !el.tableData) return;

            const editableDiv = document.getElementById(`editable-${elId}-${cellKey}`);
            if (editableDiv) {
                const newCells = { ...el.tableData.cells };
                newCells[cellKey].content = editableDiv.innerHTML;
                updateElementProps(container.id, column.id, el.id, 'tableData', 'cells', newCells);
            }
        } else {
            // 텍스트, 카드 엘리먼트 내부 이미지일 경우
            const editableDiv = document.getElementById(`editable-${elId}`);
            if (editableDiv) {
                updateElementHtmlContent(elId, editableDiv.innerHTML);
            }
        }
    };

    const toggleHtmlMode = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setHtmlModeElements(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const getWidthClass = (width: string) => {
        switch (width) {
            case "1/1": return "w-full"; case "1/2": return "w-1/2"; case "1/3": return "w-1/3";
            case "2/3": return "w-2/3"; case "1/4": return "w-1/4"; case "3/4": return "w-3/4";
            default: return "w-full";
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, containerId: string, columnId: string, elementIndex: number) => {
        dragItem.current = { containerId, columnId, elementIndex };
        setIsDraggingGlobal(true);
        e.dataTransfer.effectAllowed = "move";
        
        const target = e.target as HTMLElement;
        setTimeout(() => {
            target.classList.add("opacity-50", "border-dashed", "border-2", "border-indigo-500");
        }, 0);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, containerId: string, columnId: string, elementIndex: number) => {
        e.preventDefault();
        dragOverItem.current = { containerId, columnId, elementIndex };
        const target = e.currentTarget as HTMLElement;
        target.classList.add("border-t-4", "border-indigo-500");
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        const target = e.currentTarget as HTMLElement;
        target.classList.remove("border-t-4", "border-indigo-500");
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetContainerId: string, targetColumnId: string, targetElementIndex: number) => {
        e.preventDefault();
        const target = e.currentTarget as HTMLElement;
        target.classList.remove("border-t-4", "border-indigo-500");

        if (!dragItem.current || !dragOverItem.current) return;

        const { containerId: sourceContainerId, columnId: sourceColumnId, elementIndex: sourceIndex } = dragItem.current;

        if (sourceContainerId === targetContainerId && sourceColumnId === targetColumnId && sourceIndex === targetElementIndex) {
            return;
        }

        const newContainers = [...containers];
        const sourceContainer = newContainers.find(c => c.id === sourceContainerId);
        const targetContainer = newContainers.find(c => c.id === targetContainerId);
        
        if (!sourceContainer || !targetContainer) return;

        const sourceColumn = sourceContainer.columns.find(c => c.id === sourceColumnId);
        const targetColumn = targetContainer.columns.find(c => c.id === targetColumnId);

        if (!sourceColumn || !targetColumn) return;

        const [draggedElement] = sourceColumn.elements.splice(sourceIndex, 1);
        targetColumn.elements.splice(targetElementIndex, 0, draggedElement);

        setContainers(newContainers);
        dragItem.current = null;
        dragOverItem.current = null;
        setIsDraggingGlobal(false);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        setIsDraggingGlobal(false);
        const target = e.target as HTMLElement;
        target.classList.remove("opacity-50", "border-dashed", "border-2", "border-indigo-500");
        dragItem.current = null;
        dragOverItem.current = null;
    };

    return (
        <div className="space-y-6 min-h-[500px]">
            {containers.map((container) => (
                <div key={container.id} className="border border-slate-300 bg-white">
                    <div className="bg-[#1e88e5] flex items-center justify-between px-3 py-1.5 text-white">
                        <span className="text-sm font-semibold flex items-center gap-2">
                            <LayoutTemplate size={16} /> Container
                            {container.animation && container.animation.type !== 'none' && (
                                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full ml-2">
                                    {container.animation.type}
                                </span>
                            )}
                        </span>
                        <div className="flex items-center gap-1">
                            {setAiModalOpen && (
                                <button onClick={() => setAiModalOpen('CONTAINER', container.id, JSON.stringify(container))} className="p-1.5 hover:bg-white/20 rounded transition text-yellow-300" title="AI로 구성 변경">
                                    <Sparkles size={14} />
                                </button>
                            )}
                            <button onClick={() => openAnimModal(container, 'container')} className="p-1.5 hover:bg-white/20 rounded transition" title="애니메이션 설정">
                                <Wand2 size={14} />
                            </button>
                            <button onClick={() => setContainers(containers.filter((c) => c.id !== container.id))} className="p-1.5 hover:bg-red-500 rounded transition" title="삭제">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap p-4 gap-4 bg-slate-50">
                        {container.columns.map((column) => (
                            <div key={column.id} className={`${getWidthClass(column.width)} flex-shrink-0 flex flex-col gap-1 relative`} style={{ width: `calc(${eval(column.width) * 100}% - 0.5rem)` }}>

                                {column.elements.length === 0 && (
                                    <div 
                                        className="h-20 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400"
                                        onDragEnter={(e) => handleDragEnter(e, container.id, column.id, 0)}
                                        onDragLeave={handleDragLeave}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => handleDrop(e, container.id, column.id, 0)}
                                    >
                                        빈 영역 (요소를 드래그하여 드랍하세요)
                                    </div>
                                )}

                                {column.elements.map((el, index) => {
                                    const isActive = activeElementId === el.id;

                                    return (
                                        <div 
                                            key={el.id} 
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, container.id, column.id, index)}
                                            onDragEnter={(e) => handleDragEnter(e, container.id, column.id, index)}
                                            onDragLeave={handleDragLeave}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => handleDrop(e, container.id, column.id, index)}
                                            onDragEnd={handleDragEnd}
                                            className={`element-box relative flex w-full transition-transform ${el.type === 'TEXT' ? 'py-1 px-4' : 'p-4'} ${isDraggingGlobal ? 'cursor-grabbing' : 'cursor-grab'} hover:bg-slate-100/50`} 
                                            style={{ justifyContent: el.styles?.layerAlign || 'flex-start' }}
                                        >

                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 p-1 text-slate-300 cursor-grab hover:text-indigo-500 z-50">
                                                <GripVertical size={16} />
                                            </div>

                                            {el.animation && el.animation.type !== 'none' && (
                                                <div className="absolute -top-2 -left-2 bg-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded-full z-10 shadow-sm pointer-events-none">
                                                    {el.animation.type}
                                                </div>
                                            )}

                                            {/* 1. TEXT Element */}
                                            {el.type === "TEXT" && el.styles && (
                                                <div
                                                    id={`element-${el.id}`}
                                                    className={`relative group inline-block w-full ml-4 ${isActive ? 'outline outline-2 outline-[#00d0d0]' : 'hover:outline hover:outline-1 hover:outline-slate-300'}`}
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        if (activeElementId !== el.id) setActiveElementId(el.id);
                                                    }}
                                                    style={{
                                                        width: el.styles.width === "auto" ? "100%" : `${el.styles.width}px`,
                                                        height: el.styles.height === "auto" ? "auto" : `${el.styles.height}px`,
                                                    }}
                                                >
                                                    {isActive && (
                                                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-slate-200 px-3 py-2 flex items-center gap-2 z-50 whitespace-nowrap element-toolbar">
                                                            <button
                                                                onMouseDown={(e) => toggleHtmlMode(e, el.id)}
                                                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors ${htmlModeElements[el.id] ? 'bg-slate-800 text-green-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                                                title="HTML 소스 직접 편집"
                                                            >
                                                                <Code size={14} /> HTML
                                                            </button>
                                                            <div className="w-px h-4 bg-slate-300" />
                                                            <button
                                                                onMouseDown={(e) => { e.preventDefault(); openAnimModal(el, 'element', container.id, column.id); }}
                                                                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                                                                title="애니메이션 효과"
                                                            >
                                                                <Wand2 size={14} /> 애니
                                                            </button>
                                                            <div className="w-px h-4 bg-slate-300" />

                                                            {setAiModalOpen && (
                                                                <>
                                                                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => setAiModalOpen('TEXT', el.id, el.content)} className="text-purple-600 hover:text-purple-800 flex items-center gap-1 bg-purple-50 px-2 py-1 rounded" title="AI로 내용 수정">
                                                                        <Sparkles size={14} />
                                                                    </button>
                                                                    <div className="w-px h-4 bg-slate-300" />
                                                                </>
                                                            )}
                                                            <select
                                                                value={el.styles.fontFamily}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    const isApplied = applyStyleToSelection('fontFamily', val);
                                                                    if (!isApplied) updateElementStyle(container.id, column.id, el.id, "fontFamily", val);
                                                                }}
                                                                className="border border-slate-200 rounded p-1 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                                                            >
                                                                <option value="default">기본 폰트</option>
                                                                <option value="var(--font-noto-sans)">Noto Sans KR</option>
                                                                <option value="var(--font-nanum-gothic)">나눔고딕</option>
                                                                <option value="var(--font-gothic-a1)">Gothic A1</option>
                                                                <option value="var(--font-black-han-sans)">검은고딕</option>
                                                                <option value="var(--font-nanum-myeongjo)">나눔명조</option>
                                                                <option value="var(--font-gowun-batang)">고운바탕</option>
                                                                <option value="var(--font-jua)">주아체</option>
                                                                <option value="var(--font-do-hyeon)">도현체</option>
                                                                <option value="var(--font-nanum-pen-script)">나눔손글씨 펜</option>
                                                            </select>
                                                            <div className="w-px h-4 bg-slate-300" />
                                                            <div className="flex items-center gap-1">
                                                                <input
                                                                    type="number"
                                                                    value={el.styles.fontSize}
                                                                    onChange={(e) => {
                                                                        const val = Number(e.target.value);
                                                                        const isApplied = applyStyleToSelection('fontSize', val);
                                                                        if (!isApplied) updateElementStyle(container.id, column.id, el.id, "fontSize", val);
                                                                    }}
                                                                    className="w-12 text-center text-xs font-bold border border-slate-200 rounded outline-none py-1"
                                                                />
                                                                <span className="text-[10px] text-slate-400">px</span>
                                                            </div>
                                                            <div className="w-px h-4 bg-slate-300" />
                                                            <input
                                                                type="color"
                                                                value={el.styles.color}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    const isApplied = applyStyleToSelection('color', val);
                                                                    if (!isApplied) updateElementStyle(container.id, column.id, el.id, "color", val);
                                                                }}
                                                                className="w-5 h-5 p-0 border-none rounded cursor-pointer"
                                                            />
                                                            <div className="w-px h-4 bg-slate-300" />
                                                            <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded">
                                                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => updateElementStyle(container.id, column.id, el.id, "textAlign", "left")} className={`p-1 rounded ${el.styles.textAlign === 'left' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="텍스트 좌측 정렬"><AlignLeft size={14} /></button>
                                                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => updateElementStyle(container.id, column.id, el.id, "textAlign", "center")} className={`p-1 rounded ${el.styles.textAlign === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="텍스트 가운데 정렬"><AlignCenter size={14} /></button>
                                                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => updateElementStyle(container.id, column.id, el.id, "textAlign", "right")} className={`p-1 rounded ${el.styles.textAlign === 'right' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="텍스트 우측 정렬"><AlignRight size={14} /></button>
                                                            </div>
                                                            <div className="w-px h-4 bg-slate-300" />
                                                            <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded">
                                                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => { const newVal = el.styles!.fontWeight === "bold" ? "normal" : "bold"; const isApplied = applyStyleToSelection('fontWeight', newVal); if (!isApplied) updateElementStyle(container.id, column.id, el.id, "fontWeight", newVal); }} className={`p-1 rounded ${el.styles!.fontWeight === 'bold' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="굵게"><Bold size={14} /></button>
                                                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => { const newVal = el.styles!.fontStyle === "italic" ? "normal" : "italic"; const isApplied = applyStyleToSelection('fontStyle', newVal); if (!isApplied) updateElementStyle(container.id, column.id, el.id, "fontStyle", newVal); }} className={`p-1 rounded ${el.styles!.fontStyle === 'italic' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="이탤릭"><Italic size={14} /></button>
                                                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => { const newVal = el.styles!.textDecoration === "underline" ? "none" : "underline"; const isApplied = applyStyleToSelection('textDecoration', newVal); if (!isApplied) updateElementStyle(container.id, column.id, el.id, "textDecoration", newVal); }} className={`p-1 rounded ${el.styles!.textDecoration === 'underline' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="밑줄"><Underline size={14} /></button>
                                                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => { if (savedRangeRef.current && activeElementId) { const url = window.prompt("선택한 글자에 연결할 웹사이트 주소를 입력하세요:", "https://"); if (url) applyStyleToSelection('link', url); } else { alert("링크를 걸 글자를 먼저 드래그하여 선택해주세요."); } }} className="p-1 rounded text-slate-500 hover:bg-white hover:shadow-sm hover:text-indigo-600" title="링크 걸기 (글자 드래그 후 클릭)"><LinkIcon size={14} /></button>
                                                            </div>
                                                            <div className="w-px h-4 bg-slate-300" />
                                                            <button onMouseDown={(e) => e.preventDefault()} onClick={() => deleteElement(container.id, column.id, el.id)} className="text-slate-500 hover:text-red-500" title="삭제"><Trash2 size={16} /></button>
                                                        </div>
                                                    )}

                                                    {isActive && !htmlModeElements[el.id] && (
                                                        <>
                                                            <div onMouseDown={(e) => handleResizeStart(e, container.id, column.id, el, 'nw')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#00d0d0] rounded-full cursor-nwse-resize z-10" />
                                                            <div onMouseDown={(e) => handleResizeStart(e, container.id, column.id, el, 'ne')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#00d0d0] rounded-full cursor-nesw-resize z-10" />
                                                            <div onMouseDown={(e) => handleResizeStart(e, container.id, column.id, el, 'sw')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#00d0d0] rounded-full cursor-nesw-resize z-10" />
                                                            <div onMouseDown={(e) => handleResizeStart(e, container.id, column.id, el, 'se')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#00d0d0] rounded-full cursor-nwse-resize z-10" />
                                                        </>
                                                    )}

                                                    {htmlModeElements[el.id] ? (
                                                        <textarea
                                                            value={el.content}
                                                            onMouseDown={(e) => { e.stopPropagation(); setActiveElementId(el.id); }}
                                                            onChange={(e) => updateElementHtmlContent(el.id, e.target.value)}
                                                            className="w-full min-h-[200px] p-4 bg-slate-900 text-green-400 font-mono text-sm leading-relaxed rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                                                            placeholder="HTML 코드를 입력하세요..."
                                                        />
                                                    ) : (
                                                        <div
                                                            id={`editable-${el.id}`}
                                                            contentEditable
                                                            suppressContentEditableWarning
                                                            onMouseUp={handleSelection}
                                                            onKeyUp={handleSelection}
                                                            onClick={(e) => handleInlineImgClick(e, el.id)} // 💡 인라인 이미지 클릭 감지
                                                            onBlur={(e) => {
                                                                // 툴바 안의 버튼을 눌렀을 때는 블러 처리를 무시하여 HTML이 바로 덮어써지지 않게 보호
                                                                if (e.relatedTarget && ((e.relatedTarget as HTMLElement).closest('.element-toolbar') || (e.relatedTarget as HTMLElement).closest('.inline-img-toolbar'))) {
                                                                    return;
                                                                }
                                                                updateElementHtmlContent(el.id, e.currentTarget.innerHTML);
                                                            }}
                                                            style={{
                                                                fontSize: `${el.styles.fontSize}px`,
                                                                color: el.styles.color,
                                                                textAlign: el.styles.textAlign,
                                                                fontFamily: el.styles.fontFamily !== 'default' ? el.styles.fontFamily : 'inherit',
                                                                outline: 'none',
                                                                fontWeight: el.styles.fontWeight || 'normal',
                                                                fontStyle: el.styles.fontStyle || 'normal',
                                                                textDecoration: el.styles.textDecoration || 'none',
                                                                width: '100%',
                                                                height: '100%'
                                                            }}
                                                            className="px-2 cursor-text whitespace-pre-wrap"
                                                            dangerouslySetInnerHTML={{ __html: el.content }}
                                                        />
                                                    )}
                                                </div>
                                            )}

                                            {/* 2. IMAGE Element */}
                                            {el.type === "IMAGE" && (
                                                <div className="w-full relative group hover:outline outline-2 outline-indigo-200 rounded ml-4" onMouseDown={(e) => { e.stopPropagation(); setActiveElementId(el.id); }}>
                                                    {el.content ? (
                                                        <div className="relative border rounded overflow-hidden">
                                                            <img src={el.content} alt="업로드/생성 이미지" className="w-full h-auto object-cover max-h-64 min-h-[100px] bg-slate-100" />

                                                            {el.content.includes("pollinations.ai") && (
                                                                <div className="absolute top-0 left-0 w-full h-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                                                                    <label className="flex items-center gap-1 bg-white text-slate-800 px-3 py-1.5 rounded text-xs font-bold cursor-pointer shadow hover:bg-slate-100">
                                                                        <ImagePlus size={14} /> 직접 첨부하기
                                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                                            if (e.target.files?.[0]) handleFileUpload(container.id, column.id, el.id, e.target.files[0]);
                                                                        }} />
                                                                    </label>
                                                                    {setAiModalOpen && (
                                                                        <button onClick={(e) => { e.stopPropagation(); setAiModalOpen('IMAGE', el.id, ''); }} className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow hover:bg-purple-700">
                                                                            <Sparkles size={14} /> AI로 다시 그리기
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}

                                                            <div className="absolute top-2 right-2 flex items-center gap-2 z-20">
                                                                <label className="flex items-center gap-1 p-1.5 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 cursor-pointer transition-colors" title="이미지 변경">
                                                                    <ImagePlus size={14} />
                                                                    <span className="text-xs font-bold px-1 cursor-pointer">변경</span>
                                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                                        if (e.target.files?.[0]) handleFileUpload(container.id, column.id, el.id, e.target.files[0]);
                                                                    }} />
                                                                </label>
                                                                <button onClick={(e) => { e.stopPropagation(); openAnimModal(el, 'element', container.id, column.id); }} className="p-1.5 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 transition-colors" title="애니메이션 설정">
                                                                    <Wand2 size={14} />
                                                                </button>
                                                                <button onClick={() => deleteElement(container.id, column.id, el.id)} className="p-1.5 bg-red-600 text-white rounded shadow hover:bg-red-700 transition-colors" title="삭제">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.[0]) handleFileUpload(container.id, column.id, el.id, e.dataTransfer.files[0]); }} className="h-40 bg-slate-50 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 rounded cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/20 transition w-full">
                                                            <Upload size={28} className="mb-2 text-indigo-500" />
                                                            <span className="text-xs font-bold text-slate-700">이미지를 드래그하거나 클릭하여 업로드</span>
                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(container.id, column.id, el.id, e.target.files[0])} />
                                                        </label>
                                                    )}

                                                    {/* URL 링크 설정 창 */}
                                                    <div className="mt-2 flex items-center gap-2 bg-slate-50 p-1.5 border border-slate-200 rounded">
                                                        <LinkIcon size={14} className="text-slate-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="이미지 클릭 시 이동할 URL"
                                                            value={el.styles?.linkUrl || ""}
                                                            onChange={(e) => updateElementStyle(container.id, column.id, el.id, "linkUrl", e.target.value)}
                                                            className="w-full text-xs p-1 bg-white border border-slate-300 rounded outline-none focus:border-indigo-500"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* 3. VIDEO Element */}
                                            {el.type === "VIDEO" && (
                                                <div className="w-full relative ml-4" onMouseDown={(e) => { e.stopPropagation(); setActiveElementId(el.id); }}>
                                                    {el.content ? (
                                                        <div className="relative border rounded overflow-hidden bg-black">
                                                            <video src={el.content} controls className="w-full max-h-64 object-contain" />
                                                            <div className="absolute top-2 right-2 flex items-center gap-2 z-20">
                                                                <button onClick={(e) => { e.stopPropagation(); openAnimModal(el, 'element', container.id, column.id); }} className="p-1.5 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 transition-colors" title="애니메이션 설정">
                                                                    <Wand2 size={14} />
                                                                </button>
                                                                <button onClick={() => deleteElement(container.id, column.id, el.id)} className="p-1.5 bg-red-600 text-white rounded shadow hover:bg-red-700 transition-colors">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <label
                                                            onDragOver={(e) => e.preventDefault()}
                                                            onDrop={(e) => {
                                                                e.preventDefault();
                                                                if (e.dataTransfer.files?.[0]) handleFileUpload(container.id, column.id, el.id, e.dataTransfer.files[0]);
                                                            }}
                                                            className="h-40 bg-slate-50 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 rounded cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/20 transition w-full"
                                                        >
                                                            <Video size={28} className="mb-2 text-indigo-500" />
                                                            <span className="text-xs font-bold text-slate-700">동영상 파일을 드래그하거나 클릭하여 업로드</span>
                                                            <input type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(container.id, column.id, el.id, e.target.files[0])} />
                                                        </label>
                                                    )}
                                                </div>
                                            )}

                                            {/* 4. AUDIO Element */}
                                            {el.type === "AUDIO" && (
                                                <div className="w-full relative ml-4" onMouseDown={(e) => { e.stopPropagation(); setActiveElementId(el.id); }}>
                                                    {el.content ? (
                                                        <div className="relative border rounded p-4 bg-white flex flex-col gap-2 w-full pt-10">
                                                            <audio src={el.content} controls className="w-full" />
                                                            <div className="absolute top-2 right-2 flex items-center gap-2 z-20">
                                                                <button onClick={(e) => { e.stopPropagation(); openAnimModal(el, 'element', container.id, column.id); }} className="p-1.5 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 transition-colors" title="애니메이션 설정">
                                                                    <Wand2 size={14} />
                                                                </button>
                                                                <button onClick={() => deleteElement(container.id, column.id, el.id)} className="p-1.5 bg-red-600 text-white rounded shadow hover:bg-red-700 transition-colors">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <label
                                                            onDragOver={(e) => e.preventDefault()}
                                                            onDrop={(e) => {
                                                                e.preventDefault();
                                                                if (e.dataTransfer.files?.[0]) handleFileUpload(container.id, column.id, el.id, e.dataTransfer.files[0]);
                                                            }}
                                                            className="h-32 bg-slate-50 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 rounded cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/20 transition w-full"
                                                        >
                                                            <Music size={28} className="mb-2 text-indigo-500" />
                                                            <span className="text-xs font-bold text-slate-700">오디오 파일을 드래그하거나 클릭하여 업로드</span>
                                                            <input type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(container.id, column.id, el.id, e.target.files[0])} />
                                                        </label>
                                                    )}
                                                </div>
                                            )}

                                            {/* 5. BUTTON Element */}
                                            {el.type === "BUTTON" && el.buttonStyles && (
                                                <div className="p-4 flex flex-col justify-center items-center w-full relative ml-4" onMouseDown={(e) => { e.stopPropagation(); setActiveElementId(el.id); }}>
                                                    {isActive && (
                                                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-slate-200 px-3 py-2 flex items-center gap-3 z-50 whitespace-nowrap">
                                                            <button onMouseDown={(e) => { e.preventDefault(); openAnimModal(el, 'element', container.id, column.id); }} className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-indigo-600" title="애니메이션 효과">
                                                                <Wand2 size={14} /> 애니
                                                            </button>
                                                            <div className="w-px h-4 bg-slate-300" />

                                                            <input type="text" value={el.buttonStyles.text} onChange={(e) => updateElementProps(container.id, column.id, el.id, 'buttonStyles', 'text', e.target.value)} className="w-20 text-xs border border-slate-200 rounded px-1 py-1" title="버튼 텍스트" />
                                                            <input type="color" value={el.buttonStyles.backgroundColor} onChange={(e) => updateElementProps(container.id, column.id, el.id, 'buttonStyles', 'backgroundColor', e.target.value)} className="w-5 h-5 cursor-pointer" title="버튼 배경색" />
                                                            
                                                            <div className="w-px h-4 bg-slate-300" />

                                                            <div className="flex items-center gap-1" title="버튼 클릭 시 이동할 URL">
                                                                <LinkIcon size={14} className="text-slate-400" />
                                                                <input
                                                                    type="text"
                                                                    placeholder="https://..."
                                                                    value={(el.buttonStyles as any).linkUrl || ""}
                                                                    onChange={(e) => updateElementProps(container.id, column.id, el.id, 'buttonStyles', 'linkUrl', e.target.value)}
                                                                    className="w-36 text-xs border border-slate-200 rounded px-1.5 py-1 outline-none focus:border-indigo-500"
                                                                />
                                                            </div>

                                                            <div className="w-px h-4 bg-slate-300" />
                                                            <button onClick={() => deleteElement(container.id, column.id, el.id)} className="text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
                                                        </div>
                                                    )}

                                                    <a
                                                        href={(el.buttonStyles as any).linkUrl || "#"}
                                                        onClick={(e) => e.preventDefault()}
                                                        style={{
                                                            backgroundColor: el.buttonStyles.backgroundColor,
                                                            color: el.buttonStyles.color,
                                                            fontSize: `${el.buttonStyles.fontSize}px`,
                                                            width: String(el.buttonStyles.width) === "auto" ? "auto" : `${el.buttonStyles.width}px`,
                                                            borderRadius: `${el.buttonStyles.borderRadius}px`,
                                                            display: 'inline-flex',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            textDecoration: 'none'
                                                        }}
                                                        className="px-6 py-2 shadow font-bold mx-auto cursor-pointer"
                                                    >
                                                        {el.buttonStyles.text}
                                                    </a>
                                                </div>
                                            )}

                                            {/* 6. SEPARATOR Element */}
                                            {el.type === "SEPARATOR" && (
                                                <div className="w-full h-4 border-b-2 border-dashed border-slate-300 relative group ml-4" onMouseDown={(e) => { e.stopPropagation(); setActiveElementId(el.id); }}>
                                                    {isActive && (
                                                        <div className="absolute -top-10 right-0 bg-white rounded shadow border px-2 py-1 flex gap-2">
                                                            <button onClick={(e) => { e.stopPropagation(); openAnimModal(el, 'element', container.id, column.id); }} className="text-slate-500 hover:text-indigo-600"><Wand2 size={14} /></button>
                                                            <button onClick={() => deleteElement(container.id, column.id, el.id)} className="text-slate-500 hover:text-red-500"><Trash2 size={14} /></button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* 7. TABLE Element */}
                                            {el.type === "TABLE" && el.tableData && (
                                                <div
                                                    className="relative w-full overflow-x-auto pt-8 pb-4 ml-4"
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        setActiveElementId(el.id);
                                                    }}
                                                >
                                                    {isActive && (
                                                        <div className="absolute top-0 left-0 bg-white rounded-lg shadow-xl border border-slate-200 px-3 py-1.5 flex items-center gap-3 z-50">
                                                            <button onMouseDown={(e) => { e.preventDefault(); openAnimModal(el, 'element', container.id, column.id); }} className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-indigo-600" title="애니메이션 효과">
                                                                <Wand2 size={14} /> 애니
                                                            </button>
                                                            <div className="w-px h-4 bg-slate-300" />

                                                            {selectedCells.size > 1 && (
                                                                <button onClick={() => mergeCells(container.id, column.id, el.id, el.tableData!)} className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800">
                                                                    <Merge size={14} /> 병합
                                                                </button>
                                                            )}
                                                            {selectedCells.size === 1 && (el.tableData!.cells[Array.from(selectedCells)[0]]?.rowSpan > 1 || el.tableData!.cells[Array.from(selectedCells)[0]]?.colSpan > 1) && (
                                                                <button onClick={() => unmergeCells(container.id, column.id, el.id, Array.from(selectedCells)[0], el.tableData!)} className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-800">
                                                                    <Split size={14} /> 해제
                                                                </button>
                                                            )}
                                                            <div className="w-px h-4 bg-slate-300" />
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[10px] font-bold text-slate-500">선 굵기</span>
                                                                <input
                                                                    type="number" min="0" max="10"
                                                                    value={getCommonBorderWidth(el.tableData!)}
                                                                    onChange={(e) => applyToTableCells(container.id, column.id, el.id, el.tableData!, 'borderWidth', Number(e.target.value))}
                                                                    className="w-10 text-center text-xs border border-slate-200 rounded py-0.5 outline-none"
                                                                />
                                                            </div>
                                                            <div className="w-px h-4 bg-slate-300" />
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[10px] font-bold text-slate-500">선 색상</span>
                                                                <input
                                                                    type="color"
                                                                    value={getCommonBorderColor(el.tableData!)}
                                                                    onChange={(e) => applyToTableCells(container.id, column.id, el.id, el.tableData!, 'borderColor', e.target.value)}
                                                                    className="w-5 h-5 p-0 border-none rounded cursor-pointer"
                                                                />
                                                            </div>
                                                            <div className="w-px h-4 bg-slate-300" />
                                                            <label className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-indigo-600 cursor-pointer" title="선택한 셀에 이미지 삽입">
                                                                <ImageIcon size={14} />
                                                                <span>이미지</span>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (!file) return;
                                                                        if (selectedCells.size === 0) {
                                                                            alert("이미지를 삽입할 테이블 셀을 먼저 선택해주세요.");
                                                                            return;
                                                                        }
                                                                        const fileUrl = URL.createObjectURL(file);
                                                                        const newCells = { ...el.tableData!.cells };
                                                                        selectedCells.forEach(cellKey => {
                                                                            if (newCells[cellKey]) {
                                                                                newCells[cellKey].content = `<img src="${fileUrl}" alt="table-img" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" />`;
                                                                                newCells[cellKey].file = file
                                                                            }
                                                                        });
                                                                        updateElementProps(container.id, column.id, el.id, 'tableData', 'cells', newCells);
                                                                    }}
                                                                />
                                                            </label>
                                                            <div className="w-px h-4 bg-slate-300" />
                                                            <button
                                                                onMouseDown={(e) => e.preventDefault()}
                                                                onClick={() => {
                                                                    if (selectedCells.size === 0) {
                                                                        alert("링크를 걸 테이블 셀을 먼저 선택해주세요.");
                                                                        return;
                                                                    }
                                                                    const url = window.prompt("선택한 셀에 연결할 웹사이트 주소를 입력하세요:", "https://");
                                                                    if (!url) return;
                                                                    const newCells = { ...el.tableData!.cells };
                                                                    selectedCells.forEach(cellKey => {
                                                                        if (newCells[cellKey]) {
                                                                            const currentContent = newCells[cellKey].content;
                                                                            newCells[cellKey].content = `<a href="${url}" target="_blank" style="text-decoration: underline; color: #1e88e5;">${currentContent || '링크'}</a>`;
                                                                        }
                                                                    });
                                                                    updateElementProps(container.id, column.id, el.id, 'tableData', 'cells', newCells);
                                                                }}
                                                                className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-indigo-600"
                                                                title="선택한 셀 전체에 링크 씌우기"
                                                            >
                                                                <LinkIcon size={14} />
                                                                <span>링크</span>
                                                            </button>
                                                            <div className="w-px h-4 bg-slate-300" />
                                                            {selectedCells.size === 0 && <span className="text-[10px] text-slate-400 font-bold ml-1">셀을 드래그하여 병합</span>}
                                                            <div className="w-px h-4 bg-slate-300 ml-auto" />
                                                            <button onClick={() => deleteElement(container.id, column.id, el.id)} className="text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
                                                        </div>
                                                    )}
                                                    <table className={`w-full border-collapse bg-white ${isActive ? 'outline outline-2 outline-offset-2 outline-[#00d0d0]' : ''}`}>
                                                        <tbody>
                                                            {Array.from({ length: el.tableData!.rows }).map((_, r) => (
                                                                <tr key={r}>
                                                                    {Array.from({ length: el.tableData!.cols }).map((_, c) => {
                                                                        const cellKey = `${r}-${c}`;
                                                                        const cell = el.tableData!.cells[cellKey];
                                                                        if (!cell || !cell.isVisible) return null;
                                                                        const isSelected = selectedCells.has(cellKey);
                                                                        return (
                                                                            <td
                                                                                key={cellKey}
                                                                                rowSpan={cell.rowSpan}
                                                                                colSpan={cell.colSpan}
                                                                                onMouseDown={(e) => {
                                                                                    setActiveElementId(el.id);
                                                                                    if ((e.target as HTMLElement).tagName === 'TD' || (e.target as HTMLElement).tagName === 'TABLE') {
                                                                                        setIsDraggingCell(true);
                                                                                        setSelectedCells(new Set([cellKey]));
                                                                                    }
                                                                                }}
                                                                                onMouseEnter={() => {
                                                                                    if (isDraggingCell) setSelectedCells(prev => new Set(prev).add(cellKey));
                                                                                }}
                                                                                className={`p-2 min-w-[50px] transition-colors ${isSelected ? 'bg-indigo-100/60 outline outline-2 outline-indigo-500 z-10' : 'bg-white'}`}
                                                                                style={{
                                                                                    textAlign: cell.textAlign,
                                                                                    borderWidth: `${cell.borderWidth ?? 1}px`,
                                                                                    borderColor: cell.borderColor ?? '#cbd5e1',
                                                                                    borderStyle: 'solid'
                                                                                }}
                                                                            >
                                                                                <div
                                                                                    id={`editable-${el.id}-${cellKey}`}
                                                                                    contentEditable
                                                                                    suppressContentEditableWarning
                                                                                    className="outline-none min-h-[20px] cursor-text"
                                                                                    onClick={(e) => handleInlineImgClick(e, el.id, cellKey)} // 💡 테이블 내 인라인 이미지 감지
                                                                                    onMouseDown={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setActiveElementId(el.id);
                                                                                    }}
                                                                                    onBlur={(e) => {
                                                                                        if (e.relatedTarget && ((e.relatedTarget as HTMLElement).closest('.element-toolbar') || (e.relatedTarget as HTMLElement).closest('.inline-img-toolbar'))) {
                                                                                            return;
                                                                                        }
                                                                                        const newCells = { ...el.tableData!.cells };
                                                                                        newCells[cellKey].content = e.currentTarget.innerHTML;
                                                                                        updateElementProps(container.id, column.id, el.id, 'tableData', 'cells', newCells);
                                                                                    }}
                                                                                    dangerouslySetInnerHTML={{ __html: cell.content }}
                                                                                />
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}

                                            {/* 9. CARD Element */}
                                            {el.type === "CARD" && el.cardData && (
                                                <div className="w-full relative ml-4" onMouseDown={(e) => { e.stopPropagation(); setActiveElementId(el.id); }}>
                                                    {isActive && (
                                                        <div className="absolute -top-16 left-0 bg-white rounded-lg shadow-xl border border-slate-200 px-3 py-2 flex items-center gap-2 z-50 whitespace-nowrap overflow-x-auto element-toolbar">

                                                            <button
                                                                onMouseDown={(e) => toggleHtmlMode(e, el.id)}
                                                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors ${htmlModeElements[el.id] ? 'bg-slate-800 text-green-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                                                title="HTML 소스 직접 편집"
                                                            >
                                                                <Code size={14} /> HTML
                                                            </button>
                                                            <div className="w-px h-4 bg-slate-300" />

                                                            <button onMouseDown={(e) => { e.preventDefault(); openAnimModal(el, 'element', container.id, column.id); }} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600" title="애니메이션 효과">
                                                                <Wand2 size={14} /> 애니
                                                            </button>
                                                            <div className="w-px h-4 bg-slate-300" />

                                                            <button onClick={() => updateElementProps(container.id, column.id, el.id, 'cardData', 'layout', el.cardData!.layout === 'row' ? 'col' : 'row')} className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded font-bold text-slate-700">
                                                                {el.cardData.layout === 'row' ? '좌우 모드' : '위아래 모드'}
                                                            </button>
                                                            <div className="w-px h-4 bg-slate-300" />
                                                            <label className="text-xs font-bold text-indigo-600 cursor-pointer flex items-center gap-1">
                                                                <ImageIcon size={14} /> 아이콘
                                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        const url = URL.createObjectURL(file);
                                                                        setContainers(containers.map(c => c.id === container.id ? {
                                                                            ...c, columns: c.columns.map(col => col.id === column.id ? {
                                                                                ...col, elements: col.elements.map(element => element.id === el.id ? {
                                                                                    ...element, file: file, cardData: { ...element.cardData!, iconUrl: url }
                                                                                } : element)
                                                                            } : col)
                                                                        } : c));
                                                                    }
                                                                }} />
                                                            </label>
                                                            <div className="w-px h-4 bg-slate-300" />
                                                            <select
                                                                value={el.styles?.fontFamily || "default"}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    const isApplied = applyStyleToSelection('fontFamily', val);
                                                                    if (!isApplied) updateElementStyle(container.id, column.id, el.id, "fontFamily", val);
                                                                }}
                                                                className="border border-slate-200 rounded p-1 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                                                            >
                                                                <option value="default">기본 폰트</option>
                                                                <option value="var(--font-noto-sans)">Noto Sans KR</option>
                                                                <option value="var(--font-nanum-gothic)">나눔고딕</option>
                                                                <option value="var(--font-gothic-a1)">Gothic A1</option>
                                                                <option value="var(--font-black-han-sans)">검은고딕</option>
                                                                <option value="var(--font-nanum-myeongjo)">나눔명조</option>
                                                                <option value="var(--font-gowun-batang)">고운바탕</option>
                                                                <option value="var(--font-jua)">주아체</option>
                                                                <option value="var(--font-do-hyeon)">도현체</option>
                                                                <option value="var(--font-nanum-pen-script)">나눔손글씨 펜</option>
                                                            </select>
                                                            <div className="flex items-center gap-1">
                                                                <input
                                                                    key={`font-size-${el.id}`}
                                                                    type="number"
                                                                    defaultValue={el.styles?.fontSize || 16}
                                                                    onChange={(e) => {
                                                                        const val = Number(e.target.value);
                                                                        const isApplied = applyStyleToSelection('fontSize', val);
                                                                        if (!isApplied) {
                                                                            updateElementStyle(container.id, column.id, el.id, "fontSize", val);
                                                                        }
                                                                    }}
                                                                    className="w-12 text-center text-xs font-bold border border-slate-200 rounded outline-none py-1"
                                                                />
                                                                <span className="text-[10px] text-slate-400">px</span>
                                                            </div>
                                                            <input
                                                                type="color"
                                                                value={el.styles?.color || "#000000"}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    const isApplied = applyStyleToSelection('color', val);
                                                                    if (!isApplied) updateElementStyle(container.id, column.id, el.id, "color", val);
                                                                }}
                                                                className="w-5 h-5 p-0 border-none rounded cursor-pointer"
                                                                title="글자 색상"
                                                            />
                                                            <div className="w-px h-4 bg-slate-300" />
                                                            <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded">
                                                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => updateElementStyle(container.id, column.id, el.id, "textAlign", "left")} className={`p-1 rounded ${el.styles?.textAlign === 'left' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="좌측 정렬"><AlignLeft size={14} /></button>
                                                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => updateElementStyle(container.id, column.id, el.id, "textAlign", "center")} className={`p-1 rounded ${el.styles?.textAlign === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="가운데 정렬"><AlignCenter size={14} /></button>
                                                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => updateElementStyle(container.id, column.id, el.id, "textAlign", "right")} className={`p-1 rounded ${el.styles?.textAlign === 'right' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="우측 정렬"><AlignRight size={14} /></button>
                                                            </div>
                                                            <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded">
                                                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => updateElementProps(container.id, column.id, el.id, 'cardData', 'verticalAlign', 'flex-start')} className={`p-1.5 rounded text-xs font-bold ${el.cardData?.verticalAlign === 'flex-start' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="상단 정렬">상</button>
                                                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => updateElementProps(container.id, column.id, el.id, 'cardData', 'verticalAlign', 'center')} className={`p-1.5 rounded text-xs font-bold ${el.cardData?.verticalAlign === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="중앙 정렬">중</button>
                                                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => updateElementProps(container.id, column.id, el.id, 'cardData', 'verticalAlign', 'flex-end')} className={`p-1.5 rounded text-xs font-bold ${el.cardData?.verticalAlign === 'flex-end' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="하단 정렬">하</button>
                                                            </div>
                                                            <div className="w-px h-4 bg-slate-300" />
                                                            <button onClick={() => deleteElement(container.id, column.id, el.id)} className="text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
                                                        </div>
                                                    )}

                                                    {htmlModeElements[el.id] ? (
                                                        <textarea
                                                            value={el.content}
                                                            onMouseDown={(e) => { e.stopPropagation(); setActiveElementId(el.id); }}
                                                            onChange={(e) => updateElementHtmlContent(el.id, e.target.value)}
                                                            className="w-full min-h-[200px] p-4 bg-slate-900 text-green-400 font-mono text-sm leading-relaxed rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                                                            placeholder="HTML 코드를 입력하세요..."
                                                        />
                                                    ) : (
                                                        <div
                                                            style={{
                                                                borderStyle: 'solid',
                                                                borderWidth: `${el.cardData.borderWidth}px`,
                                                                borderColor: el.cardData.borderColor,
                                                                backgroundColor: el.cardData.backgroundColor,
                                                                borderRadius: `${el.cardData.borderRadius}px`,
                                                                padding: `${el.cardData.padding}px`,
                                                                alignItems: el.cardData.layout === 'col'
                                                                    ? (el.styles?.textAlign === 'center' ? 'center' : el.styles?.textAlign === 'right' ? 'flex-end' : 'flex-start')
                                                                    : (el.cardData.verticalAlign || 'center')
                                                            }}
                                                            className={`w-full transition-all flex gap-4 ${el.cardData.layout === 'col' ? 'flex-col items-start' : 'flex-row items-center'} ${el.cardData.shadow !== 'none' ? `shadow-${el.cardData.shadow}` : ''} ${isActive ? 'outline outline-2 outline-[#00d0d0]' : ''}`}
                                                        >
                                                            {el.cardData.iconUrl && (
                                                                <div className="flex-shrink-0 relative group">
                                                                    <img src={el.cardData.iconUrl} style={{ width: el.cardData.iconSize, height: el.cardData.iconSize }} className="object-contain" alt="icon" />
                                                                    <button
                                                                        onClick={() => updateElementProps(container.id, column.id, el.id, 'cardData', 'iconUrl', '')}
                                                                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full text-[10px] hidden group-hover:block"
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                            <div className="flex-grow w-full relative">
                                                                <div
                                                                    id={`editable-${el.id}`}
                                                                    contentEditable
                                                                    suppressContentEditableWarning
                                                                    onClick={(e) => handleInlineImgClick(e, el.id)} // 💡 인라인 이미지 클릭 감지
                                                                    onMouseUp={handleSelection}
                                                                    onKeyUp={handleSelection}
                                                                    style={{
                                                                        fontSize: el.styles?.fontSize ? `${el.styles.fontSize}px` : '16px',
                                                                        color: el.styles?.color || '#000000',
                                                                        textAlign: el.styles?.textAlign || 'left',
                                                                        fontFamily: el.styles?.fontFamily && el.styles.fontFamily !== 'default' ? el.styles.fontFamily : 'inherit',
                                                                        fontWeight: el.styles?.fontWeight || 'normal',
                                                                        fontStyle: el.styles?.fontStyle || 'normal',
                                                                        textDecoration: el.styles?.textDecoration || 'none',
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        if (e.relatedTarget && ((e.relatedTarget as HTMLElement).closest('.element-toolbar') || (e.relatedTarget as HTMLElement).closest('.inline-img-toolbar'))) {
                                                                            return;
                                                                        }
                                                                        updateElementHtmlContent(el.id, e.currentTarget.innerHTML);
                                                                    }}
                                                                    className="outline-none min-h-[50px] cursor-text w-full break-words"
                                                                    dangerouslySetInnerHTML={{ __html: el.content }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                <button
                                    onClick={() => setElementModalOpen({ containerId: container.id, columnId: column.id })}
                                    className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 text-slate-400 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition p-4 bg-white mt-auto"
                                >
                                    <Plus size={16} /> <span className="text-sm font-bold">Element</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div className="flex justify-end mt-4 gap-2">
                {setAiModalOpen && (
                    <button
                        onClick={() => setAiModalOpen('PAGE')}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold rounded shadow-sm hover:opacity-90 transition-opacity"
                    >
                        <Sparkles size={16} /> AI로 요소 생성
                    </button>
                )}
                <button
                    onClick={() => setLayoutModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 text-sm font-bold rounded shadow-sm"
                >
                    <Plus size={16} /> Container
                </button>
            </div>

            {/* 💡 HTML 본문 안에 있는 이미지를 눌렀을 때 나타나는 독립된 툴바 */}
            {/* 💡 HTML 본문 안에 있는 이미지를 눌렀을 때 나타나는 독립된 툴바 */}
            {selectedInlineImg && (
                <div
                    className="fixed z-[9999] flex items-center gap-2 bg-white rounded shadow-2xl border border-slate-300 p-1.5 inline-img-toolbar"
                    style={{ top: selectedInlineImg.top - 50, left: selectedInlineImg.left }}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation(); // 💡 마우스 이벤트가 배경으로 전달되는 것 방지
                    }}
                    onClick={(e) => e.stopPropagation()} // 💡 핵심 원인 해결: 클릭 이벤트 버블링 방지
                >
                    <label className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded cursor-pointer hover:bg-indigo-700 text-xs font-bold transition-colors shadow">
                        <ImagePlus size={14} /> 이미지 변경
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && selectedInlineImg) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                        if (event.target?.result) {
                                            const newImageUrl = event.target.result as string;
                                            const { elId, cellKey, node } = selectedInlineImg;
                                            const oldSrc = node.src; // 기존 이미지의 주소

                                            // React 상태(containers)를 직접 업데이트하여 안전하게 반영
                                            setContainers(containers.map(container => ({
                                                ...container,
                                                columns: container.columns.map(col => ({
                                                    ...col,
                                                    elements: col.elements.map(el => {
                                                        if (el.id === elId) {
                                                            // 1. 테이블 셀 내부인 경우
                                                            if (cellKey && el.tableData) {
                                                                const newCells = { ...el.tableData.cells };
                                                                if (newCells[cellKey]) {
                                                                    const parser = new DOMParser();
                                                                    const doc = parser.parseFromString(newCells[cellKey].content, 'text/html');
                                                                    const imgs = Array.from(doc.querySelectorAll('img'));
                                                                    const targetImg = imgs.find(img => img.src === oldSrc) || imgs[0];
                                                                    if (targetImg) {
                                                                        targetImg.setAttribute('src', newImageUrl);
                                                                        newCells[cellKey].content = doc.body.innerHTML;
                                                                        newCells[cellKey].file = file; // 💡 파일 객체 저장 연동
                                                                    }
                                                                }
                                                                return { ...el, tableData: { ...el.tableData, cells: newCells } };
                                                            } 
                                                            // 2. 일반 TEXT 또는 CARD 엘리먼트 내부인 경우
                                                            else {
                                                                const parser = new DOMParser();
                                                                const doc = parser.parseFromString(el.content, 'text/html');
                                                                const imgs = Array.from(doc.querySelectorAll('img'));
                                                                const targetImg = imgs.find(img => img.src === oldSrc) || imgs[0];
                                                                if (targetImg) {
                                                                    targetImg.setAttribute('src', newImageUrl);
                                                                    return { ...el, content: doc.body.innerHTML, file: file }; // 💡 파일 객체 저장 연동
                                                                }
                                                            }
                                                        }
                                                        return el;
                                                    })
                                                }))
                                            })));

                                            setSelectedInlineImg(null); // 업데이트 후 툴바 닫기
                                        }
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                    </label>
                    <button
                        onClick={() => {
                            const { elId, cellKey, node } = selectedInlineImg;
                            const oldSrc = node.src;

                            // 삭제 로직도 동일하게 상태를 직접 업데이트
                            setContainers(containers.map(container => ({
                                ...container,
                                columns: container.columns.map(col => ({
                                    ...col,
                                    elements: col.elements.map(el => {
                                        if (el.id === elId) {
                                            if (cellKey && el.tableData) {
                                                const newCells = { ...el.tableData.cells };
                                                if (newCells[cellKey]) {
                                                    const parser = new DOMParser();
                                                    const doc = parser.parseFromString(newCells[cellKey].content, 'text/html');
                                                    const imgs = Array.from(doc.querySelectorAll('img'));
                                                    const targetImg = imgs.find(img => img.src === oldSrc) || imgs[0];
                                                    if (targetImg) targetImg.remove();
                                                    newCells[cellKey].content = doc.body.innerHTML;
                                                }
                                                return { ...el, tableData: { ...el.tableData, cells: newCells } };
                                            } else {
                                                const parser = new DOMParser();
                                                const doc = parser.parseFromString(el.content, 'text/html');
                                                const imgs = Array.from(doc.querySelectorAll('img'));
                                                const targetImg = imgs.find(img => img.src === oldSrc) || imgs[0];
                                                if (targetImg) targetImg.remove();
                                                return { ...el, content: doc.body.innerHTML };
                                            }
                                        }
                                        return el;
                                    })
                                }))
                            })));

                            setSelectedInlineImg(null); // 삭제 후 툴바 닫기
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-bold transition-colors shadow"
                    >
                        <Trash2 size={14} /> 이미지 삭제
                    </button>
                    <div className="w-px h-5 bg-slate-300 mx-1" />
                    <button onClick={() => setSelectedInlineImg(null)} className="p-1 text-slate-500 hover:text-slate-800 rounded">
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}