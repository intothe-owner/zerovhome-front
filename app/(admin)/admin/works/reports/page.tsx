"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { FileSpreadsheet, Search, Filter, Download, FileText, CheckSquare, MessageSquare } from "lucide-react";

export default function ReportAndSurveyMonitorPage() {
  const [results, setResults] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<string>("");

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. 현장 목록 가져오기 (필터용)
      const siteRes = await axios.get(`${API_BASE_URL}/api/work-sites`);
      if (siteRes.data.ok) setSites(siteRes.data.data);

      // 2. 보고서/설문 결과 목록 가져오기 (보통 'COMPLETED' 상태의 WorkItem을 조인하여 가져옴)
      // 백엔드 구현에 따라 엔드포인트는 변경될 수 있습니다. 
      // 예시: 완료된 작업 목록에 ReportResult와 SurveyResponse를 include해서 반환하는 API
      const queryString = selectedSite ? `?workSiteId=${selectedSite}&status=COMPLETED` : `?status=COMPLETED`;
      const res = await axios.get(`${API_BASE_URL}/api/work-items${queryString}`);
      if (res.data.ok) setResults(res.data.data);
    } catch (err) {
      console.error("보고서 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSite]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FileSpreadsheet className="text-indigo-600" />
          통합 보고서 및 설문 결과
        </h2>
      </div>

      {/* 필터 영역 */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px] max-w-md">
          <label className="block text-sm font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <Filter size={16} /> 현장 선택
          </label>
          <select 
            value={selectedSite} 
            onChange={(e) => setSelectedSite(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
          >
            <option value="">모든 현장의 완료된 작업 보기</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 데이터 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Search size={20} className="text-slate-500" />
            완료된 작업 및 산출물 내역
          </h3>
          <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
            총 {results.length}건
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white border-b border-slate-200 text-sm font-semibold text-slate-500">
              <tr>
                <th className="p-4 w-1/4">소속 현장명</th>
                <th className="p-4">고객명 / 완료일</th>
                <th className="p-4 text-center">담당 작업자</th>
                <th className="p-4 text-center">고객 서명</th>
                <th className="p-4 text-center w-32">PDF 보고서</th>
                <th className="p-4 text-center w-32">설문 결과</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">데이터를 불러오는 중입니다...</td></tr>
              ) : results.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">조회된 산출물이 없습니다.</td></tr>
              ) : (
                results.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-semibold text-slate-600 truncate max-w-xs">{item.site?.title || "-"}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{item.customerName}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{item.workDate || '날짜 미상'}</div>
                    </td>
                    <td className="p-4 text-center font-medium text-slate-600">
                      {item.workerName || "미지정"}
                    </td>
                    <td className="p-4 text-center">
                      {item.customerSignature ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                          <CheckSquare size={14} /> 서명 완료
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">서명 없음</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {item.reportResult?.pdfPath ? (
                        <a 
                          href={item.reportResult.pdfPath} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition"
                        >
                          <Download size={14} /> 다운로드
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">생성 전</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {item.surveyResponse ? (
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition">
                          <MessageSquare size={14} className="text-blue-500" /> 확인
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">미제출</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}