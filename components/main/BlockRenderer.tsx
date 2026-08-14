"use client";

import React from "react";
import { motion } from "framer-motion";

interface AnimationConfig {
  type: "none" | "fadeIn" | "slideUp" | "slideDown" | "slideLeft" | "slideRight" | "zoomIn";
  duration: number;
  delay: number;
}

interface ElementNode {
  id: string;
  type: string;
  content: string;
  styles?: any;
  buttonStyles?: any;
  tableData?: any;
  cardData?: any;
  animation?: AnimationConfig; // 💡 개별 엘리먼트 애니메이션 설정 추가
}

interface ColumnNode {
  id: string;
  width: string;
  elements: ElementNode[];
}

interface ContainerNode {
  id: string;
  columns: ColumnNode[];
  animation?: AnimationConfig;
}

const AnimatedContainer = ({ container, children }: { container: ContainerNode, children: React.ReactNode }) => {
  const { animation } = container;

  if (!animation || animation.type === "none") {
    return <div className="w-full max-w-6xl mx-auto px-4 py-8 flex flex-wrap">{children}</div>;
  }

  let initialStyle: any = { opacity: 0 };
  let whileInViewStyle: any = { opacity: 1 };

  switch (animation.type) {
    case "slideUp": initialStyle.y = 50; whileInViewStyle.y = 0; break;
    case "slideDown": initialStyle.y = -50; whileInViewStyle.y = 0; break;
    case "slideLeft": initialStyle.x = 50; whileInViewStyle.x = 0; break;
    case "slideRight": initialStyle.x = -50; whileInViewStyle.x = 0; break;
    case "zoomIn": initialStyle.scale = 0.8; whileInViewStyle.scale = 1; break;
    case "fadeIn":
    default: break;
  }

  return (
    <motion.div
      initial={initialStyle}
      whileInView={whileInViewStyle}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: animation.duration, delay: animation.delay, ease: "easeOut" }}
      className="w-full max-w-6xl mx-auto px-4 py-8 flex flex-wrap"
    >
      {children}
    </motion.div>
  );
};

// 💡 [핵심 추가] 개별 엘리먼트에 애니메이션을 적용해주는 래퍼 컴포넌트
const AnimatedElement = ({ el, children }: { el: ElementNode, children: React.ReactNode }) => {
  const { animation, styles } = el;
  const baseClassName = "w-full flex";
  const baseStyle = { justifyContent: styles?.layerAlign || "flex-start" };

  if (!animation || animation.type === "none") {
    return (
      <div className={baseClassName} style={baseStyle}>
        {children}
      </div>
    );
  }

  let initialStyle: any = { opacity: 0 };
  let whileInViewStyle: any = { opacity: 1 };

  switch (animation.type) {
    case "slideUp": initialStyle.y = 50; whileInViewStyle.y = 0; break;
    case "slideDown": initialStyle.y = -50; whileInViewStyle.y = 0; break;
    case "slideLeft": initialStyle.x = 50; whileInViewStyle.x = 0; break;
    case "slideRight": initialStyle.x = -50; whileInViewStyle.x = 0; break;
    case "zoomIn": initialStyle.scale = 0.8; whileInViewStyle.scale = 1; break;
    case "fadeIn":
    default: break;
  }

  return (
    <motion.div
      initial={initialStyle}
      whileInView={whileInViewStyle}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: animation.duration || 0.5, delay: animation.delay || 0, ease: "easeOut" }}
      className={baseClassName}
      style={baseStyle}
    >
      {children}
    </motion.div>
  );
};

