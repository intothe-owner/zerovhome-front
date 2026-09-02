"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, FileText, Type, Image as ImageIcon, Trash2, Save, FolderKanban } from "lucide-react";

export default function ReportFormConfigPage() {
  const params = useParams();
  const siteId = params.id;
  const router = useRouter();

  const [siteTitle, setSiteTitle] = useState("");
  // 기본값 제거 -> 빈 배열([])로 초기화
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");

  const [textFields, setTextFields] = useState<{name: string, layout: 'FULL' | 'HALF'}[]>([]);
  // 사진 항목은 카테고리별 구분 없이 공통 항목으로 관리
  const [imageFields, setImageFields] = useState<{name: string, layout: 'FULL' | 'HALF'}[]>([]);
  
  const [newText, setNewText] = useState("");
  const [textLayout, setTextLayout] = useState<'FULL' | 'HALF'>("HALF");

  const [newImage, setNewImage] = useState("");
  const [imageLayout, setImageLayout] = useState<'FULL' | 'HALF'>("HALF");
  
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  // 💡 [추가됨] API 통신을 위한 인증 헤더 생성 함수
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
        // 💡 [수정됨] 인증 헤더 추가
        const siteRes = await axios.get(`${API_BASE_URL}/api/work-sites`, {
          headers: getAuthHeaders()
        });
        const currentSite = siteRes.data.data.find((s: any) => s.id === Number(siteId));
        if (currentSite) setSiteTitle(currentSite.title);

        // 💡 [수정됨] 인증 헤더 추가
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
      setTextFields([...textFields, { name: newText.trim(), layout: textLayout }]);
      setNewText("");
    } else if (type === "image" && newImage.trim()) {
      setImageFields([...imageFields, { name: newImage.trim(), layout: imageLayout }]);
      setNewImage("");
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // 💡 [수정됨] 저장 시에도 인증 헤더 추가
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
            <Type size={20} className="text-blue-500" /> 텍스트 입력 항목 (칸 지정)
          </h3>
          <div className="flex flex-col gap-2.5">
            <input 
              type="text" 
              placeholder="항목명 (예: 특이사항)" 
              value={newText} 
              onChange={e => setNewText(e.target.value)} 
              className="border border-slate-300 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-slate-50" 
            />
            <div className="flex gap-2">
              <select 
                value={textLayout} 
                onChange={e => setTextLayout(e.target.value as any)} 
                className="border border-slate-300 px-3 py-2 rounded-xl text-slate-700 bg-slate-50 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="HALF">2칸 배열 (절반 크기)</option>
                <option value="FULL">1칸 배열 (전체 크기)</option>
              </select>
              <button onClick={() => handleAddField("text")} className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-blue-700 transition">추가</button>
            </div>
          </div>
          <div className="space-y-2 pt-2">
            {textFields.length === 0 && <p className="text-sm text-slate-400">추가된 항목이 없습니다.</p>}
            {textFields.map((field, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-semibold text-slate-700">{field.name} <span className="text-xs text-blue-600 ml-2 font-normal">({field.layout === 'FULL' ? '전체 칸' : '절반 칸'})</span></span>
                <button onClick={() => setTextFields(textFields.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500 p-1">
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
            {imageFields.length === 0 && <p className="text-sm text-slate-400">추가된 항목이 없습니다.</p>}
            {imageFields.map((field, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="font-semibold text-slate-700">{field.name}</span>
                  <span className="text-xs text-emerald-600 ml-2 font-normal">({field.layout === 'FULL' ? '크게 1장' : '작게 2장'})</span>
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