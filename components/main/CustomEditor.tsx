// src/components/CustomEditor.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Image as ImageIcon } from 'lucide-react';

const KOREAN_FONTS = [
  { name: '기본 폰트', value: 'inherit' },
  { name: '노토 산스', value: "'Noto Sans KR', sans-serif" },
  { name: '나눔 고딕', value: "'Nanum Gothic', sans-serif" },
  { name: '나눔 명조', value: "'Nanum Myeongjo', serif" },
  { name: '나눔 펜', value: "'Nanum Pen Script', cursive" },
  { name: '주아', value: "'Jua', sans-serif" },
  { name: '도현', value: "'Do Hyeon', sans-serif" },
  { name: '블랙 한 산스', value: "'Black Han Sans', sans-serif" },
  { name: '구기', value: "'Gugi', cursive" },
  { name: '감자꽃', value: "'Gamja Flower', cursive" },
  { name: '스타일리시', value: "'Stylish', sans-serif" }
];

interface CustomEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageAttach: (file: File, id: string) => void;
  placeholder?: string;
}

export default function CustomEditor({ value, onChange, onImageAttach, placeholder }: CustomEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const [resizer, setResizer] = useState<{ el: HTMLImageElement, width: number, height: number, top: number, left: number } | null>(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const execCommand = (command: string, cmdValue: string | undefined = undefined) => {
    document.execCommand(command, false, cmdValue);
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const id = `img_${Date.now()}`;
    const blobUrl = URL.createObjectURL(file);
    
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, `<img src="${blobUrl}" data-file-id="${id}" style="display: inline-block; max-width: 100%; border-radius: 8px;" />`);
    
    if (editorRef.current) onChange(editorRef.current.innerHTML);
    
    onImageAttach(file, id);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      updateResizerBox(img);
    } else {
      setResizer(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (resizer && (e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault();
      resizer.el.remove();
      setResizer(null);
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    }
  };

  const updateResizerBox = (img: HTMLImageElement) => {
    const container = editorRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    const iRect = img.getBoundingClientRect();
    
    setResizer({
      el: img,
      width: iRect.width,
      height: iRect.height,
      // 선택 상자는 스크롤 영역 밖의 오버레이이므로 현재 화면 좌표를 사용한다.
      // scrollTop/scrollLeft를 더하면 스크롤한 만큼 손잡이가 이미지에서 벗어난다.
      top: iRect.top - cRect.top,
      left: iRect.left - cRect.left
    });
  };

  // 일반적인 편집기처럼 드래그한 손잡이의 반대편을 고정점으로 사용한다.
  // 모서리는 원본 비율을 유지하고, 변 손잡이는 해당 축만 변경한다.
  const startDragResize = (e: React.MouseEvent, direction: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e') => {
    e.preventDefault();
    e.stopPropagation();
    if (!resizer) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = resizer.width;
    const startHeight = resizer.height;
    const ratio = startHeight / startWidth;

    const img = resizer.el;
    const startLeft = Number.parseFloat(img.style.left || '0') || 0;
    const startTop = Number.parseFloat(img.style.top || '0') || 0;
    const minSize = 30;

    // left/top 보정이 실제 이미지에 적용되도록 기준 위치를 만든다.
    img.style.position = 'relative';

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newLeft = startLeft;
      let newTop = startTop;

      // 포인터 이동을 이미지 대각선에 투영해 가로·세로 어느 방향으로
      // 모서리를 끌어도 자연스럽게 비율이 유지되도록 한다.
      const diagonalWidthDelta = (xSign: 1 | -1, ySign: 1 | -1) =>
        ((xSign * deltaX * startWidth) + (ySign * deltaY * startHeight)) *
        startWidth / (startWidth ** 2 + startHeight ** 2);

      if (direction === 'e') {
        // 오른쪽 드래그: 왼쪽이 고정되고 너비만 늘어남
        newWidth = startWidth + deltaX;
      } else if (direction === 'w') {
        // 왼쪽 드래그: 오른쪽이 고정되도록 너비 조절
        newWidth = startWidth - deltaX;
        newLeft = startLeft + (startWidth - newWidth);
      } else if (direction === 's') {
        // 아래쪽 드래그: 위쪽이 고정되고 높이만 늘어남
        newHeight = startHeight + deltaY;
      } else if (direction === 'n') {
        // 위쪽 드래그: 아래쪽이 고정되도록 높이 조절
        newHeight = startHeight - deltaY;
        newTop = startTop + (startHeight - newHeight);
      } else if (direction === 'se') {
        // 우하단 모서리: 좌상단 고정
        newWidth = startWidth + diagonalWidthDelta(1, 1);
        newHeight = newWidth * ratio;
      } else if (direction === 'sw') {
        // 좌하단 모서리: 우상단 고정
        newWidth = startWidth + diagonalWidthDelta(-1, 1);
        newHeight = newWidth * ratio;
        newLeft = startLeft + (startWidth - newWidth);
      } else if (direction === 'ne') {
        // 우상단 모서리: 좌하단 고정
        newWidth = startWidth + diagonalWidthDelta(1, -1);
        newHeight = newWidth * ratio;
        newTop = startTop + (startHeight - newHeight);
      } else if (direction === 'nw') {
        // 좌상단 모서리: 우하단 고정
        newWidth = startWidth + diagonalWidthDelta(-1, -1);
        newHeight = newWidth * ratio;
        newLeft = startLeft + (startWidth - newWidth);
        newTop = startTop + (startHeight - newHeight);
      }

      // 최소 크기에서 멈추며 고정점이 튀지 않도록 좌표도 함께 다시 계산한다.
      if (newWidth < minSize) {
        newWidth = minSize;
        if (direction.includes('w')) newLeft = startLeft + startWidth - minSize;
      }
      if (newHeight < minSize) {
        newHeight = minSize;
        if (direction.includes('n')) newTop = startTop + startHeight - minSize;
      }

      img.style.width = `${newWidth}px`;
      img.style.height = `${newHeight}px`;
      img.style.left = `${newLeft}px`;
      img.style.top = `${newTop}px`;
      updateResizerBox(img);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleAlignment = (align: 'left' | 'center' | 'right') => {
    if (resizer) {
      const img = resizer.el;
      // 정렬을 바꾸면 리사이즈 중 사용한 위치 보정을 초기화한다.
      img.style.left = '0px';
      img.style.top = '0px';
      if (align === 'center') {
        img.style.display = 'block';
        img.style.margin = '10px auto';
        img.style.float = 'none';
      } else if (align === 'left') {
        img.style.display = 'inline-block';
        img.style.margin = '10px 15px 10px 0';
        img.style.float = 'left';
      } else if (align === 'right') {
        img.style.display = 'inline-block';
        img.style.margin = '10px 0 10px 15px';
        img.style.float = 'right';
      }
      updateResizerBox(img);
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    } else {
      const command = align === 'center' ? 'justifyCenter' : align === 'right' ? 'justifyRight' : 'justifyLeft';
      execCommand(command);
    }
  };

  const handleStyle = { position: 'absolute', width: 12, height: 12, backgroundColor: '#3b82f6', pointerEvents: 'auto', borderRadius: '50%', boxShadow: '0 0 4px rgba(0,0,0,0.3)', zIndex: 20 } as React.CSSProperties;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all relative">
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border-b border-slate-200">
        <select onChange={(e) => execCommand('fontName', e.target.value)} className="border border-slate-300 rounded p-1.5 text-sm outline-none cursor-pointer hover:border-slate-400 bg-white min-w-[110px]">
          {KOREAN_FONTS.map(font => (
            <option key={font.name} value={font.value} style={{ fontFamily: font.value }}>{font.name}</option>
          ))}
        </select>

        <select onChange={(e) => execCommand('fontSize', e.target.value)} className="border border-slate-300 rounded p-1.5 text-sm outline-none cursor-pointer hover:border-slate-400 bg-white">
          <option value="">크기</option>
          {[1, 2, 3, 4, 5, 6, 7].map(size => <option key={size} value={size}>{size}</option>)}
        </select>
        
        <div className="w-px h-6 bg-slate-300 mx-1"></div>

        <button type="button" onClick={() => execCommand('bold')} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 transition-colors" title="굵게"><Bold size={16} /></button>
        <button type="button" onClick={() => execCommand('italic')} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 transition-colors" title="이탤릭"><Italic size={16} /></button>
        <button type="button" onClick={() => execCommand('underline')} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 transition-colors" title="밑줄"><Underline size={16} /></button>
        
        <div className="flex items-center gap-1 hover:bg-slate-200 p-1 rounded cursor-pointer relative overflow-hidden transition-colors" title="글자 색상">
          <span className="text-sm font-bold ml-1 text-slate-700">A</span>
          <input type="color" onChange={(e) => execCommand('foreColor', e.target.value)} className="w-5 h-5 cursor-pointer bg-transparent border-none p-0 outline-none" />
        </div>

        <div className="w-px h-6 bg-slate-300 mx-1"></div>

        <button type="button" onClick={() => handleAlignment('left')} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 transition-colors" title="왼쪽 정렬"><AlignLeft size={16} /></button>
        <button type="button" onClick={() => handleAlignment('center')} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 transition-colors" title="가운데 정렬"><AlignCenter size={16} /></button>
        <button type="button" onClick={() => handleAlignment('right')} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 transition-colors" title="오른쪽 정렬"><AlignRight size={16} /></button>

        <div className="w-px h-6 bg-slate-300 mx-1"></div>

        <button type="button" onClick={() => imageInputRef.current?.click()} className="px-3 h-8 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-bold flex items-center gap-1.5 border border-blue-200 transition-colors" title="이미지 첨부">
          <ImageIcon size={16} /> 이미지
        </button>
        <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageSelect} className="hidden" />
      </div>

      <div className="relative">
        {resizer && (
          <div style={{ position: 'absolute', top: resizer.top, left: resizer.left, width: resizer.width, height: resizer.height, border: '2px dashed #3b82f6', pointerEvents: 'none', zIndex: 10 }}>
            <div style={{ ...handleStyle, left: -6, top: -6, cursor: 'nwse-resize' }} onMouseDown={(e) => startDragResize(e, 'nw')} />
            <div style={{ ...handleStyle, left: '50%', top: -6, transform: 'translateX(-50%)', cursor: 'ns-resize' }} onMouseDown={(e) => startDragResize(e, 'n')} />
            <div style={{ ...handleStyle, right: -6, top: -6, cursor: 'nesw-resize' }} onMouseDown={(e) => startDragResize(e, 'ne')} />
            
            <div style={{ ...handleStyle, left: -6, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' }} onMouseDown={(e) => startDragResize(e, 'w')} />
            <div style={{ ...handleStyle, right: -6, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' }} onMouseDown={(e) => startDragResize(e, 'e')} />
            
            <div style={{ ...handleStyle, left: -6, bottom: -6, cursor: 'nesw-resize' }} onMouseDown={(e) => startDragResize(e, 'sw')} />
            <div style={{ ...handleStyle, left: '50%', bottom: -6, transform: 'translateX(-50%)', cursor: 'ns-resize' }} onMouseDown={(e) => startDragResize(e, 's')} />
            <div style={{ ...handleStyle, right: -6, bottom: -6, cursor: 'nwse-resize' }} onMouseDown={(e) => startDragResize(e, 'se')} />
          </div>
        )}

        <div
          ref={editorRef}
          contentEditable
          onInput={(e) => onChange(e.currentTarget.innerHTML)}
          onClick={handleEditorClick}
          onKeyDown={handleKeyDown}
          className="w-full h-[500px] overflow-y-auto p-5 outline-none text-slate-800 leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', position: 'relative' }}
          data-placeholder={placeholder}
        />
      </div>
    </div>
  );
}