"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, FileText, Type, Image as ImageIcon, Save, Download, Loader2 } from "lucide-react";

// 타입 정의
type TextField = {
  name: string;
  layout: 'FULL' | 'HALF';
  isAutoFill?: boolean;
  mappedExcelColumn?: string;
  mappedExcelColumn2?: string;
  defaultValue?: string; 
};

type ImageField = {
  name: string;
  name2?: string;
  layout: 'FULL' | 'HALF' | 'SPLIT';
};

export default function MyReportInputFormPage() {
  const params = useParams();
  const siteId = params.id;
  const router = useRouter();

  const [siteTitle, setSiteTitle] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  
  // 관리자가 세팅한 양식(스키마)
  const [textFields, setTextFields] = useState<TextField[]>([]);
  const [imageFields, setImageFields] = useState<ImageField[]>([]);
  
  // 사용자가 입력한 보고서 데이터 (Key-Value)
  const [reportData, setReportData] = useState<Record<string, string>>({});
  
  const [isFetching, setIsFetching] = useState(true);
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
    const fetchFormConfigAndData = async () => {
      try {
        setIsFetching(true);
        
        // 1. 현장 정보 조회
        const siteRes = await axios.get(`${API_BASE_URL}/api/work-sites/my-sites`, {
          headers: getAuthHeaders()
        });
        const currentSite = siteRes.data.data?.find((s: any) => s.id === Number(siteId));
        
        if (!currentSite) {
            alert("권한이 없거나 존재하지 않는 현장입니다.");
            router.push("/dashboard");
            return;
        }
        setSiteTitle(currentSite.title || currentSite.name);

        // 2. 관리자가 설정한 보고서 폼 양식 조회
        const configRes = await axios.get(`${API_BASE_URL}/api/reports/work-sites/${siteId}/report-form`, {
          headers: getAuthHeaders()
        });
        
        if (configRes.data.ok && configRes.data.data) {
          const fetchedTextFields = configRes.data.data.textFields || [];
          setCategories(configRes.data.data.categories || []);
          setTextFields(fetchedTextFields);
          setImageFields(configRes.data.data.imageFields || []);
          
          // 기존에 작성된 데이터가 없다면, 자동 입력(defaultValue) 값을 초기값으로 셋팅
          const initialData: Record<string, string> = {};
          fetchedTextFields.forEach((field: TextField) => {
            if (field.isAutoFill && field.defaultValue && !field.mappedExcelColumn) {
              initialData[field.name] = field.defaultValue;
            } else {
              initialData[field.name] = "";
            }
          });
          setReportData(initialData);
        }

        // 3. 만약 이미 작성 중이던 보고서 데이터가 있다면 불러오기 (백엔드 API 구성에 따라 엔드포인트는 변경 필요)
        try {
          const reportRes = await axios.get(`${API_BASE_URL}/api/reports/${siteId}`, {
            headers: getAuthHeaders()
          });
          if (reportRes.data.ok && reportRes.data.data?.content) {
             setReportData(prev => ({ ...prev, ...reportRes.data.data.content }));
          }
        } catch (e) {
          // 아직 작성된 보고서가 없는 경우 (무시)
          console.log("기존 작성된 보고서 없음");
        }
        
      } catch (err) {
        console.error("데이터 로딩 오류:", err);
        alert("보고서 양식을 불러오지 못했습니다.");
        router.back();
      } finally {
        setIsFetching(false);
      }
    };
    
    if (siteId) fetchFormConfigAndData();
  }, [siteId, router]);

  // 입력 핸들러
  const handleInputChange = (fieldName: string, value: string) => {
    setReportData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // 보고서 데이터 저장
  const handleSave = async () => {
    try {
      setLoading(true);
      // 저장용 엔드포인트는 백엔드 설계에 따라 다를 수 있습니다.
      await axios.post(`${API_BASE_URL}/api/reports/${siteId}`, {
        content: reportData
      }, {
        headers: getAuthHeaders()
      });
      alert("보고서 내용이 임시 저장되었습니다.");
    } catch (err) {
      console.error("저장 실패:", err);
      alert("보고서 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  // 관리자가 양식을 등록하지 않은 경우
  if (textFields.length === 0 && imageFields.length === 0) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6 pt-10">
         <div className="flex items-center gap-4 mb-6">
          <Link href={`/dashboard/works/${siteId}`} className="p-2 bg-white rounded-full border border-slate-300 hover:bg-slate-50 transition">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <h2 className="text-2xl font-bold text-slate-800">최종 보고서 작성</h2>
        </div>
        <div className="bg-white p-16 rounded-2xl shadow-sm border border-slate-200 text-center">
          <FileText size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">지정된 보고서 양식이 없습니다.</h3>
          <p className="text-slate-500 text-sm">현장 관리자(본사)가 양식을 구성한 후 작성할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 pt-10">
      
      {/* 1. 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/works/${siteId}`} className="p-2 bg-white rounded-full border border-slate-300 hover:bg-slate-50 transition shadow-sm">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <FileText className="text-indigo-600" /> 완료 보고서 작성
            </h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">현장: {siteTitle}</p>
          </div>
        </div>
        <button 
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition shadow-sm"
          onClick={() => alert("입력된 내용을 바탕으로 PDF 생성 요청을 보냅니다.")}
        >
          <Download size={18} />
          PDF 미리보기
        </button>
      </div>

      {/* 2. 관리자가 설정한 텍스트 필드 입력 폼 */}
      {textFields.length > 0 && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Type size={20} className="text-indigo-500" /> 기본 텍스트 항목 입력
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {textFields.map((field, i) => {
              // HALF면 1칸 차지, FULL이면 2칸 모두 차지하도록 설정
              const spanClass = field.layout === 'FULL' ? 'md:col-span-2' : 'md:col-span-1';
              
              // 자동입력 필드이면서 엑셀 매핑이 된 경우(본인이 수정 불가)
              const isReadOnlyMapping = !!(field.isAutoFill && field.mappedExcelColumn);

              return (
                <div key={i} className={`flex flex-col gap-2 ${spanClass}`}>
                  <label className="text-sm font-bold text-slate-700">
                    {field.name}
                    {isReadOnlyMapping && <span className="ml-2 text-xs font-normal text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">엑셀 자동연동</span>}
                  </label>
                  <input 
                    type="text" 
                    value={isReadOnlyMapping ? `(엑셀 자동 매핑: ${field.mappedExcelColumn})` : (reportData[field.name] || "")}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    disabled={isReadOnlyMapping} // 엑셀 매핑 필드는 비활성화
                    placeholder={`${field.name}을(를) 입력하세요`}
                    className={`border border-slate-300 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium ${isReadOnlyMapping ? 'bg-slate-100 text-slate-500' : 'bg-white text-slate-800'}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. 관리자가 설정한 사진 필드 안내 뷰 */}
      {imageFields.length > 0 && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ImageIcon size={20} className="text-emerald-500" /> 필요 사진 항목 안내
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            ※ 아래 사진들은 현장에서 모바일 앱(세부 작업 항목)을 통해 업로드하셔야 PDF에 자동 반영됩니다.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
             {imageFields.map((field, i) => (
                <div key={i} className="flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center h-32">
                    <ImageIcon size={28} className="text-slate-400 mb-2" />
                    <span className="font-bold text-slate-700 text-sm">
                      {field.layout === 'SPLIT' ? `${field.name} / ${field.name2}` : field.name}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      {field.layout === 'SPLIT' ? '2장 촬영 필요' : field.layout === 'HALF' ? '2장 촬영 필요' : '1장 촬영 필요'}
                    </span>
                </div>
             ))}
          </div>
        </div>
      )}

      {/* 4. 하단 저장 버튼 */}
      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button 
          onClick={handleSave} 
          disabled={loading} 
          className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          내용 임시 저장
        </button>
      </div>

    </div>
  );
}