"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, FileText, Type, Image as ImageIcon, Trash2, Save, FolderKanban, Link as LinkIcon, PenTool, Plus } from "lucide-react";

// 💡 텍스트 필드 타입 정의 (두 번째 엑셀 컬럼 속성 추가)
type TextField = {
  name: string;
  layout: 'FULL' | 'HALF';
  isAutoFill?: boolean;
  mappedExcelColumn?: string;
  mappedExcelColumn2?: string; // 👈 새로 추가: 두 번째 연결할 엑셀 컬럼
  defaultValue?: string; 
};

export default function ReportFormConfigPage() {
  const params = useParams();
  const siteId = params.id;
  const router = useRouter();

  const [siteTitle, setSiteTitle] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");

  const [textFields, setTextFields] = useState<TextField[]>([]);
  const [imageFields, setImageFields] = useState<{name: string, layout: 'FULL' | 'HALF'}[]>([]);
  
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);

  // 텍스트 필드 입력 상태
  const [newText, setNewText] = useState("");
  const [textLayout, setTextLayout] = useState<'FULL' | 'HALF'>("HALF");
  
  // 자동입력 & 고정값 관련 상태
  const [isTextAutoFill, setIsTextAutoFill] = useState(false);
  const [textMappedExcelColumn, setTextMappedExcelColumn] = useState("");
  const [textMappedExcelColumn2, setTextMappedExcelColumn2] = useState(""); // 👈 두 번째 컬럼 상태 추가
  const [textDefaultValue, setTextDefaultValue] = useState(""); 

  const [newImage, setNewImage] = useState("");
  const [imageLayout, setImageLayout] = useState<'FULL' | 'HALF'>("HALF");
  
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  const getAuthHeaders = () => {
    const rawToken = localStorage.getItem("token") || "";
    const cleanToken = rawToken.replace(/^['"]|['"]$/g, ''); 
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cleanToken}`
    };
  };

  useEffect(() => {
    const fetchFormConfig = async () => {
      try {
        const siteRes = await axios.get(`${API_BASE_URL}/api/work-sites`, {
          headers: getAuthHeaders()
        });
        const currentSite = siteRes.data.data.find((s: any) => s.id === Number(siteId));
        if (currentSite) {
          setSiteTitle(currentSite.title);
          setExcelHeaders(currentSite.excelHeaders || []);
        }

        const res = await axios.get(`${API_BASE_URL}/api/reports/work-sites/${siteId}/report-form`, {
          headers: getAuthHeaders()
        });
        
        if (res.data.ok && res.data.data) {
          setCategories(res.data.data.categories || []);
          setTextFields(res.data.data.textFields || []);
          setImageFields(res.data.data.imageFields || []);
        }
      } catch (err) {
        console.error("초기 데이터 로딩 오류:", err);
      }
    };
    if (siteId) fetchFormConfig();
  }, [siteId]);

  const handleAddCategory = () => {
    if (!newCategory.trim() || categories.includes(newCategory.trim())) return;
    setCategories([...categories, newCategory.trim()]);
    setNewCategory("");
  };

  const handleAddField = (type: "text" | "image") => {
    if (type === "text" && newText.trim()) {
      setTextFields([...textFields, { 
        name: newText.trim(), 
        layout: textLayout,
        isAutoFill: isTextAutoFill,
        // 💡 1, 2번째 컬럼 모두 저장
        mappedExcelColumn: isTextAutoFill && textMappedExcelColumn ? textMappedExcelColumn : undefined,
        mappedExcelColumn2: isTextAutoFill && textMappedExcelColumn && textMappedExcelColumn2 ? textMappedExcelColumn2 : undefined,
        defaultValue: isTextAutoFill && !textMappedExcelColumn ? textDefaultValue.trim() : undefined
      }]);
      // 상태 초기화
      setNewText("");
      setIsTextAutoFill(false);
      setTextMappedExcelColumn("");
      setTextMappedExcelColumn2(""); // 👈 초기화 추가
      setTextDefaultValue(""); 
    } else if (type === "image" && newImage.trim()) {
      setImageFields([...imageFields, { name: newImage.trim(), layout: imageLayout }]);
      setNewImage("");
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/api/reports/work-sites/${siteId}/report-form`, {
        categories,
        textFields,
        imageFields
      }, {
        headers: getAuthHeaders()
      });
      alert("보고서 양식이 저장되었습니다.");
      router.push(`/admin/works/${siteId}`);
    } catch (err) {
      console.error("저장 실패:", err);
      alert("저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/admin/works/${siteId}`} className="p-2 bg-white rounded-full border border-slate-300 hover:bg-slate-50 transition">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-indigo-600" /> 고급 보고서 양식 설정
          </h2>
        </div>
        {siteTitle && (
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-xl text-sm font-bold shadow-sm">
            <FolderKanban size={16} className="text-indigo-500" />
            현장: {siteTitle}
          </div>
        )}
      </div>

      {/* 카테고리 설정 카드 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <h3 className="text-lg font-bold text-slate-800">기기/작업 카테고리 설정 (예: 에어컨, 공기청정기)</h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newCategory} 
            onChange={e => setNewCategory(e.target.value)} 
            placeholder="카테고리명 추가" 
            className="border border-slate-300 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 flex-1 bg-slate-50" 
          />
          <button onClick={handleAddCategory} className="bg-slate-800 text-white px-5 py-2 rounded-xl font-bold hover:bg-slate-900 transition">추가</button>
        </div>
        <div className="flex gap-2 flex-wrap pt-2">
          {categories.length === 0 && <p className="text-sm text-slate-400">등록된 카테고리가 없습니다.</p>}
          {categories.map((cat, i) => (
            <div key={i} className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-lg text-sm">
              <span>{cat}</span>
              <button onClick={() => setCategories(categories.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 텍스트 필드 설정 카드 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Type size={20} className="text-blue-500" /> 텍스트 입력 항목 (엑셀 2중 연동 지원)
          </h3>
          <div className="flex flex-col gap-3">
            <input 
              type="text" 
              placeholder="항목명 (예: 전체 주소, 용역명)" 
              value={newText} 
              onChange={e => setNewText(e.target.value)} 
              className="border border-slate-300 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-slate-50" 
            />
            
            <div className="flex flex-wrap items-center gap-2">
              <select 
                value={textLayout} 
                onChange={e => setTextLayout(e.target.value as any)} 
                className="border border-slate-300 px-3 py-2 rounded-xl text-slate-700 bg-slate-50 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[120px]"
              >
                <option value="HALF">2칸 배열</option>
                <option value="FULL">1칸 배열</option>
              </select>

              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 cursor-pointer border border-slate-300 px-3 py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 transition">
                <input 
                  type="checkbox" 
                  checked={isTextAutoFill}
                  onChange={e => setIsTextAutoFill(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                자동입력 설정
              </label>
              
              <button onClick={() => handleAddField("text")} className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-blue-700 transition">추가</button>
            </div>

            {/* 💡 자동입력 체크 시 노출되는 영역 (2개 컬럼 지원) */}
            {isTextAutoFill && (
              <div className="flex flex-col gap-2 bg-indigo-50 border border-indigo-100 p-3 rounded-xl animate-in fade-in slide-in-from-top-1">
                <div className="flex items-start md:items-center gap-2 flex-col md:flex-row">
                  <div className="flex items-center gap-2 w-full">
                    <LinkIcon size={16} className="text-indigo-500 shrink-0" />
                    <select
                      value={textMappedExcelColumn}
                      onChange={e => {
                        setTextMappedExcelColumn(e.target.value);
                        if (!e.target.value) setTextMappedExcelColumn2(""); // 첫번째를 지우면 두번째도 초기화
                      }}
                      className="w-full bg-white border border-indigo-200 text-sm px-3 py-2 rounded-lg text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                    >
                      <option value="">직접 고정값 입력 (매핑 안함)</option>
                      {excelHeaders.length === 0 && <option disabled>업로드된 엑셀 데이터가 없습니다.</option>}
                      {excelHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* 💡 첫 번째 엑셀 항목이 선택된 경우에만 두 번째 선택란 표시 */}
                  {textMappedExcelColumn !== "" && (
                    <div className="flex items-center gap-2 w-full md:pl-0 pl-6">
                      <Plus size={16} className="text-indigo-400 shrink-0" />
                      <select
                        value={textMappedExcelColumn2}
                        onChange={e => setTextMappedExcelColumn2(e.target.value)}
                        className="w-full bg-white border border-indigo-200 text-sm px-3 py-2 rounded-lg text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                      >
                        <option value="">추가 연결 안함 (선택)</option>
                        {excelHeaders.map(header => (
                          <option key={`second_${header}`} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* 직접 고정값 입력 텍스트 박스 */}
                {textMappedExcelColumn === "" && (
                  <div className="flex items-center gap-2 pl-6 mt-1 animate-in fade-in">
                    <PenTool size={14} className="text-slate-400" />
                    <input
                      type="text"
                      placeholder="보고서에 고정으로 들어갈 내용을 입력 (예: 김남관)"
                      value={textDefaultValue}
                      onChange={e => setTextDefaultValue(e.target.value)}
                      className="w-full bg-white border border-indigo-200 text-sm px-3 py-2 rounded-lg text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2">
            {textFields.length === 0 && <p className="text-sm text-slate-400 text-center py-4">추가된 항목이 없습니다.</p>}
            {textFields.map((field, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex flex-col gap-0.5 w-full pr-4">
                  <div className="font-semibold text-slate-700 flex items-center gap-2">
                    {field.name} 
                    <span className="text-xs px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded-md font-normal shrink-0">
                      {field.layout === 'FULL' ? '전체 칸' : '절반 칸'}
                    </span>
                  </div>
                  {/* 💡 추가된 필드의 연동/고정값 정보 표시 (2개 모두 표시) */}
                  {field.isAutoFill && (
                    <span className="text-xs font-medium flex items-center gap-1 mt-1 text-indigo-600 truncate">
                      {field.mappedExcelColumn ? (
                        <>
                          <LinkIcon size={12} className="shrink-0" /> 
                          <span className="truncate">
                            [{field.mappedExcelColumn}] 
                            {field.mappedExcelColumn2 && ` + [${field.mappedExcelColumn2}]`} 연동됨
                          </span>
                        </>
                      ) : (
                        <><PenTool size={12} className="shrink-0" /> 고정값: {field.defaultValue || "(빈 값)"}</>
                      )}
                    </span>
                  )}
                </div>
                <button onClick={() => setTextFields(textFields.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500 p-1 shrink-0">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 공통 사진 필드 설정 카드 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ImageIcon size={20} className="text-emerald-500" /> 공통 사진 항목 (1장/2장 선택)
          </h3>
          <div className="flex flex-col gap-2.5">
            <input 
              type="text" 
              placeholder="사진 항목명 (예: 작업 전)" 
              value={newImage} 
              onChange={e => setNewImage(e.target.value)} 
              className="border border-slate-300 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-slate-50" 
            />
            <div className="flex gap-2">
              <select 
                value={imageLayout} 
                onChange={e => setImageLayout(e.target.value as any)} 
                className="border border-slate-300 px-3 py-2 rounded-xl text-slate-700 bg-slate-50 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="HALF">한 줄에 2장 배치 (작게)</option>
                <option value="FULL">한 줄에 1장 배치 (크게)</option>
              </select>
              <button onClick={() => handleAddField("image")} className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-emerald-700 transition">추가</button>
            </div>
          </div>
          <div className="space-y-2 pt-2">
            {imageFields.length === 0 && <p className="text-sm text-slate-400 text-center py-4">추가된 항목이 없습니다.</p>}
            {imageFields.map((field, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="font-semibold text-slate-700">{field.name}</span>
                  <span className="text-xs px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded-md font-normal ml-2">
                    {field.layout === 'FULL' ? '크게 1장' : '작게 2장'}
                  </span>
                </div>
                <button onClick={() => setImageFields(imageFields.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500 p-1">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button 
          onClick={handleSave} 
          disabled={loading} 
          className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
        >
          {loading ? "저장 중..." : "양식 최종 저장"}
        </button>
      </div>
    </div>
  );
}