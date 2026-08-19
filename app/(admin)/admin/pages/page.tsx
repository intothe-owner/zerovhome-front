// @/components/main/VisualPageBuilder.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
    ElementType, CardData, TextStyles, ButtonStyles, TableCell, TableData,
    ElementNode, ColumnNode, AnimationConfig, ContainerNode, MenuType, SlideItem
} from "@/types/types";

// 💡 ImagePlus 아이콘 추가
import { Sparkles, ImagePlus } from "lucide-react";

import PageSettings from "@/components/admin/PageSettings";
import SlideManager from "@/components/admin/SlideManager";
import ContainerBoard from "@/components/admin/ContainerBoard";
import BuilderModals from "@/components/admin/BuilderModals";

export default function VisualPageBuilder() {
    const [title, setTitle] = useState("메인 페이지");
    const [selectedMenuId, setSelectedMenuId] = useState<string>("0");
    const [menus, setMenus] = useState<MenuType[]>([]);
    const [containers, setContainers] = useState<ContainerNode[]>([]);
    const [sliderType, setSliderType] = useState<"none" | "image" | "video" | "header">("none");
    const [pageId, setPageId] = useState<number | null>(null);
    const [pageMeta, setPageMeta] = useState({ bgImage: '', bgTitle: '' });
    const [metaBgFile, setMetaBgFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // 💡 [핵심 수정] 줄바꿈(\n)과 탭(\t)을 스페이스바 한 칸(' ')으로 변경하는 함수
    // 컴포넌트 스코프 상단에 배치하여 어디서든 사용할 수 있게 합니다.
    const cleanHtml = (html: string | undefined) => {
        if (!html) return "";
        return html
            .replace(/[\r\n\t]+/g, ' ') // 1. 엔터, 캐리지리턴, 탭을 공백 1칸으로 치환
            .replace(/\s{2,}/g, ' ')    // 2. 연속된 2칸 이상의 공백을 1칸으로 압축
            .replace(/>\s+</g, '><')    // 💡 [추가] 태그와 태그 사이의 공백 완전히 제거
            .trim();
    };

    const defaultSlide: SlideItem = {
        type: "image", mediaUrl: "", titleHtml: "", descHtml: "",
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
    const [animTarget, setAnimTarget] = useState<{ type: 'container' | 'element', containerId?: string, columnId?: string }>({ type: 'container' });
    const [tempAnim, setTempAnim] = useState<AnimationConfig>({ type: "none", duration: 0.5, delay: 0 });

    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiTarget, setAiTarget] = useState<{ type: 'PAGE' | 'CONTAINER' | 'TEXT' | 'IMAGE' | 'META', id?: string, content?: string }>({ type: 'PAGE' });

    const openAiModal = (type: 'PAGE' | 'CONTAINER' | 'TEXT' | 'IMAGE' | 'META', id?: string, content?: string) => {
        setAiTarget({ type, id, content });
        setAiPrompt("");
        setAiModalOpen(true);
    };

    // 💡 연결할 메뉴 선택 시 페이지 제목(Title) 자동 기입 로직 추가
    useEffect(() => {
        if (selectedMenuId === "0") {
            setTitle("메인 페이지");
        } else if (selectedMenuId !== "") {
            const targetMenu = menus.find(m => String(m.id) === selectedMenuId);
            if (targetMenu) setTitle(targetMenu.name);
        } else {
            setTitle("메인 페이지");
        }
    }, [selectedMenuId, menus]);

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
        return () => document.removeEventListener("selectionchange", handleDocumentSelectionChange);
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
                        if (m.parentId && map[m.parentId]) map[m.parentId].children.push(map[m.id]);
                        else roots.push(map[m.id]);
                    });
                    const sortTree = (nodes: any[]) => {
                        nodes.sort((a, b) => a.order - b.order);
                        nodes.forEach((node) => { if (node.children && node.children.length > 0) sortTree(node.children); });
                    };
                    sortTree(roots);
                    const flattened: any[] = [];
                    const flatten = (nodes: any[]) => {
                        nodes.forEach(node => {
                            flattened.push(node);
                            if (node.children && node.children.length > 0) flatten(node.children);
                        });
                    };
                    flatten(roots);
                    setMenus(flattened);
                }
            } catch (error) { console.error("메뉴 로딩 실패", error); }
        };
        fetchMenus();
    }, []);

    useEffect(() => { loadPageData(selectedMenuId); }, [selectedMenuId]);

    // @/components/main/VisualPageBuilder.tsx

    const loadPageData = async (menuId: string) => {

        if (menuId === "") {
            setPageId(null); setContainers([]); setSlides([]); setSliderType("none");
            setPageMeta({ bgImage: '', bgTitle: '' });
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pages/${menuId}`);
            const json = await res.json();

            // 💡 json.success가 true이고 데이터가 있을 때만 페이지 렌더링
            if (json.success && json.data) {
                const page = json.data;

                setPageId(page.id);

                const cleanedContainers = (page.contentBlocks || []).map((container: ContainerNode) => ({
                    ...container,
                    columns: container.columns.map(col => ({
                        ...col,
                        elements: col.elements.map(el => ({
                            ...el,
                            content: cleanHtml(el.content)
                        }))
                    }))
                }));
                setContainers(cleanedContainers);

                const savedMeta = page.pageMeta || { bgImage: '', bgTitle: '' };
                setPageMeta(savedMeta);

                if (page.sliderData && page.sliderData.length > 0) {
                    setSlides(page.sliderData);
                    setSliderType(page.sliderData[0].type || "image");
                }
                else if (savedMeta.bgImage || savedMeta.bgTitle) {
                    setSlides([]);
                    setSliderType("header");
                }
                else {
                    setSlides([]);
                    setSliderType("none");
                }
            } else {
                // 💡 [추가된 부분] 페이지가 존재하지 않거나(success: false) 데이터가 없을 때 이전 상태 지우기
                setPageId(null);
                setContainers([]);
                setSlides([]);
                setSliderType("none");
                setPageMeta({ bgImage: '', bgTitle: '' });
            }
        } catch (error) {
            console.error("데이터 로딩 실패:", error);
            // 💡 통신 오류 시에도 이전 페이지 내용이 남지 않도록 초기화
            setPageId(null);
            setContainers([]);
            setSlides([]);
            setSliderType("none");
            setPageMeta({ bgImage: '', bgTitle: '' });
        }
    };

    const handleSave = async () => {
        if (!title.trim()) return alert("페이지 제목을 입력해주세요.");
        setIsSaving(true);
        const formData = new FormData();
        formData.append("menuId", selectedMenuId === "0" ? "" : selectedMenuId);
        formData.append("title", title);

        const cleanSlides = slides.map(s => { const { file, ...rest } = s; return rest; });
        const cleanContainers = containers.map(c => ({
            ...c,
            columns: c.columns.map(col => ({
                ...col,
                elements: col.elements.map(el => {
                    const { file, ...restEl } = el;
                    const editableDiv = document.getElementById(`editable-${el.id}`);
                    if (editableDiv) restEl.content = editableDiv.innerHTML;
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

        slides.forEach((slide, idx) => { if (slide.file) formData.append(`slide_file_${idx}`, slide.file); });
        containers.forEach(container => {
            container.columns.forEach(col => {
                col.elements.forEach(el => {
                    if (el.file) formData.append(`element_file_${el.id}`, el.file);
                    if (el.type === 'TABLE' && el.tableData) {
                        Object.keys(el.tableData.cells).forEach(cellKey => {
                            if (el.tableData!.cells[cellKey].file) formData.append(`table_file_${el.id}_${cellKey}`, el.tableData!.cells[cellKey].file);
                        });
                    }
                });
            });
        });

        try {
            const url = pageId ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pages/${pageId}` : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pages`;
            const res = await fetch(url, { method: pageId ? "PUT" : "POST", body: formData });
            const json = await res.json();
            if (json.success) {
                alert(pageId ? "수정되었습니다." : "생성되었습니다.");
                await loadPageData(selectedMenuId);
            } else alert("저장 실패: " + json.message);
        } catch (error) {
            console.log(error);
            alert("서버와 통신 중 오류가 발생했습니다.");
        } finally {
            // 💡 [추가] 저장이 끝났으므로(성공/실패 무관) 상태 해제
            setIsSaving(false);
        }
    };

    const handleGenerateAI = async () => {
        if (!aiPrompt.trim()) return alert("원하시는 형태를 프롬프트로 입력해주세요.");

        setIsGenerating(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ai/generate-page`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: aiPrompt,
                    targetType: aiTarget.type,
                    currentContent: aiTarget.content
                }),
            });

            const json = await res.json();

            if (json.success && Array.isArray(json.elements)) {
                if (aiTarget.type === 'META') {
                    const textEl = json.elements.find((el: any) => el.type === 'TEXT');
                    const imgEl = json.elements.find((el: any) => el.type === 'IMAGE');

                    const newTitle = textEl ? cleanHtml(textEl.content.replace(/<[^>]*>?/gm, '')) : pageMeta.bgTitle;
                    const newBg = imgEl ? imgEl.content : pageMeta.bgImage;

                    setPageMeta({ bgTitle: newTitle, bgImage: newBg });
                }
                if (aiTarget.type === 'PAGE') {
                    const newElements: ElementNode[] = json.elements.map((el: any) => ({
                        id: Math.random().toString(36).substr(2, 9),
                        type: el.type,
                        content: cleanHtml(el.content), // 💡 함수 적용
                        styles: {
                            fontFamily: "default", fontSize: 16, color: "#000000", textAlign: "left",
                            layerAlign: "flex-start", width: "auto", height: "auto",
                            linkUrl: el.linkUrl || ""
                        }
                    }));
                    const newContainer: ContainerNode = {
                        id: Math.random().toString(36).substr(2, 9),
                        columns: [{ id: Math.random().toString(36).substr(2, 9), width: "1/1", elements: newElements }]
                    };
                    setContainers([...containers, newContainer]);
                }
                else if (aiTarget.type === 'TEXT' || aiTarget.type === 'IMAGE') {
                    const newContent = cleanHtml(json.elements[0]?.content); // 💡 함수 적용
                    if (newContent) {
                        setContainers(containers.map(container => ({
                            ...container,
                            columns: container.columns.map(col => ({
                                ...col,
                                elements: col.elements.map(el =>
                                    el.id === aiTarget.id ? { ...el, content: newContent } : el
                                )
                            }))
                        })));
                    }
                }
                else if (aiTarget.type === 'CONTAINER') {
                    const newElements: ElementNode[] = json.elements.map((el: any) => ({
                        id: Math.random().toString(36).substr(2, 9),
                        type: el.type,
                        content: cleanHtml(el.content), // 💡 함수 적용
                        styles: {
                            fontFamily: "default", fontSize: 16, color: "#000000", textAlign: "left",
                            layerAlign: "flex-start", width: "auto", height: "auto",
                            linkUrl: el.linkUrl || ""
                        }
                    }));
                    setContainers(containers.map(container =>
                        container.id === aiTarget.id ? {
                            ...container,
                            columns: [{ id: Math.random().toString(36).substr(2, 9), width: "1/1", elements: newElements }]
                        } : container
                    ));
                }

                setAiPrompt("");
                setAiModalOpen(false);
            } else {
                alert("AI 생성 실패: " + json.message);
            }
        } catch (error) {
            alert("AI 서버와 통신 중 오류가 발생했습니다.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleBoardClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.element-box') || (e.target as HTMLElement).closest('.slide-box')) return;
        setActiveElementId(null); setActiveSlideFocus(null); setSelectedCells(new Set());
    };

    const openAnimModal = (item: any, type: 'container' | 'element' = 'container', containerId?: string, columnId?: string) => {
        setTempAnim(item.animation || { type: "none", duration: 0.5, delay: 0 });
        setAnimTarget({ type, containerId, columnId });
        setAnimModalOpen(item.id);
    };
    const saveAnimConfig = () => {
        if (animModalOpen) {
            if (animTarget.type === 'container') {
                setContainers(containers.map(c => c.id === animModalOpen ? { ...c, animation: tempAnim } : c));
            } else {
                setContainers(containers.map(c => c.id === animTarget.containerId ? {
                    ...c,
                    columns: c.columns.map(col => col.id === animTarget.columnId ? {
                        ...col,
                        elements: col.elements.map(el => el.id === animModalOpen ? { ...el, animation: tempAnim } : el)
                    } : col)
                } : c));
            }
            setAnimModalOpen(null);
        }
    };

    const addContainer = (layoutStr: string) => {
        const widths = layoutStr.split("+");
        const newColumns: ColumnNode[] = widths.map((w) => ({ id: Math.random().toString(36).substr(2, 9), width: w, elements: [], }));
        setContainers([...containers, { id: Math.random().toString(36).substr(2, 9), columns: newColumns }]);
        setLayoutModalOpen(false);
    };



    const updateElementProps = (containerId: string, columnId: string, elementId: string, propCategory: 'styles' | 'buttonStyles' | 'tableData' | 'cardData', key: string, value: any) => {
        const editableDiv = document.getElementById(`editable-${elementId}`);
        const currentHtml = editableDiv ? editableDiv.innerHTML : undefined;
        setContainers(containers.map(container =>
            container.id === containerId ? {
                ...container, columns: container.columns.map(col => col.id === columnId ? {
                    ...col, elements: col.elements.map(el => {
                        if (el.id === elementId) {
                            return { ...el, content: currentHtml !== undefined ? currentHtml : el.content, [propCategory]: { ...(el[propCategory] as any), [key]: value } };
                        }
                        return el;
                    })
                } : col)
            } : container
        ));
    };

    const updateElementStyle = (containerId: string, columnId: string, elementId: string, key: keyof TextStyles, value: any) => {
        updateElementProps(containerId, columnId, elementId, 'styles', key, value);
    };

    const applyStyleToSelection = (styleType: 'fontSize' | 'color' | 'fontFamily' | 'fontWeight' | 'fontStyle' | 'textDecoration' | 'link', value: any) => {
        const range = savedRangeRef.current;
        if (!range || !activeElementId || range.collapsed) return false;
        try {
            const editableDiv = document.getElementById(`editable-${activeElementId}`);
            if (!editableDiv) return false;
            editableDiv.focus();
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);

            if (styleType === 'fontSize') {
                document.execCommand('styleWithCSS', false, 'false');
                document.execCommand('fontSize', false, '7');
                const fonts = editableDiv.querySelectorAll('font[size="7"]');
                fonts.forEach(font => { font.removeAttribute('size'); (font as HTMLElement).style.fontSize = `${value}px`; });
                return true;
            } else {
                try { (document as any).execCommand("styleWithCSS", false, true); } catch (e) { }
                if (styleType === 'fontWeight') document.execCommand('bold', false, undefined);
                else if (styleType === 'fontStyle') document.execCommand('italic', false, undefined);
                else if (styleType === 'textDecoration') document.execCommand('underline', false, undefined);
                else if (styleType === 'color') document.execCommand('foreColor', false, value);
                else if (styleType === 'fontFamily') document.execCommand('fontName', false, value);
                else if (styleType === 'link') document.execCommand('createLink', false, value);
                return true;
            }
        } catch (e) { return false; }
    };

    // 💡 직접 HTML을 덮어쓸 때도 여백 정리 함수(cleanHtml) 적용
    const updateElementHtmlContent = (elementId: string, htmlContent: string) => {
        const cleanedHtml = cleanHtml(htmlContent);

        setContainers(containers.map(container => ({
            ...container, columns: container.columns.map(col => ({
                ...col, elements: col.elements.map(el => el.id === elementId ? { ...el, content: cleanedHtml } : el)
            }))
        })));
    };

    const handleFileUpload = (containerId: string, columnId: string, elementId: string, file: File) => {
        const fileUrl = URL.createObjectURL(file);
        setContainers(containers.map(container =>
            container.id === containerId ? {
                ...container, columns: container.columns.map(col =>
                    col.id === columnId ? { ...col, elements: col.elements.map(el => el.id === elementId ? { ...el, content: fileUrl, file: file } : el) } : col
                )
            } : container
        ));
    };

    const deleteElement = (containerId: string, columnId: string, elementId: string) => {
        setContainers(containers.map(container =>
            container.id === containerId ? {
                ...container, columns: container.columns.map(col =>
                    col.id === columnId ? { ...col, elements: col.elements.filter(el => el.id !== elementId) } : col
                )
            } : container
        ));
    };

    const handleSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) savedRangeRef.current = selection.getRangeAt(0).cloneRange();
        else savedRangeRef.current = null;
    };

    // 💡 1. addElement 함수 수정: 비율 유지(keepAspectRatio) 속성 기본값 추가
    const addElement = (type: ElementType) => {
        if (!elementModalOpen) return;
        const { containerId, columnId } = elementModalOpen;
        const defaultContent = type === "TEXT" ? "제목을 입력해주세요." :
            type === "MAP" ? "부산광역시 해운대구 신반송로 151" : "";
        const newElement: ElementNode = {
            id: Math.random().toString(36).substr(2, 9), type,
            content: defaultContent,
            // 💡 keepAspectRatio: true 를 추가하여 기본적으로 비율이 유지되도록 설정
            styles: { fontFamily: "default", fontSize: 32, color: "#000000", textAlign: "left", layerAlign: "flex-start", linkUrl: "", width: "auto", height: "auto", keepAspectRatio: true }
        };
        setContainers(containers.map(container =>
            container.id === containerId ? {
                ...container, columns: container.columns.map(col => col.id === columnId ? { ...col, elements: [...col.elements, newElement] } : col)
            } : container
        ));
        setElementModalOpen(null);
    };


    // 💡 2. handleResizeStart 함수 수정: 드래그 시 '비율 유지' 체크 여부에 따라 동작 분기
    const handleResizeStart = (e: React.MouseEvent, containerId: string, columnId: string, el: ElementNode, direction: string) => {
        e.stopPropagation(); e.preventDefault();
        const elementNode = document.getElementById(`element-${el.id}`);
        if (!elementNode) return;
        const startX = e.clientX, startY = e.clientY, startWidth = elementNode.offsetWidth, startHeight = elementNode.offsetHeight;

        // 💡 이미지 엘리먼트이면서 비율 유지가 켜져있는지 확인 (기본값 true)
        const isLocked = el.type === "IMAGE" && el.styles?.keepAspectRatio !== false;
        const ratio = startHeight / startWidth;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            let newWidth = startWidth, newHeight = startHeight;
            const deltaX = moveEvent.clientX - startX, deltaY = moveEvent.clientY - startY;

            if (direction.includes("e")) newWidth = startWidth + deltaX;
            if (direction.includes("w")) newWidth = startWidth - deltaX;

            if (isLocked) {
                // 💡 비율 유지: 넓이 변경량에 맞춰 높이를 강제 계산
                newHeight = newWidth * ratio;
            } else {
                // 💡 자유 변형: 위아래 드래그를 허용
                if (direction.includes("s")) newHeight = startHeight + deltaY;
                if (direction.includes("n")) newHeight = startHeight - deltaY;
            }

            setContainers((prev) => prev.map((container) => container.id === containerId ? {
                ...container, columns: container.columns.map((col) => col.id === columnId ? {
                    ...col, elements: col.elements.map((element) => element.id === el.id ? {
                        ...element,
                        styles: {
                            // 💡 에러 원인 해결: TextStyles에서 필수로 요구하는 속성들을 모두 기본값으로 채워줍니다!
                            ...(element.styles || {
                                fontFamily: "default",
                                fontSize: 16,
                                color: "#000000",
                                textAlign: "left",
                                layerAlign: "flex-start",
                                linkUrl: "",
                                keepAspectRatio: true
                            }),
                            width: `${Math.max(50, newWidth)}px`,
                            height: `${Math.max(30, newHeight)}px`
                        }
                    } : element)
                } : col)
            } : container));
        };
        const handleMouseUp = () => { document.removeEventListener("mousemove", handleMouseMove); document.removeEventListener("mouseup", handleMouseUp); };
        document.addEventListener("mousemove", handleMouseMove); document.addEventListener("mouseup", handleMouseUp);
    };

    const openTableConfig = () => { if (!elementModalOpen) return; setTableConfigModalOpen({ containerId: elementModalOpen.containerId, columnId: elementModalOpen.columnId }); setElementModalOpen(null); setTableInputs({ rows: 3, cols: 3 }); };
    const confirmTableConfig = () => {
        if (!tableConfigModalOpen) return;
        const { containerId, columnId } = tableConfigModalOpen; const { rows, cols } = tableInputs;
        const initialCells: Record<string, TableCell> = {};
        for (let r = 0; r < rows; r++) { for (let c = 0; c < cols; c++) { initialCells[`${r}-${c}`] = { row: r, col: c, content: "", rowSpan: 1, colSpan: 1, isVisible: true, textAlign: "center", borderWidth: 1, borderColor: "#cbd5e1" }; } }
        const newElement: ElementNode = { id: Math.random().toString(36).substr(2, 9), type: "TABLE", content: "", tableData: { rows, cols, cells: initialCells } };
        setContainers(containers.map(container => container.id === containerId ? { ...container, columns: container.columns.map(col => col.id === columnId ? { ...col, elements: [...col.elements, newElement] } : col) } : container));
        setTableConfigModalOpen(null);
    };

    const applyToTableCells = (containerId: string, columnId: string, elementId: string, tableData: TableData, key: keyof TableCell, value: any) => {
        const newCells = { ...tableData.cells };
        const targetKeys = selectedCells.size > 0 ? Array.from(selectedCells) : Object.keys(newCells);
        targetKeys.forEach(k => { if (newCells[k]) newCells[k] = { ...newCells[k], [key]: value }; });
        updateElementProps(containerId, columnId, elementId, 'tableData', 'cells', newCells);
    };
    const getCommonBorderWidth = (tableData: TableData) => { const targetKeys = selectedCells.size > 0 ? Array.from(selectedCells) : Object.keys(tableData.cells); if (targetKeys.length === 0) return 1; return tableData.cells[targetKeys[0]]?.borderWidth ?? 1; };
    const getCommonBorderColor = (tableData: TableData) => { const targetKeys = selectedCells.size > 0 ? Array.from(selectedCells) : Object.keys(tableData.cells); if (targetKeys.length === 0) return '#cbd5e1'; return tableData.cells[targetKeys[0]]?.borderColor ?? '#cbd5e1'; };

    const mergeCells = (containerId: string, columnId: string, elementId: string, tableData: TableData) => {
        if (selectedCells.size < 2) return alert("병합할 셀을 2개 이상 선택하세요.");
        let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
        Array.from(selectedCells).forEach(key => {
            const [r, c] = key.split('-').map(Number);
            if (r < minR) minR = r; if (r > maxR) maxR = r; if (c < minC) minC = c; if (c > maxC) maxC = c;
        });
        const newCells = { ...tableData.cells };
        const topLeftKey = `${minR}-${minC}`;
        newCells[topLeftKey].rowSpan = maxR - minR + 1; newCells[topLeftKey].colSpan = maxC - minC + 1;
        for (let r = minR; r <= maxR; r++) { for (let c = minC; c <= maxC; c++) { if (`${r}-${c}` !== topLeftKey) newCells[`${r}-${c}`].isVisible = false; } }
        updateElementProps(containerId, columnId, elementId, 'tableData', 'cells', newCells);
        setSelectedCells(new Set());
    };

    const unmergeCells = (containerId: string, columnId: string, elementId: string, cellKey: string, tableData: TableData) => {
        const cell = tableData.cells[cellKey];
        if (!cell || (cell.rowSpan === 1 && cell.colSpan === 1)) return;
        const newCells = { ...tableData.cells };
        for (let r = cell.row; r < cell.row + cell.rowSpan; r++) { for (let c = cell.col; c < cell.col + cell.colSpan; c++) { newCells[`${r}-${c}`].isVisible = true; } }
        newCells[cellKey].rowSpan = 1; newCells[cellKey].colSpan = 1;
        updateElementProps(containerId, columnId, elementId, 'tableData', 'cells', newCells);
        setSelectedCells(new Set([cellKey]));
    };

    return (
        <div className="max-w-6xl mx-auto pb-20 min-h-screen" onClick={handleBoardClick} onMouseUp={() => setIsDraggingCell(false)}>

            {/* 변경된 PageSettings 적용 */}
            <PageSettings
                selectedMenuId={selectedMenuId}
                setSelectedMenuId={setSelectedMenuId}
                menus={menus} title={title} setTitle={setTitle} handleSave={handleSave}
                isSaving={isSaving}
            />

            <SlideManager
                sliderType={sliderType} setSliderType={setSliderType}
                slides={slides} setSlides={setSlides}
                activeSlideFocus={activeSlideFocus} setActiveSlideFocus={setActiveSlideFocus} defaultSlide={defaultSlide}
                pageMeta={pageMeta} setPageMeta={setPageMeta} setMetaBgFile={setMetaBgFile}
                setAiModalOpen={(type, id, content) => openAiModal(type as any, id, content)}
            />

            <ContainerBoard
                containers={containers}
                setContainers={setContainers}
                activeElementId={activeElementId}
                setActiveElementId={setActiveElementId}
                setLayoutModalOpen={setLayoutModalOpen}
                setElementModalOpen={setElementModalOpen}
                openAnimModal={openAnimModal}
                deleteElement={deleteElement}
                handleFileUpload={handleFileUpload}
                updateElementStyle={updateElementStyle}
                updateElementProps={updateElementProps}
                updateElementHtmlContent={updateElementHtmlContent}
                applyStyleToSelection={applyStyleToSelection}
                handleSelection={handleSelection}
                handleResizeStart={handleResizeStart}
                selectedCells={selectedCells}
                setSelectedCells={setSelectedCells}
                isDraggingCell={isDraggingCell}
                setIsDraggingCell={setIsDraggingCell}
                mergeCells={mergeCells}
                unmergeCells={unmergeCells}
                getCommonBorderWidth={getCommonBorderWidth}
                getCommonBorderColor={getCommonBorderColor}
                applyToTableCells={applyToTableCells}
                savedRangeRef={savedRangeRef}
                setAiModalOpen={(type, id, content) => openAiModal(type as any, id, content)}
            />

            <BuilderModals
                layoutModalOpen={layoutModalOpen} setLayoutModalOpen={setLayoutModalOpen} addContainer={addContainer}
                elementModalOpen={elementModalOpen} setElementModalOpen={setElementModalOpen} addElement={addElement}
                tableConfigModalOpen={tableConfigModalOpen} setTableConfigModalOpen={setTableConfigModalOpen}
                tableInputs={tableInputs} setTableInputs={setTableInputs} openTableConfig={openTableConfig} confirmTableConfig={confirmTableConfig}
                animModalOpen={animModalOpen} setAnimModalOpen={setAnimModalOpen} tempAnim={tempAnim} setTempAnim={setTempAnim} saveAnimConfig={saveAnimConfig}
                containers={containers} setContainers={setContainers}
            />

            {aiModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-[600px] max-w-full m-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="text-purple-600" size={24} />
                            <h2 className="text-xl font-bold text-slate-800">
                                {aiTarget.type === 'PAGE' ? '제미나이 AI - 새 블록 생성' :
                                    aiTarget.type === 'CONTAINER' ? '제미나이 AI - 컨테이너 수정' :
                                        aiTarget.type === 'IMAGE' ? '제미나이 AI - 이미지 다시 그리기' :
                                            aiTarget.type === 'META' ? '제미나이 AI - 페이지 상단 배경 및 제목 생성' : '제미나이 AI - 텍스트 수정'}
                            </h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-5">
                            {aiTarget.type === 'PAGE' || aiTarget.type === 'CONTAINER'
                                ? '생성하고 싶은 UI 레이아웃, 텍스트 내용을 상세히 적어주시면 AI가 HTML 코드를 짜서 수정/추가합니다.'
                                : '요구사항을 적어주시면 선택한 내용을 알맞게 변경해 드립니다.'}
                        </p>

                        <textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder={aiTarget.type === 'IMAGE' ? "예: '사무실 내부 사진으로 변경해줘'" : "요청사항을 입력하세요..."}
                            className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none mb-4"
                        />

                        <div className="flex justify-end gap-2">
                            <button onClick={() => { setAiModalOpen(false); setAiPrompt(""); }} className="px-4 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 font-semibold text-sm" disabled={isGenerating}>
                                취소
                            </button>
                            <button onClick={handleGenerateAI} disabled={isGenerating || !aiPrompt.trim()} className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-semibold text-sm disabled:opacity-50">
                                {isGenerating ? (<><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> 처리 중...</>) : ("생성 및 수정하기")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}