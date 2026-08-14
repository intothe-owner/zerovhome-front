// @/components/main/types.ts
export type ElementType = "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "BUTTON" | "SEPARATOR" | "TABLE" | "CARD";

export interface CardData {
    layout: "row" | "col";
    iconUrl: string;
    iconSize: number;
    animation: "none" | "fadeIn" | "slideUp" | "zoomIn";
    backgroundColor: string;
    borderWidth: number;
    borderColor: string;
    borderRadius: number;
    shadow: "none" | "sm" | "md" | "lg" | "xl";
    padding: number;
    verticalAlign?: "flex-start" | "center" | "flex-end";
}

export interface TextStyles {
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

export interface ButtonStyles {
    text: string;
    backgroundColor: string;
    color: string;
    fontSize: number;
    width: number;
    borderRadius: number;
    layerAlign: "flex-start" | "center" | "flex-end";
}

export interface TableCell {
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

export interface TableData {
    rows: number;
    cols: number;
    cells: Record<string, TableCell>;
}

export interface ElementNode {
    id: string;
    type: ElementType;
    content: string;
    styles?: TextStyles;
    buttonStyles?: ButtonStyles;
    cardData?: CardData;
    tableData?: TableData;
    file?: File;
    animation?: AnimationConfig;
}

export interface ColumnNode {
    id: string;
    width: string;
    elements: ElementNode[];
}

export interface AnimationConfig {
    type: "none" | "fadeIn" | "slideUp" | "slideDown" | "slideLeft" | "slideRight" | "zoomIn";
    duration: number;
    delay: number;
}

export interface ContainerNode {
    id: string;
    columns: ColumnNode[];
    animation?: AnimationConfig;
}

export interface MenuType {
    id: number;
    name: string;
    depth: number;
    parentId: number | null;
    order: number;
    url: string;
}

export interface SlideItem {
    type: "image" | "video";
    mediaUrl: string;
    titleHtml: string;
    descHtml: string;
    titleStyle: { fontSize: number; color: string; fontFamily: string; textAlign: "left" | "center" | "right" };
    descStyle: { fontSize: number; color: string; fontFamily: string; textAlign: "left" | "center" | "right" };
    file?: File;
}