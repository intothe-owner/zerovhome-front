// src/app/admin/pages/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
    Save, LayoutTemplate, Trash2, Edit2, Copy,
    Type, Image as ImageIcon, Video, Square, Minus, X, Link as LinkIcon, Upload, Music,
    AlignLeft, AlignCenter, AlignRight, AlignJustify, Box,
    Plus, Table as TableIcon, Merge, Split, Film, Wand2,
    Bold, Italic, Underline
} from "lucide-react";

// --- 타입 정의 ---
type ElementType = "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "BUTTON" | "SEPARATOR" | "TABLE" | "CARD";
interface CardData {
    layout: "row" | "col";         // row: 좌(아이콘)-우(내용) / col: 상(아이콘)-하(내용)
    iconUrl: string;               // 업로드된 아이콘 이미지 URL
    iconSize: number;              // 아이콘 크기 (기본값 48px 등)
    animation: "none" | "fadeIn" | "slideUp" | "zoomIn"; // 개별 카드 애니메이션
    backgroundColor: string;
    borderWidth: number;
    borderColor: string;
    borderRadius: number;
    shadow: "none" | "sm" | "md" | "lg" | "xl";
    padding: number;
    verticalAlign?: "flex-start" | "center" | "flex-end";
}
interface TextStyles {
    fontFamily: string;
    fontSize: number;
    color: string;
    textAlign: "left" | "center" | "right" | "justify";
    layerAlign: "flex-start" | "center" | "flex-end";
    linkUrl: string;
    width?: number | "auto";
    height?: number | "auto";
    fontWeight?: "normal" | "bold";
    fontStyle?: "normal" | "italic";
    textDecoration?: "none" | "underline";
}

interface ButtonStyles {
    text: string;
    backgroundColor: string;
    color: string;
    fontSize: number;
    width: number;
    borderRadius: number;
    layerAlign: "flex-start" | "center" | "flex-end";
}

interface TableCell {
    row: number;
    col: number;
    content: string;
    rowSpan: number;
    colSpan: number;
    isVisible: boolean;
    textAlign: "left" | "center" | "right";
    borderWidth?: number;
    borderColor?: string;
    file?: File;
}

interface TableData {
    rows: number;
    cols: number;
    cells: Record<string, TableCell>;
}

interface ElementNode {
    id: string;
    type: ElementType;
    content: string;
    styles?: TextStyles;
    buttonStyles?: ButtonStyles;
    cardData?: CardData;
    tableData?: TableData;
    file?: File; // 👈 백엔드로 전송할 실제 파일 객체 추가
}

interface ColumnNode {
    id: string;
    width: string;
    elements: ElementNode[];
}
interface AnimationConfig {
    type: "none" | "fadeIn" | "slideUp" | "slideDown" | "slideLeft" | "slideRight" | "zoomIn";
    duration: number;
    delay: number;
}
interface ContainerNode {
    id: string;
    columns: ColumnNode[];
    animation?: AnimationConfig;
}

interface MenuType {
    id: number;
    name: string;
    depth: number;
    parentId: number | null;
    order: number;
    url: string;
}

interface SlideItem {
    type: "image" | "video";
    mediaUrl: string;
    titleHtml: string;
    descHtml: string;
    titleStyle: { fontSize: number; color: string; fontFamily: string; textAlign: "left" | "center" | "right" };
    descStyle: { fontSize: number; color: string; fontFamily: string; textAlign: "left" | "center" | "right" };
    file?: File; // 👈 슬라이드용 실제 파일 객체 추가
}