export default function BlockRenderer({ blocks }: { blocks: ContainerNode[] }) {
  const getWidthClass = (width: string) => {
    switch (width) {
      case "1/1": return "w-full md:w-full";
      case "1/2": return "w-full md:w-1/2";
      case "1/3": return "w-full md:w-1/3";
      case "2/3": return "w-full md:w-2/3";
      case "1/4": return "w-full md:w-1/4";
      case "3/4": return "w-full md:w-3/4";
      default: return "w-full";
    }
  };

  const adaptColorForDarkMode = (color: string | undefined) => {
    if (!color || color === "#000" || color === "#000000" || color === "#1e293b") return undefined;
    return color;
  };

  const adaptBgForDarkMode = (color: string | undefined) => {
    if (!color || color === "#fff" || color === "#ffffff" || color === "transparent") return undefined;
    return color;
  };

  const cleanHtmlForTheme = (html: string) => {
    if (!html) return "";
    return html
      .replace(/color:\s*(#000000|#000|#1e293b|#333333|#333|#111|#111111|rgb\(0,\s*0,\s*0\));?/gi, "")
      .replace(/background-color:\s*(#ffffff|#fff|transparent|rgb\(255,\s*255,\s*255\));?/gi, "")
      .replace(/style="\s*"/gi, "");
  };

  return (
    <div className="w-full flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
      {blocks.map((container) => (
        <AnimatedContainer key={container.id} container={container}>
          {container.columns.map((column) => (
            <div key={column.id} className={`${getWidthClass(column.width)} px-4 md:px-8 flex flex-col gap-6`}>
              {column.elements.map((el) => (
                // 💡 [변경] 기존 div 대신 AnimatedElement 래퍼를 사용하여 모든 엘리먼트에 애니메이션 적용
                <AnimatedElement key={el.id} el={el}>
                  
                  {/* 1. 텍스트 엘리먼트 */}
                  {el.type === "TEXT" && (
                    <div
                      style={{
                        fontSize: `${el.styles?.fontSize || 16}px`,
                        color: adaptColorForDarkMode(el.styles?.color),
                        textAlign: el.styles?.textAlign || "left",
                        fontFamily: el.styles?.fontFamily !== "default" ? el.styles?.fontFamily : "inherit",
                        width: el.styles?.width === "auto" ? "100%" : `${el.styles?.width}px`,
                        height: el.styles?.height === "auto" ? "auto" : `${el.styles?.height}px`,
                        fontWeight: el.styles?.fontWeight || "normal",
                        fontStyle: el.styles?.fontStyle || "normal",
                        textDecoration: el.styles?.textDecoration || "none",
                      }}
                      dangerouslySetInnerHTML={{ __html: cleanHtmlForTheme(el.content) }}
                      className="whitespace-pre-wrap break-words prose prose-slate dark:prose-invert max-w-none w-full"
                    />
                  )}

                  {/* 2. 이미지 엘리먼트 */}
                  {el.type === "IMAGE" && el.content && (
                    <img src={el.content} alt="Block Image" className="max-w-full h-auto object-cover rounded-lg shadow-sm" />
                  )}

                  {/* 3. 비디오 엘리먼트 */}
                  {el.type === "VIDEO" && el.content && (
                    <video src={el.content} controls className="max-w-full h-auto rounded-lg shadow-sm" />
                  )}

                  {/* 4. 오디오 엘리먼트 */}
                  {el.type === "AUDIO" && el.content && (
                    <audio src={el.content} controls className="w-full dark:opacity-90" />
                  )}

                  {/* 5. 버튼 엘리먼트 */}
                  {el.type === "BUTTON" && el.buttonStyles && (
                    <button
                      style={{
                        backgroundColor: el.buttonStyles.backgroundColor,
                        color: el.buttonStyles.color,
                        fontSize: `${el.buttonStyles.fontSize}px`,
                        width: `${el.buttonStyles.width}px`,
                        borderRadius: `${el.buttonStyles.borderRadius}px`,
                      }}
                      className="px-6 py-3 font-bold transition hover:opacity-90 shadow-sm"
                    >
                      {el.buttonStyles.text}
                    </button>
                  )}

                  {/* 6. 구분선 엘리먼트 */}
                  {el.type === "SEPARATOR" && (
                    <div className="w-full h-4 border-b-2 border-dashed border-slate-300 dark:border-slate-700"></div>
                  )}

                  {/* 7. 테이블 엘리먼트 */}
                  {el.type === "TABLE" && el.tableData && (
                    <div className="w-full overflow-x-auto my-2">
                      <table className="w-full border-collapse bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                        <tbody>
                          {Array.from({ length: el.tableData.rows }).map((_, r) => (
                            <tr key={r}>
                              {Array.from({ length: el.tableData.cols }).map((_, c) => {
                                const cellKey = `${r}-${c}`;
                                const cell = el.tableData.cells[cellKey];

                                if (!cell || !cell.isVisible) return null;

                                return (
                                  <td
                                    key={cellKey}
                                    rowSpan={cell.rowSpan}
                                    colSpan={cell.colSpan}
                                    className="p-3 break-words border-slate-300 dark:border-slate-700 prose prose-sm dark:prose-invert max-w-none"
                                    style={{
                                      textAlign: cell.textAlign,
                                      borderWidth: `${cell.borderWidth ?? 1}px`,
                                      borderColor: cell.borderColor === '#cbd5e1' ? undefined : cell.borderColor,
                                      borderStyle: 'solid'
                                    }}
                                  >
                                    <div dangerouslySetInnerHTML={{ __html: cleanHtmlForTheme(cell.content) }} className="w-full min-h-[20px]" />
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 8. 카드 엘리먼트 
                      💡 [변경] 이미 AnimatedElement 래퍼가 애니메이션을 처리하므로, 충돌 방지를 위해 motion.div를 일반 div로 변경 */}
                  {el.type === "CARD" && el.cardData && (
                    <div
                      style={{
                        borderStyle: 'solid',
                        borderWidth: `${el.cardData.borderWidth}px`,
                        borderColor: adaptColorForDarkMode(el.cardData.borderColor),
                        backgroundColor: adaptBgForDarkMode(el.cardData.backgroundColor),
                        borderRadius: `${el.cardData.borderRadius}px`,
                        padding: `${el.cardData.padding}px`,
                        alignItems: el.cardData.layout === 'col'
                          ? (el.styles?.textAlign === 'center' ? 'center' : el.styles?.textAlign === 'right' ? 'flex-end' : 'flex-start')
                          : (el.cardData.verticalAlign || 'center')
                      }}
                      className={`w-full transition-all flex gap-4 ${el.cardData.layout === 'col' ? 'flex-col' : 'flex-row'} 
                        ${adaptBgForDarkMode(el.cardData.backgroundColor) ? '' : 'bg-white dark:bg-slate-800'} 
                        ${adaptColorForDarkMode(el.cardData.borderColor) ? '' : 'border-slate-200 dark:border-slate-700'}
                        ${
                        el.cardData.shadow === 'sm' ? 'shadow-sm' : 
                        el.cardData.shadow === 'md' ? 'shadow-md' : 
                        el.cardData.shadow === 'lg' ? 'shadow-lg' : 
                        el.cardData.shadow === 'xl' ? 'shadow-xl' : 'shadow-none'
                      }`}
                    >
                      {el.cardData.iconUrl && (
                        <div className="flex-shrink-0">
                          <img src={el.cardData.iconUrl} style={{ width: el.cardData.iconSize, height: el.cardData.iconSize }} className="object-contain" alt="card-icon" />
                        </div>
                      )}

                      <div 
                        className="flex-grow w-full break-words prose prose-slate dark:prose-invert max-w-none" 
                        style={{
                          fontSize: el.styles?.fontSize ? `${el.styles.fontSize}px` : '16px',
                          color: adaptColorForDarkMode(el.styles?.color),
                          textAlign: el.styles?.textAlign || 'left',
                          fontFamily: el.styles?.fontFamily && el.styles.fontFamily !== 'default' ? el.styles.fontFamily : 'inherit',
                          fontWeight: el.styles?.fontWeight || 'normal',
                          fontStyle: el.styles?.fontStyle || 'normal',
                          textDecoration: el.styles?.textDecoration || 'none',
                        }}
                        dangerouslySetInnerHTML={{ __html: cleanHtmlForTheme(el.content) }} 
                      />
                    </div>
                  )}

                </AnimatedElement>
              ))}
            </div>
          ))}
        </AnimatedContainer>
      ))}
    </div>
  );
}