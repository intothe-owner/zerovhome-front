// @/components/main/SlideManager.tsx
import React from "react";
import { Film, Upload, Plus, LayoutPanelTop, Sparkles, ImagePlus } from "lucide-react";
import { SlideItem } from "@/types/types";

interface SlideManagerProps {
    sliderType: "none" | "image" | "video" | "header";
    setSliderType: (type: "none" | "image" | "video" | "header") => void;
    slides: SlideItem[];
    setSlides: (slides: SlideItem[]) => void;
    activeSlideFocus: { index: number; field: 'title' | 'desc' } | null;
    setActiveSlideFocus: (focus: { index: number; field: 'title' | 'desc' } | null) => void;
    defaultSlide: SlideItem;
    // 💡 페이지 헤더용 Props 추가
    pageMeta: { bgImage: string; bgTitle: string };
    setPageMeta: (meta: { bgImage: string; bgTitle: string }) => void;
    setMetaBgFile: (file: File | null) => void;
    setAiModalOpen?: (type: string, id?: string, content?: string) => void;
}

export default function SlideManager({
    sliderType, setSliderType, slides, setSlides, activeSlideFocus, setActiveSlideFocus, defaultSlide,
    pageMeta, setPageMeta, setMetaBgFile, setAiModalOpen
}: SlideManagerProps) {
    return (
        <div className="mb-8 p-6 bg-indigo-50/50 border border-indigo-200 rounded-2xl shadow-sm space-y-4">
            
            <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                    {sliderType === "header" ? <LayoutPanelTop size={20} className="text-indigo-600" /> : <Film size={20} className="text-indigo-600" />}
                    {sliderType === "header" ? "페이지 헤더 설정" : "화면 슬라이드 관리"}
                </h3>
                <div className="flex items-center gap-3">
                    <label className="text-sm font-bold text-slate-700">슬라이드 타입:</label>
                    <select
                        value={sliderType}
                        onChange={(e) => {
                            const type = e.target.value as "none" | "image" | "video" | "header";
                            setSliderType(type);

                            // 헤더나 사용 안 함을 선택하면 기존 슬라이드 데이터 비우기
                            if (type === "none" || type === "header") {
                                setSlides([]); 
                            } else {
                                const updatedSlides = slides.length > 0 
                                    ? slides.map(slide => ({ ...slide, type: type })) 
                                    : [{ ...defaultSlide, type: type }];
                                setSlides(updatedSlides);
                            }
                        }}
                        className="border border-slate-300 rounded px-3 py-1.5 text-sm font-bold bg-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="none">사용 안 함 (슬라이드 제거)</option>
                        <option value="image">이미지 슬라이드 (최대 5개)</option>
                        <option value="video">동영상 슬라이드 (최대 5개)</option>
                        <option value="header">페이지헤더</option>
                    </select>

                    {/* 헤더 선택 시에만 AI 버튼 노출 */}
                    {sliderType === "header" && setAiModalOpen && (
                        <button
                            onClick={() => setAiModalOpen('META', 'meta', JSON.stringify(pageMeta))}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-200 transition"
                        >
                            <Sparkles size={14} /> AI로 제목/배경 생성
                        </button>
                    )}
                </div>
            </div>

            {/* 💡 1. 슬라이드 (이미지/비디오) UI */}
            {(sliderType === "image" || sliderType === "video") && (
                <div className="space-y-6">
                    {slides.map((slide, idx) => {
                        const isTitleActive = activeSlideFocus?.index === idx && activeSlideFocus?.field === 'title';
                        const isDescActive = activeSlideFocus?.index === idx && activeSlideFocus?.field === 'desc';

                        return (
                            <div key={idx} className="slide-box p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4 relative">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-700">슬라이드 #{idx + 1}</span>
                                    {slides.length > 1 && (
                                        <button onClick={() => setSlides(slides.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 text-xs font-bold">삭제</button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">
                                            {sliderType === "video" ? "동영상 파일 업로드" : "이미지 파일 업로드"}
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
                                                    delete updated[idx].file;
                                                    setSlides(updated);
                                                }} className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded text-xs shadow-sm">변경</button>
                                            </div>
                                        ) : (
                                            <label className="h-36 bg-slate-50 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 rounded cursor-pointer hover:border-indigo-500 transition">
                                                <Upload size={20} className="mb-1 text-indigo-500" />
                                                <span className="text-[11px] font-bold text-slate-600">파일 첨부 (클릭/드래그)</span>
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
                                                            updated[idx].file = file;
                                                            setSlides(updated);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>

                                    <div className="md:col-span-2 space-y-3">
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
                                                    color: slide.titleStyle.color,
                                                    fontFamily: slide.titleStyle.fontFamily !== 'default' ? slide.titleStyle.fontFamily : 'inherit',
                                                }}
                                                className="border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:border-indigo-500 font-bold min-h-[40px] cursor-text"
                                                dangerouslySetInnerHTML={{ __html: slide.titleHtml }}
                                            />
                                        </div>

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
                                                    color: slide.descStyle.color,
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

                    {slides.length < 5 && (
                        <button
                            onClick={() => setSlides([...slides, {
                                type: sliderType as 'image' | 'video',
                                mediaUrl: "",
                                titleHtml: "",
                                descHtml: "",
                                titleStyle: { fontSize: 24, color: "#1e293b", fontFamily: "default", textAlign: "left" },
                                descStyle: { fontSize: 16, color: "#64748b", fontFamily: "default", textAlign: "left" }
                            }])}
                            className="w-full py-2.5 border-2 border-dashed border-indigo-300 text-indigo-600 bg-white hover:bg-indigo-50/50 rounded-xl font-bold text-sm transition flex items-center justify-center gap-1.5"
                        >
                            <Plus size={16} /> 
                            {sliderType === "video" ? "동영상" : "이미지"} 슬라이드 추가 ({slides.length}/5)
                        </button>
                    )}
                </div>
            )}

            {/* 💡 2. 페이지 헤더 (header) UI */}
            {sliderType === "header" && (
                <div className="grid grid-cols-2 gap-6 bg-transparent animate-in fade-in slide-in-from-top-2">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">상단 배경 제목 (텍스트)</label>
                        <input
                            type="text"
                            value={pageMeta.bgTitle}
                            onChange={(e) => setPageMeta({ ...pageMeta, bgTitle: e.target.value })}
                            placeholder="페이지 기본 제목 대신 표시될 배경 위 제목"
                            className="w-full border border-slate-300 p-2.5 rounded-lg outline-none focus:border-indigo-500 font-bold text-slate-700 bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">상단 배경 이미지</label>
                        
                        {pageMeta.bgImage ? (
                            <div className="relative group rounded-lg overflow-hidden border border-slate-200 w-full h-24 bg-slate-100">
                                <img src={pageMeta.bgImage} className="w-full h-full object-cover" alt="배경" />
                                
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                    <label className="flex items-center gap-1 bg-white text-slate-800 px-3 py-1.5 rounded text-xs font-bold cursor-pointer shadow hover:bg-slate-100">
                                        <ImagePlus size={14} /> 첨부
                                        <input type="file" accept="image/*" onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                setMetaBgFile(e.target.files[0]);
                                                setPageMeta({ ...pageMeta, bgImage: URL.createObjectURL(e.target.files[0]) });
                                            }
                                        }} className="hidden" />
                                    </label>
                                    <button 
                                        onClick={() => {
                                            setMetaBgFile(null);
                                            setPageMeta({ ...pageMeta, bgImage: '' });
                                        }} 
                                        className="bg-red-500 text-white px-3 py-1.5 rounded text-xs font-bold shadow hover:bg-red-600"
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition bg-white">
                                <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><ImagePlus size={18}/> 이미지 첨부하기</span>
                                <input type="file" accept="image/*" onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        setMetaBgFile(e.target.files[0]);
                                        setPageMeta({ ...pageMeta, bgImage: URL.createObjectURL(e.target.files[0]) });
                                    }
                                }} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}