export default function VisualPageBuilder() {
    const [title, setTitle] = useState("");
    const [selectedMenuId, setSelectedMenuId] = useState<string>("");
    const [menus, setMenus] = useState<MenuType[]>([]);
    const [containers, setContainers] = useState<ContainerNode[]>([]);

    const [sliderType, setSliderType] = useState<"none" | "image" | "video">("none");
    const [pageId, setPageId] = useState<number | null>(null);

    const [pageMeta, setPageMeta] = useState({ bgImage: '', bgTitle: '' });
    const [metaBgFile, setMetaBgFile] = useState<File | null>(null);

    const defaultSlide: SlideItem = {
        type: "image",
        mediaUrl: "",
        titleHtml: "",
        descHtml: "",
        titleStyle: { fontSize: 24, color: "#1e293b", fontFamily: "default", textAlign: "left" },
        descStyle: { fontSize: 16, color: "#64748b", fontFamily: "default", textAlign: "left" }
    };
    const [slides, setSlides] = useState<SlideItem[]>([]);

    const [activeSlideFocus, setActiveSlideFocus] = useState<{ index: number; field: 'title' | 'desc' } | null>(null);
    const [activeElementId, setActiveElementId] = useState<string | null>(null);
    const savedRangeRef = useRef<Range | null>(null);

    const [layoutModalOpen, setLayoutModalOpen] = useState(false);
    const [elementModalOpen, setElementModalOpen] = useState<{ containerId: string; columnId: string } | null>(null);
    const [tableConfigModalOpen, setTableConfigModalOpen] = useState<{ containerId: string; columnId: string } | null>(null);
    const [tableInputs, setTableInputs] = useState({ rows: 3, cols: 3 });
    const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
    const [isDraggingCell, setIsDraggingCell] = useState(false);

    const [animModalOpen, setAnimModalOpen] = useState<string | null>(null);
    const [tempAnim, setTempAnim] = useState<AnimationConfig>({ type: "none", duration: 0.5, delay: 0 });

    const openAnimModal = (container: ContainerNode) => {
        setTempAnim(container.animation || { type: "none", duration: 0.5, delay: 0 });
        setAnimModalOpen(container.id);
    };

    const saveAnimConfig = () => {
        if (animModalOpen) {
            setContainers(containers.map(c =>
                c.id === animModalOpen ? { ...c, animation: tempAnim } : c
            ));
            setAnimModalOpen(null);
        }
    };

    useEffect(() => {
        const handleDocumentSelectionChange = () => {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
                const range = selection.getRangeAt(0);
                if (activeElementId) {
                    const editableDiv = document.getElementById(`editable-${activeElementId}`);
                    if (editableDiv && editableDiv.contains(range.commonAncestorContainer)) {
                        savedRangeRef.current = range.cloneRange();
                    }
                }
            }
        };

        document.addEventListener("selectionchange", handleDocumentSelectionChange);
        return () => {
            document.removeEventListener("selectionchange", handleDocumentSelectionChange);
        };
    }, [activeElementId]);

    useEffect(() => {
        const fetchMenus = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/menus`);
                const json = await res.json();
                if (json.success) {
                    const flatMenus = json.data;
                    const map: Record<number, any> = {};
                    const roots: any[] = [];

                    flatMenus.forEach((m: any) => { map[m.id] = { ...m, children: [] }; });
                    flatMenus.forEach((m: any) => {
                        if (m.parentId && map[m.parentId]) {
                            map[m.parentId].children.push(map[m.id]);
                        } else {
                            roots.push(map[m.id]);
                        }
                    });

                    const sortTree = (nodes: any[]) => {
                        nodes.sort((a, b) => a.order - b.order);
                        nodes.forEach((node) => {
                            if (node.children && node.children.length > 0) sortTree(node.children);
                        });
                    };
                    sortTree(roots);

                    const flattened: any[] = [];
                    const flatten = (nodes: any[]) => {
                        nodes.forEach(node => {
                            flattened.push(node);
                            if (node.children && node.children.length > 0) {
                                flatten(node.children);
                            }
                        });
                    };
                    flatten(roots);

                    setMenus(flattened);
                }
            } catch (error) {
                console.error("메뉴 로딩 실패", error);
            }
        };
        fetchMenus();
    }, []);

    const loadPageData = async (menuId: string) => {
        if (menuId === "") {
            setPageId(null);
            setTitle("");
            setContainers([]);
            setSlides([]); // 👈 비우기
            setSliderType("none"); // 👈 사용 안 함
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pages/`);
            const json = await res.json();

            if (json.success) {
                const targetMenuId = menuId === "0" ? null : Number(menuId);
                const targetMenu = menus.find(m => m.id === targetMenuId);
                let page = undefined;

                if (targetMenu && targetMenu.url) {
                    const sharedMenuIds = menus.filter(m => m.url === targetMenu.url).map(m => m.id);
                    page = json.data.find((p: any) => p.menuId !== null && sharedMenuIds.includes(p.menuId));
                } else {
                    page = json.data.find((p: any) => p.menuId === targetMenuId);
                }

                if (page) {
                    setPageId(page.id);
                    setTitle(page.title);
                    setContainers(page.contentBlocks || []);
                    if (page.sliderData && page.sliderData.length > 0) {
                        setSlides(page.sliderData);
                        setSliderType(page.sliderData[0].type || "image");
                    } else {
                        setSlides([]); // 👈 비우기
                        setSliderType("none"); // 👈 사용 안 함
                    }
                } else {
                    setPageId(null);
                    setTitle("");
                    setContainers([]);
                    setSlides([]); // 👈 비우기
                    setSliderType("none"); // 👈 사용 안 함
                }
            }
        } catch (error) {
            console.error("페이지 데이터 불러오기 실패:", error);
        }
    };

    const handleBoardClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.element-box') || (e.target as HTMLElement).closest('.slide-box')) return;
        setActiveElementId(null);
        setActiveSlideFocus(null);
        setSelectedCells(new Set());
    };

    const addContainer = (layoutStr: string) => {
        const widths = layoutStr.split("+");
        const newColumns: ColumnNode[] = widths.map((w) => ({
            id: Math.random().toString(36).substr(2, 9), width: w, elements: [],
        }));
        setContainers([...containers, { id: Math.random().toString(36).substr(2, 9), columns: newColumns }]);
        setLayoutModalOpen(false);
    };

    const addElement = (type: ElementType) => {
        if (!elementModalOpen) return;
        const { containerId, columnId } = elementModalOpen;

        const newElement: ElementNode = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            content: type === "TEXT" ? "제목을 입력해주세요." : "",
            styles: type === "TEXT" ? {
                fontFamily: "default",
                fontSize: 32,
                color: "#000000",
                textAlign: "left",
                layerAlign: "flex-start",
                linkUrl: "",
                width: "auto",
                height: "auto",
                fontWeight: "normal",
                fontStyle: "normal"
            } : undefined
        };

        setContainers(containers.map(container =>
            container.id === containerId ? {
                ...container,
                columns: container.columns.map(col =>
                    col.id === columnId ? { ...col, elements: [...col.elements, newElement] } : col
                )
            } : container
        ));
        setElementModalOpen(null);
    };

    const updateElementProps = (containerId: string, columnId: string, elementId: string, propCategory: 'styles' | 'buttonStyles' | 'tableData' | 'cardData', key: string, value: any) => {
        setContainers(containers.map(container =>
            container.id === containerId ? {
                ...container,
                columns: container.columns.map(col => col.id === columnId ? {
                    ...col,
                    elements: col.elements.map(el => el.id === elementId ? {
                        ...el, [propCategory]: { ...(el[propCategory] as any), [key]: value }
                    } : el)
                } : col)
            } : container
        ));
    };

    const updateElementStyle = (containerId: string, columnId: string, elementId: string, key: keyof TextStyles, value: any) => {
        updateElementProps(containerId, columnId, elementId, 'styles', key, value);
    };

    const applyStyleToSelection = (styleType: 'fontSize' | 'color' | 'fontFamily' | 'fontWeight' | 'fontStyle' | 'textDecoration' | 'link', value: any) => {
        const range = savedRangeRef.current;
        if (!range || !activeElementId) return false; // 드래그 영역이 없으면 false 반환

        try {
            // 링크인 경우 <a> 태그를, 그 외 스타일은 <span> 태그를 생성합니다.
            const wrapper = document.createElement(styleType === 'link' ? 'a' : 'span');

            if (styleType === 'link') {
                (wrapper as HTMLAnchorElement).href = value;
                (wrapper as HTMLAnchorElement).target = "_blank"; // 새 창 열기
                wrapper.style.textDecoration = "underline";
                wrapper.style.color = "#1e88e5"; // 링크 기본 색상
            } else {
                if (styleType === 'fontSize') wrapper.style.fontSize = `${value}px`;
                if (styleType === 'color') wrapper.style.color = value;
                if (styleType === 'fontFamily' && value !== 'default') wrapper.style.fontFamily = value;
                if (styleType === 'fontWeight') wrapper.style.fontWeight = value;
                if (styleType === 'fontStyle') wrapper.style.fontStyle = value;
                if (styleType === 'textDecoration') wrapper.style.textDecoration = value;
            }

            // 선택한 글자 영역을 생성한 태그(wrapper)로 감싸기
            wrapper.appendChild(range.extractContents());
            range.insertNode(wrapper);

            // 변경된 HTML 내용을 React 상태(state)에 반영
            const editableDiv = document.getElementById(`editable-${activeElementId}`);
            if (editableDiv) {
                updateElementHtmlContent(activeElementId, editableDiv.innerHTML);
            }

            window.getSelection()?.removeAllRanges();
            savedRangeRef.current = null;
            return true; // 부분 적용 성공
        } catch (e) {
            console.error("스타일 적용 오류:", e);
            return false;
        }
    };

    const updateElementHtmlContent = (elementId: string, htmlContent: string) => {
        setContainers(containers.map(container => ({
            ...container,
            columns: container.columns.map(col => ({
                ...col,
                elements: col.elements.map(el => el.id === elementId ? { ...el, content: htmlContent } : el)
            }))
        })));
    };

    // 💡 변경됨: 로컬 URL 뿐만 아니라 File 객체도 함께 저장
    const handleFileUpload = (containerId: string, columnId: string, elementId: string, file: File) => {
        const fileUrl = URL.createObjectURL(file);
        setContainers(containers.map(container =>
            container.id === containerId ? {
                ...container,
                columns: container.columns.map(col =>
                    col.id === columnId ? {
                        ...col,
                        elements: col.elements.map(el =>
                            el.id === elementId ? { ...el, content: fileUrl, file: file } : el
                        )
                    } : col
                )
            } : container
        ));
    };

    const deleteElement = (containerId: string, columnId: string, elementId: string) => {
        setContainers(containers.map(container =>
            container.id === containerId ? {
                ...container,
                columns: container.columns.map(col =>
                    col.id === columnId ? { ...col, elements: col.elements.filter(el => el.id !== elementId) } : col
                )
            } : container
        ));
    };

    const getWidthClass = (width: string) => {
        switch (width) {
            case "1/1": return "w-full"; case "1/2": return "w-1/2"; case "1/3": return "w-1/3";
            case "2/3": return "w-2/3"; case "1/4": return "w-1/4"; case "3/4": return "w-3/4";
            default: return "w-full";
        }
    };

    const handleSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
            savedRangeRef.current = selection.getRangeAt(0).cloneRange();
        } else {
            savedRangeRef.current = null;
        }
    };

    const handleResizeStart = (e: React.MouseEvent, containerId: string, columnId: string, el: ElementNode, direction: string) => {
        e.stopPropagation();
        e.preventDefault();

        const elementNode = document.getElementById(`element-${el.id}`);
        if (!elementNode) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = elementNode.offsetWidth;
        const startHeight = elementNode.offsetHeight;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            let newWidth = startWidth;
            let newHeight = startHeight;

            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            if (direction.includes("e")) newWidth = startWidth + deltaX;
            if (direction.includes("w")) newWidth = startWidth - deltaX;
            if (direction.includes("s")) newHeight = startHeight + deltaY;
            if (direction.includes("n")) newHeight = startHeight - deltaY;

            newWidth = Math.max(50, newWidth);
            newHeight = Math.max(30, newHeight);

            setContainers((prev) =>
                prev.map((container) =>
                    container.id === containerId ? {
                        ...container,
                        columns: container.columns.map((col) =>
                            col.id === columnId ? {
                                ...col,
                                elements: col.elements.map((element) =>
                                    element.id === el.id && element.styles
                                        ? { ...element, styles: { ...element.styles, width: newWidth, height: newHeight } }
                                        : element
                                ),
                            } : col
                        ),
                    } : container
                )
            );
        };

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const openTableConfig = () => {
        if (!elementModalOpen) return;
        setTableConfigModalOpen({ containerId: elementModalOpen.containerId, columnId: elementModalOpen.columnId });
        setElementModalOpen(null);
        setTableInputs({ rows: 3, cols: 3 });
    };

    const confirmTableConfig = () => {
        if (!tableConfigModalOpen) return;
        const { containerId, columnId } = tableConfigModalOpen;
        const { rows, cols } = tableInputs;

        const initialCells: Record<string, TableCell> = {};
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                initialCells[`${r}-${c}`] = {
                    row: r, col: c, content: "",
                    rowSpan: 1, colSpan: 1, isVisible: true, textAlign: "center",
                    borderWidth: 1, borderColor: "#cbd5e1"
                };
            }
        }

        const newElement: ElementNode = {
            id: Math.random().toString(36).substr(2, 9),
            type: "TABLE",
            content: "",
            tableData: { rows, cols, cells: initialCells }
        };

        setContainers(containers.map(container =>
            container.id === containerId ? {
                ...container,
                columns: container.columns.map(col => col.id === columnId ? { ...col, elements: [...col.elements, newElement] } : col)
            } : container
        ));
        setTableConfigModalOpen(null);
    };

    const applyToTableCells = (containerId: string, columnId: string, elementId: string, tableData: TableData, key: keyof TableCell, value: any) => {
        const newCells = { ...tableData.cells };
        const targetKeys = selectedCells.size > 0 ? Array.from(selectedCells) : Object.keys(newCells);
        targetKeys.forEach(k => {
            if (newCells[k]) {
                newCells[k] = { ...newCells[k], [key]: value };
            }
        });
        updateElementProps(containerId, columnId, elementId, 'tableData', 'cells', newCells);
    };

    const getCommonBorderWidth = (tableData: TableData) => {
        const targetKeys = selectedCells.size > 0 ? Array.from(selectedCells) : Object.keys(tableData.cells);
        if (targetKeys.length === 0) return 1;
        return tableData.cells[targetKeys[0]]?.borderWidth ?? 1;
    };

    const getCommonBorderColor = (tableData: TableData) => {
        const targetKeys = selectedCells.size > 0 ? Array.from(selectedCells) : Object.keys(tableData.cells);
        if (targetKeys.length === 0) return '#cbd5e1';
        return tableData.cells[targetKeys[0]]?.borderColor ?? '#cbd5e1';
    };

    const mergeCells = (containerId: string, columnId: string, elementId: string, tableData: TableData) => {
        if (selectedCells.size < 2) return alert("병합할 셀을 2개 이상 선택하세요.");

        let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
        Array.from(selectedCells).forEach(key => {
            const [r, c] = key.split('-').map(Number);
            if (r < minR) minR = r; if (r > maxR) maxR = r;
            if (c < minC) minC = c; if (c > maxC) maxC = c;
        });

        const newCells = { ...tableData.cells };
        const topLeftKey = `${minR}-${minC}`;

        newCells[topLeftKey].rowSpan = maxR - minR + 1;
        newCells[topLeftKey].colSpan = maxC - minC + 1;

        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                if (`${r}-${c}` !== topLeftKey) newCells[`${r}-${c}`].isVisible = false;
            }
        }

        updateElementProps(containerId, columnId, elementId, 'tableData', 'cells', newCells);
        setSelectedCells(new Set());
    };

    const unmergeCells = (containerId: string, columnId: string, elementId: string, cellKey: string, tableData: TableData) => {
        const cell = tableData.cells[cellKey];
        if (!cell || (cell.rowSpan === 1 && cell.colSpan === 1)) return;

        const newCells = { ...tableData.cells };

        for (let r = cell.row; r < cell.row + cell.rowSpan; r++) {
            for (let c = cell.col; c < cell.col + cell.colSpan; c++) {
                newCells[`${r}-${c}`].isVisible = true;
            }
        }

        newCells[cellKey].rowSpan = 1;
        newCells[cellKey].colSpan = 1;

        updateElementProps(containerId, columnId, elementId, 'tableData', 'cells', newCells);
        setSelectedCells(new Set([cellKey]));
    };

    // 💡 변경됨: FormData를 사용하여 JSON 데이터와 바이너리 파일을 한 번에 묶어서 전송
    const handleSave = async () => {
        if (!title.trim()) {
            alert("페이지 제목을 입력해주세요.");
            return;
        }

        const formData = new FormData();
        formData.append("menuId", selectedMenuId === "0" ? "" : selectedMenuId);
        formData.append("title", title);

        const cleanSlides = slides.map(s => {
            const { file, ...rest } = s;
            return rest;
        });

        // 💡 변경됨: 테이블 셀 내부의 file 객체도 함께 제거해주어야 JSON 에러가 안 납니다.
        const cleanContainers = containers.map(c => ({
            ...c,
            columns: c.columns.map(col => ({
                ...col,
                elements: col.elements.map(el => {
                    const { file, ...restEl } = el;
                    if (restEl.type === 'TABLE' && restEl.tableData) {
                        const cleanCells: Record<string, any> = {};
                        Object.keys(restEl.tableData.cells).forEach(k => {
                            const { file: cellFile, ...restCell } = restEl.tableData!.cells[k];
                            cleanCells[k] = restCell;
                        });
                        restEl.tableData = { ...restEl.tableData, cells: cleanCells as any };
                    }
                    return restEl;
                })
            }))
        }));

        formData.append("sliderData", JSON.stringify(cleanSlides));
        formData.append("contentBlocks", JSON.stringify(cleanContainers));
        formData.append("pageMeta", JSON.stringify(pageMeta));
        if (metaBgFile) formData.append("meta_bg_file", metaBgFile);

        slides.forEach((slide, idx) => {
            if (slide.file) formData.append(`slide_file_${idx}`, slide.file);
        });

        // 💡 변경됨: 테이블 내부에 있는 file 객체도 FormData에 담아서 전송
        containers.forEach(container => {
            container.columns.forEach(col => {
                col.elements.forEach(el => {
                    if (el.file) formData.append(`element_file_${el.id}`, el.file);
                    if (el.type === 'TABLE' && el.tableData) {
                        Object.keys(el.tableData.cells).forEach(cellKey => {
                            const cell = el.tableData!.cells[cellKey];
                            if (cell.file) {
                                formData.append(`table_file_${el.id}_${cellKey}`, cell.file);
                            }
                        });
                    }
                });
            });
        });



        try {
            const url = pageId
                ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pages/${pageId}`
                : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pages`;
            const method = pageId ? "PUT" : "POST";

            const res = await fetch(url, {
                method: method,
                // fetch API에서 FormData를 전송할 때는 Content-Type 헤더를 명시적으로 비워두어야 브라우저가 자동으로 boundary를 설정합니다.
                body: formData,
            });

            const json = await res.json();

            if (json.success) {
                alert(pageId ? "페이지가 수정되었습니다." : "새 페이지가 생성되었습니다.");
                await loadPageData(selectedMenuId);
            } else {
                alert("저장 실패: " + json.message);
            }
        } catch (error) {
            console.error("페이지 저장 중 오류 발생:", error);
            alert("서버와 통신 중 오류가 발생했습니다.");
        }
    };

    useEffect(() => {
        loadPageData(selectedMenuId);
    }, [selectedMenuId]);

    return (
        <div className="max-w-6xl mx-auto pb-20 h-screen overflow-y-auto" onClick={handleBoardClick} onMouseUp={() => setIsDraggingCell(false)}>
            {/* 상단 설정 영역 */}
            <div className="flex flex-col gap-4 mb-6 border-b border-slate-200 pb-4 pt-4">
                <div className="flex items-center gap-4">
                    <select
                        value={selectedMenuId}
                        onChange={(e) => setSelectedMenuId(e.target.value)}
                        className="border border-slate-300 rounded-lg px-4 py-2 bg-white text-slate-700 font-bold focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                    >
                        <option value="">연결할 메뉴 선택...</option>
                        <option value="0" key={0}>메인</option>
                        {menus.map(menu => (
                            <option key={menu.id} value={menu.id}>
                                {"\u00A0".repeat((menu.depth - 1) * 4)} {menu.depth > 1 ? '└ ' : ''}{menu.name}
                            </option>
                        ))}
                    </select>
                    <p className="text-sm text-slate-500">선택된 메뉴와 연동될 페이지 콘텐츠를 구성합니다.</p>
                </div>

                <div className="flex items-center justify-between">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="페이지 관리용 제목 입력"
                        className="text-3xl font-extrabold text-slate-800 outline-none placeholder-slate-300 bg-transparent w-full"
                    />
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-bold transition flex-shrink-0 ml-4 shadow-md"
                    >
                        <Save size={18} /> 저장하기
                    </button>
                </div>
            </div>

            {/* 메인(ID: "0") 선택 시 표시되는 슬라이드 관리 패널 */}
            {/* 💡 헤더 설정 (슬라이드 미사용 시 렌더링) */}
            <div className="mb-6 p-5 bg-white border border-slate-200 rounded-xl shadow-sm grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">상단 배경 제목 (헤더)</label>
                    <input
                        type="text"
                        value={pageMeta.bgTitle}
                        onChange={(e) => setPageMeta({ ...pageMeta, bgTitle: e.target.value })}
                        placeholder="페이지 기본 제목 대신 표시될 배경 위 제목"
                        className="w-full border border-slate-300 p-2 rounded outline-none focus:border-indigo-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">상단 배경 이미지 (헤더)</label>
                    <div className="flex gap-4 items-center">
                        <input type="file" accept="image/*" onChange={(e) => {
                            if (e.target.files?.[0]) {
                                setMetaBgFile(e.target.files[0]);
                                setPageMeta({ ...pageMeta, bgImage: URL.createObjectURL(e.target.files[0]) });
                            }
                        }} className="text-sm" />
                        {pageMeta.bgImage && <img src={pageMeta.bgImage} className="h-10 rounded shadow-sm object-cover" />}
                    </div>
                </div>
            </div>
            <div className="mb-8 p-6 bg-indigo-50/50 border border-indigo-200 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                    <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                        <Film size={20} className="text-indigo-600" /> 화면 슬라이드 관리
                    </h3>
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-bold text-slate-700">슬라이드 타입:</label>
                        <select
                            value={sliderType}
                            onChange={(e) => {
                                const type = e.target.value as "none" | "image" | "video";
                                setSliderType(type);

                                if (type === "none") {
                                    setSlides([]); // 사용 안 함 선택 시 비우기
                                } else if (type === "video") {
                                    const updatedSlide = slides.length > 0 ? { ...slides[0], type: "video" as const } : { ...defaultSlide, type: "video" as const };
                                    setSlides([updatedSlide]);
                                } else {
                                    const updatedSlides = slides.length > 0 ? slides.map(slide => ({ ...slide, type: "image" as const })) : [{ ...defaultSlide, type: "image" as const }];
                                    setSlides(updatedSlides);
                                }
                            }}
                            className="border border-slate-300 rounded px-3 py-1.5 text-sm font-bold bg-white outline-none"
                        >
                            <option value="none">사용 안 함 (슬라이드 제거)</option>
                            <option value="image">이미지 슬라이드 (최대 5개)</option>
                            <option value="video">동영상 슬라이드 (1개 고정)</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-6">
                    {slides.map((slide, idx) => {
                        const isTitleActive = activeSlideFocus?.index === idx && activeSlideFocus?.field === 'title';
                        const isDescActive = activeSlideFocus?.index === idx && activeSlideFocus?.field === 'desc';

                        return (
                            <div key={idx} className="slide-box p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4 relative">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-700">슬라이드 #{idx + 1}</span>
                                    {sliderType === "image" && slides.length > 1 && (
                                        <button onClick={() => setSlides(slides.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 text-xs font-bold">삭제</button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* 💡 미디어 업로드 영역 */}
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">
                                            {sliderType === "video" ? "동영상 파일 업로드 (1개)" : "이미지 파일 업로드"}
                                        </label>
                                        {slide.mediaUrl ? (
                                            <div className="relative border rounded overflow-hidden bg-black h-36 flex items-center justify-center">
                                                {sliderType === "video" ? (
                                                    <video src={slide.mediaUrl} controls className="max-h-full max-w-full" />
                                                ) : (
                                                    <img src={slide.mediaUrl} alt="" className="max-h-full max-w-full object-cover" />
                                                )}
                                                <button onClick={() => {
                                                    const updated = [...slides];
                                                    updated[idx].mediaUrl = "";
                                                    delete updated[idx].file; // 👈 기존 파일 초기화
                                                    setSlides(updated);
                                                }} className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded text-xs">변경</button>
                                            </div>
                                        ) : (
                                            <label className="h-36 bg-slate-50 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 rounded cursor-pointer hover:border-indigo-500 transition">
                                                <Upload size={20} className="mb-1 text-indigo-500" />
                                                <span className="text-[11px] font-bold text-slate-600">파일 첨부 (클릭 또는 드래그)</span>
                                                <input
                                                    type="file"
                                                    accept={sliderType === "video" ? "video/*" : "image/*"}
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const url = URL.createObjectURL(file);
                                                            const updated = [...slides];
                                                            updated[idx].mediaUrl = url;
                                                            updated[idx].file = file; // 👈 파일 저장
                                                            setSlides(updated);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>

                                    {/* 제목 및 내용 영역 */}
                                    <div className="md:col-span-2 space-y-3">
                                        {/* 슬라이드 제목 */}
                                        <div className="relative">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">슬라이드 제목</label>

                                            {isTitleActive && (
                                                <div className="absolute -top-12 left-0 bg-white rounded-lg shadow-xl border border-slate-200 px-3 py-1.5 flex items-center gap-2 z-50 whitespace-nowrap">
                                                    <select
                                                        value={slide.titleStyle.fontFamily}
                                                        onChange={(e) => {
                                                            const updated = [...slides];
                                                            updated[idx].titleStyle.fontFamily = e.target.value;
                                                            setSlides(updated);
                                                        }}
                                                        className="border border-slate-200 rounded p-1 text-xs font-bold text-slate-700 outline-none"
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
                                                    <input
                                                        type="number"
                                                        value={slide.titleStyle.fontSize}
                                                        onChange={(e) => {
                                                            const updated = [...slides];
                                                            updated[idx].titleStyle.fontSize = Number(e.target.value);
                                                            setSlides(updated);
                                                        }}
                                                        className="w-12 text-center text-xs font-bold border border-slate-200 rounded py-0.5 outline-none"
                                                    />
                                                    <span className="text-[10px] text-slate-400">px</span>
                                                    <div className="w-px h-4 bg-slate-300" />
                                                    <input
                                                        type="color"
                                                        value={slide.titleStyle.color}
                                                        onChange={(e) => {
                                                            const updated = [...slides];
                                                            updated[idx].titleStyle.color = e.target.value;
                                                            setSlides(updated);
                                                        }}
                                                        className="w-5 h-5 p-0 border-none rounded cursor-pointer"
                                                    />
                                                </div>
                                            )}

                                            {/* 💡 key를 부여하여 슬라이드 추가/삭제 시 DOM이 꼬이지 않고 고유 상태를 유지하도록 수정 */}
                                            <div
                                                key={`slide-title-${idx}`}
                                                contentEditable
                                                suppressContentEditableWarning
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    if (!isTitleActive) setActiveSlideFocus({ index: idx, field: 'title' });
                                                }}
                                                onBlur={(e) => {
                                                    const updated = [...slides];
                                                    updated[idx].titleHtml = e.currentTarget.innerHTML;
                                                    setSlides(updated);
                                                }}
                                                style={{
                                                    fontSize: `${slide.titleStyle.fontSize}px`,
                                                    color: '#000',
                                                    fontFamily: slide.titleStyle.fontFamily !== 'default' ? slide.titleStyle.fontFamily : 'inherit',
                                                }}
                                                className="border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:border-indigo-500 font-bold min-h-[40px] cursor-text"
                                                dangerouslySetInnerHTML={{ __html: slide.titleHtml }}
                                            />
                                        </div>

                                        {/* 슬라이드 내용 */}
                                        <div className="relative">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">슬라이드 내용</label>

                                            {isDescActive && (
                                                <div className="absolute -top-12 left-0 bg-white rounded-lg shadow-xl border border-slate-200 px-3 py-1.5 flex items-center gap-2 z-50 whitespace-nowrap">
                                                    <select
                                                        value={slide.descStyle.fontFamily}
                                                        onChange={(e) => {
                                                            const updated = [...slides];
                                                            updated[idx].descStyle.fontFamily = e.target.value;
                                                            setSlides(updated);
                                                        }}
                                                        className="border border-slate-200 rounded p-1 text-xs font-bold text-slate-700 outline-none"
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
                                                    <input
                                                        type="number"
                                                        value={slide.descStyle.fontSize}
                                                        onChange={(e) => {
                                                            const updated = [...slides];
                                                            updated[idx].descStyle.fontSize = Number(e.target.value);
                                                            setSlides(updated);
                                                        }}
                                                        className="w-12 text-center text-xs font-bold border border-slate-200 rounded py-0.5 outline-none"
                                                    />
                                                    <span className="text-[10px] text-slate-400">px</span>
                                                    <div className="w-px h-4 bg-slate-300" />
                                                    <input
                                                        type="color"
                                                        value={slide.descStyle.color}
                                                        onChange={(e) => {
                                                            const updated = [...slides];
                                                            updated[idx].descStyle.color = e.target.value;
                                                            setSlides(updated);
                                                        }}
                                                        className="w-5 h-5 p-0 border-none rounded cursor-pointer"
                                                    />
                                                </div>
                                            )}

                                            <div
                                                contentEditable
                                                suppressContentEditableWarning
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    if (!isDescActive) setActiveSlideFocus({ index: idx, field: 'desc' });
                                                }}
                                                onBlur={(e) => {
                                                    const updated = [...slides];
                                                    updated[idx].descHtml = e.currentTarget.innerHTML;
                                                    setSlides(updated);
                                                }}
                                                style={{
                                                    fontSize: `${slide.descStyle.fontSize}px`,
                                                    color: '#000',
                                                    fontFamily: slide.descStyle.fontFamily !== 'default' ? slide.descStyle.fontFamily : 'inherit',
                                                }}
                                                className="border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:border-indigo-500 min-h-[60px] cursor-text"
                                                dangerouslySetInnerHTML={{ __html: slide.descHtml }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {sliderType === "image" && slides.length < 5 && (
                        <button
                            onClick={() => setSlides([...slides, {
                                type: "image",
                                mediaUrl: "",
                                titleHtml: "",
                                descHtml: "",
                                titleStyle: { fontSize: 24, color: "#1e293b", fontFamily: "default", textAlign: "left" },
                                descStyle: { fontSize: 16, color: "#64748b", fontFamily: "default", textAlign: "left" }
                            }])}
                            className="w-full py-2.5 border-2 border-dashed border-indigo-300 text-indigo-600 bg-white hover:bg-indigo-50/50 rounded-xl font-bold text-sm transition flex items-center justify-center gap-1.5"
                        >
                            <Plus size={16} /> 이미지 슬라이드 추가 ({slides.length}/5)
                        </button>
                    )}
                </div>
            </div>

            {/* 컨테이너 빌더 영역 */}
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
                                <button onClick={() => openAnimModal(container)} className="p-1.5 hover:bg-white/20 rounded transition" title="애니메이션 설정">
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

                                    {column.elements.map((el) => {
                                        const isActive = activeElementId === el.id;

                                        return (
                                            <div key={el.id} className={`element-box relative flex w-full ${el.type === 'TEXT' ? 'py-1 px-4' : 'p-4'}`} style={{ justifyContent: el.styles?.layerAlign || 'flex-start' }}>

                                                {/* 1. 텍스트 엘리먼트 */}
                                                {el.type === "TEXT" && el.styles && (
                                                    <div
                                                        id={`element-${el.id}`}
                                                        className={`relative group inline-block ${isActive ? 'outline outline-2 outline-[#00d0d0]' : 'hover:outline hover:outline-1 hover:outline-slate-300'}`}
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
                                                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-slate-200 px-3 py-2 flex items-center gap-2 z-50 whitespace-nowrap">
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
                                                                    <button
                                                                        onMouseDown={(e) => e.preventDefault()}
                                                                        onClick={() => {
                                                                            const newVal = el.styles!.fontWeight === "bold" ? "normal" : "bold";
                                                                            const isApplied = applyStyleToSelection('fontWeight', newVal);
                                                                            if (!isApplied) updateElementStyle(container.id, column.id, el.id, "fontWeight", newVal);
                                                                        }}
                                                                        className={`p-1 rounded ${el.styles!.fontWeight === 'bold' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                                                        title="굵게"
                                                                    >
                                                                        <Bold size={14} />
                                                                    </button>
                                                                    <button
                                                                        onMouseDown={(e) => e.preventDefault()}
                                                                        onClick={() => {
                                                                            const newVal = el.styles!.fontStyle === "italic" ? "normal" : "italic";
                                                                            const isApplied = applyStyleToSelection('fontStyle', newVal);
                                                                            if (!isApplied) updateElementStyle(container.id, column.id, el.id, "fontStyle", newVal);
                                                                        }}
                                                                        className={`p-1 rounded ${el.styles!.fontStyle === 'italic' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                                                        title="이탤릭"
                                                                    >
                                                                        <Italic size={14} />
                                                                    </button>
                                                                    <button
                                                                        onMouseDown={(e) => e.preventDefault()}
                                                                        onClick={() => {
                                                                            const newVal = el.styles!.textDecoration === "underline" ? "none" : "underline";
                                                                            const isApplied = applyStyleToSelection('textDecoration', newVal);
                                                                            if (!isApplied) updateElementStyle(container.id, column.id, el.id, "textDecoration", newVal);
                                                                        }}
                                                                        className={`p-1 rounded ${el.styles!.textDecoration === 'underline' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                                                        title="밑줄"
                                                                    ><Underline size={14} /></button>
                                                                    <button
                                                                        onMouseDown={(e) => e.preventDefault()}
                                                                        onClick={() => {
                                                                            if (savedRangeRef.current && activeElementId) {
                                                                                const url = window.prompt("선택한 글자에 연결할 웹사이트 주소를 입력하세요:", "https://");
                                                                                if (url) applyStyleToSelection('link', url);
                                                                            } else {
                                                                                alert("링크를 걸 글자를 먼저 드래그하여 선택해주세요.");
                                                                            }
                                                                        }}
                                                                        className="p-1 rounded text-slate-500 hover:bg-white hover:shadow-sm hover:text-indigo-600"
                                                                        title="링크 걸기 (글자 드래그 후 클릭)"
                                                                    ><LinkIcon size={14} /></button>
                                                                </div>
                                                                <div className="w-px h-4 bg-slate-300" />
                                                                <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded">
                                                                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => updateElementStyle(container.id, column.id, el.id, "layerAlign", "flex-start")} className={`p-1 rounded ${el.styles.layerAlign === 'flex-start' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="박스 좌측 배치"><Box size={14} /></button>
                                                                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => updateElementStyle(container.id, column.id, el.id, "layerAlign", "center")} className={`p-1 rounded ${el.styles.layerAlign === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="박스 중앙 배치"><AlignCenter size={14} /></button>
                                                                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => updateElementStyle(container.id, column.id, el.id, "layerAlign", "flex-end")} className={`p-1 rounded ${el.styles.layerAlign === 'flex-end' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="박스 우측 배치"><Box size={14} /></button>
                                                                </div>
                                                                <div className="w-px h-4 bg-slate-300" />
                                                                <button onMouseDown={(e) => e.preventDefault()} onClick={() => deleteElement(container.id, column.id, el.id)} className="text-slate-500 hover:text-red-500" title="삭제"><Trash2 size={16} /></button>
                                                            </div>
                                                        )}

                                                        {isActive && (
                                                            <>
                                                                <div onMouseDown={(e) => handleResizeStart(e, container.id, column.id, el, 'nw')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#00d0d0] rounded-full cursor-nwse-resize z-10" />
                                                                <div onMouseDown={(e) => handleResizeStart(e, container.id, column.id, el, 'ne')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#00d0d0] rounded-full cursor-nesw-resize z-10" />
                                                                <div onMouseDown={(e) => handleResizeStart(e, container.id, column.id, el, 'sw')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#00d0d0] rounded-full cursor-nesw-resize z-10" />
                                                                <div onMouseDown={(e) => handleResizeStart(e, container.id, column.id, el, 'se')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#00d0d0] rounded-full cursor-nwse-resize z-10" />
                                                            </>
                                                        )}

                                                        <div
                                                            id={`editable-${el.id}`}
                                                            contentEditable
                                                            suppressContentEditableWarning
                                                            onMouseUp={handleSelection}
                                                            onKeyUp={handleSelection}
                                                            onBlur={(e) => updateElementHtmlContent(el.id, e.currentTarget.innerHTML)}
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
                                                    </div>
                                                )}

                                                {/* 2. 이미지 엘리먼트 */}
                                                {el.type === "IMAGE" && (
                                                    <div className="w-full relative group">
                                                        {el.content ? (
                                                            <div className="relative border rounded overflow-hidden">
                                                                <img src={el.content} alt="업로드 이미지" className="w-full h-auto object-cover max-h-64" />
                                                                <button onClick={() => deleteElement(container.id, column.id, el.id)} className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded shadow hover:bg-red-700">
                                                                    <Trash2 size={14} />
                                                                </button>
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
                                                                <Upload size={28} className="mb-2 text-indigo-500" />
                                                                <span className="text-xs font-bold text-slate-700">이미지를 드래그하거나 클릭하여 업로드</span>
                                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(container.id, column.id, el.id, e.target.files[0])} />
                                                            </label>
                                                        )}
                                                    </div>
                                                )}

                                                {/* 3. 동영상 엘리먼트 */}
                                                {el.type === "VIDEO" && (
                                                    <div className="w-full relative">
                                                        {el.content ? (
                                                            <div className="relative border rounded overflow-hidden bg-black">
                                                                <video src={el.content} controls className="w-full max-h-64 object-contain" />
                                                                <button onClick={() => deleteElement(container.id, column.id, el.id)} className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded shadow hover:bg-red-700">
                                                                    <Trash2 size={14} />
                                                                </button>
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

                                                {/* 4. 오디오 엘리먼트 */}
                                                {el.type === "AUDIO" && (
                                                    <div className="w-full relative">
                                                        {el.content ? (
                                                            <div className="relative border rounded p-4 bg-white flex flex-col gap-2 w-full">
                                                                <audio src={el.content} controls className="w-full" />
                                                                <button onClick={() => deleteElement(container.id, column.id, el.id)} className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded shadow hover:bg-red-700">
                                                                    <Trash2 size={14} />
                                                                </button>
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

                                                {/* 5. 버튼 엘리먼트 */}
                                                {el.type === "BUTTON" && el.buttonStyles && (
                                                    <div className="p-4 flex justify-center w-full relative" onMouseDown={(e) => { e.stopPropagation(); setActiveElementId(el.id); }}>
                                                        {isActive && (
                                                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-slate-200 px-3 py-2 flex items-center gap-3 z-50 whitespace-nowrap">
                                                                <input type="text" value={el.buttonStyles.text} onChange={(e) => updateElementProps(container.id, column.id, el.id, 'buttonStyles', 'text', e.target.value)} className="w-20 text-xs border border-slate-200 rounded px-1 py-1" />
                                                                <input type="color" value={el.buttonStyles.backgroundColor} onChange={(e) => updateElementProps(container.id, column.id, el.id, 'buttonStyles', 'backgroundColor', e.target.value)} className="w-5 h-5 cursor-pointer" />
                                                                <button onClick={() => deleteElement(container.id, column.id, el.id)} className="text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
                                                            </div>
                                                        )}
                                                        <button style={{ backgroundColor: el.buttonStyles.backgroundColor, color: el.buttonStyles.color, fontSize: `${el.buttonStyles.fontSize}px`, width: `${el.buttonStyles.width}px`, borderRadius: `${el.buttonStyles.borderRadius}px` }} className="px-6 py-2 shadow font-bold">
                                                            {el.buttonStyles.text}
                                                        </button>
                                                    </div>
                                                )}

                                                {/* 6. 구분선 엘리먼트 */}
                                                {el.type === "SEPARATOR" && (
                                                    <div className="w-full h-4 border-b-2 border-dashed border-slate-300"></div>
                                                )}

                                                {/* 7. 테이블 엘리먼트 */}
                                                {el.type === "TABLE" && el.tableData && (
                                                    <div
                                                        className="relative w-full overflow-x-auto pt-8 pb-4"
                                                        onMouseDown={(e) => {
                                                            e.stopPropagation();
                                                            setActiveElementId(el.id);
                                                        }}
                                                    >
                                                        {isActive && (
                                                            <div className="absolute top-0 left-0 bg-white rounded-lg shadow-xl border border-slate-200 px-3 py-1.5 flex items-center gap-3 z-50">
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

                                                                {/* 💡 테이블 셀 이미지 첨부 버튼 */}
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

                                                                            // 선택된 셀들에 이미지 태그 삽입
                                                                            selectedCells.forEach(cellKey => {
                                                                                if (newCells[cellKey]) {
                                                                                    // 기존 내용에 이미지를 추가하거나 이미지로 덮어씌우기
                                                                                    newCells[cellKey].content = `<img src="${fileUrl}" alt="table-img" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" />`;
                                                                                    newCells[cellKey].file = file
                                                                                }
                                                                            });

                                                                            updateElementProps(container.id, column.id, el.id, 'tableData', 'cells', newCells);
                                                                        }}
                                                                    />
                                                                </label>
                                                                <div className="w-px h-4 bg-slate-300" />

                                                                {/* 💡 새로 추가된 링크 생성 버튼 */}
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
                                                                                // 기존 내용이 있으면 전체를 링크로 감싸고, 빈 셀이면 '링크' 텍스트를 만들어 줍니다.
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
                                                                                        contentEditable
                                                                                        suppressContentEditableWarning
                                                                                        className="outline-none min-h-[20px] cursor-text"
                                                                                        onMouseDown={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setActiveElementId(el.id);
                                                                                        }}
                                                                                        onBlur={(e) => {
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
                                                {/* 💡 8. 아이콘 엘리먼트 (IMAGE와 거의 동일하지만 작게 렌더링) */}

                                                {/* 💡 9. 카드 엘리먼트 (선, 그림자 조절 가능) */}
                                                {/* 💡 9. 카드 엘리먼트 (아이콘과 텍스트 분리 및 오류 수정) */}
                                                {el.type === "CARD" && el.cardData && (
                                                    <div className="w-full relative" onMouseDown={(e) => { e.stopPropagation(); setActiveElementId(el.id); }}>

                                                        {/* 카드 전용 설정 툴바 */}
                                                        {isActive && (
                                                            <div className="absolute -top-16 left-0 bg-white rounded-lg shadow-xl border border-slate-200 px-3 py-2 flex items-center gap-2 z-50 whitespace-nowrap overflow-x-auto">
                                                                {/* 레이아웃(방향) 전환 */}
                                                                <button onClick={() => updateElementProps(container.id, column.id, el.id, 'cardData', 'layout', el.cardData!.layout === 'row' ? 'col' : 'row')} className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded font-bold text-slate-700">
                                                                    {el.cardData.layout === 'row' ? '좌우 모드' : '위아래 모드'}
                                                                </button>
                                                                <div className="w-px h-4 bg-slate-300" />

                                                                {/* 아이콘 첨부 */}
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

                                                                {/* 💡 1. 폰트 선택 */}
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

                                                                {/* 💡 2. 글자 크기 */}
                                                                <div className="flex items-center gap-1">
                                                                    <input
                                                                        type="number"
                                                                        value={el.styles?.fontSize || 16}
                                                                        onChange={(e) => {
                                                                            const val = Number(e.target.value);
                                                                            const isApplied = applyStyleToSelection('fontSize', val);
                                                                            if (!isApplied) updateElementStyle(container.id, column.id, el.id, "fontSize", val);
                                                                        }}
                                                                        className="w-12 text-center text-xs font-bold border border-slate-200 rounded outline-none py-1"
                                                                    />
                                                                    <span className="text-[10px] text-slate-400">px</span>
                                                                </div>

                                                                {/* 💡 3. 글자 색상 */}
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

                                                                {/* 💡 4. 좌우 (수평) 정렬 */}
                                                                <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded">
                                                                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => updateElementStyle(container.id, column.id, el.id, "textAlign", "left")} className={`p-1 rounded ${el.styles?.textAlign === 'left' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="좌측 정렬"><AlignLeft size={14} /></button>
                                                                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => updateElementStyle(container.id, column.id, el.id, "textAlign", "center")} className={`p-1 rounded ${el.styles?.textAlign === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="가운데 정렬"><AlignCenter size={14} /></button>
                                                                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => updateElementStyle(container.id, column.id, el.id, "textAlign", "right")} className={`p-1 rounded ${el.styles?.textAlign === 'right' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="우측 정렬"><AlignRight size={14} /></button>
                                                                </div>

                                                                {/* 💡 5. 상중하 (수직) 정렬 */}
                                                                <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded">
                                                                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => updateElementProps(container.id, column.id, el.id, 'cardData', 'verticalAlign', 'flex-start')} className={`p-1.5 rounded text-xs font-bold ${el.cardData?.verticalAlign === 'flex-start' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="상단 정렬">상</button>
                                                                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => updateElementProps(container.id, column.id, el.id, 'cardData', 'verticalAlign', 'center')} className={`p-1.5 rounded text-xs font-bold ${el.cardData?.verticalAlign === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="중앙 정렬">중</button>
                                                                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => updateElementProps(container.id, column.id, el.id, 'cardData', 'verticalAlign', 'flex-end')} className={`p-1.5 rounded text-xs font-bold ${el.cardData?.verticalAlign === 'flex-end' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`} title="하단 정렬">하</button>
                                                                </div>

                                                                <div className="w-px h-4 bg-slate-300" />
                                                                <button onClick={() => deleteElement(container.id, column.id, el.id)} className="text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
                                                            </div>
                                                        )}

                                                        {/* 실제 카드 UI 미리보기 */}
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
                                                            {/* 1. 아이콘 영역 (수정된 부분: el.cardData.iconUrl 사용) */}
                                                            {el.cardData.iconUrl && (
                                                                <div className="flex-shrink-0 relative group">
                                                                    <img src={el.cardData.iconUrl} style={{ width: el.cardData.iconSize, height: el.cardData.iconSize }} className="object-contain" alt="icon" />

                                                                    {/* 💡 삭제 버튼 오류 해결: updateElementProps의 인자를 정확히 6개로 맞추고 iconUrl을 초기화 */}
                                                                    <button
                                                                        onClick={() => updateElementProps(container.id, column.id, el.id, 'cardData', 'iconUrl', '')}
                                                                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full text-[10px] hidden group-hover:block"
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {/* 2. 텍스트 영역 (본문은 안전하게 유지됨) */}
                                                            <div className="flex-grow w-full">
                                                                <div
                                                                    id={`editable-${el.id}`}
                                                                    contentEditable
                                                                    suppressContentEditableWarning
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
                                                                    onBlur={(e) => updateElementHtmlContent(el.id, e.currentTarget.innerHTML)}
                                                                    className="outline-none min-h-[50px] cursor-text w-full break-words"
                                                                    dangerouslySetInnerHTML={{ __html: el.content }}
                                                                />
                                                            </div>
                                                        </div>
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

                <div className="flex justify-end mt-4">
                    <button
                        onClick={() => setLayoutModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 text-sm font-bold rounded shadow-sm"
                    >
                        <Plus size={16} /> Container
                    </button>
                </div>
            </div>

            {/* 모달 창 영역 */}
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
        </div>
    );
}