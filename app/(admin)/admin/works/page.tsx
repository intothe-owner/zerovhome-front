"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { FolderKanban, Plus, Search, FileSpreadsheet } from "lucide-react";

export default function WorkSiteListPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  const fetchSites = async () => {
    try {
      setIsFetching(true);
      const res = await axios.get(`${API_BASE_URL}/api/work-sites`);
      if (res.data.ok) {
        setSites(res.data.data);
      }
    } catch (err) {
      console.error("목록 조회 실패:", err);
      alert("현장 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FolderKanban className="text-indigo-600" />
          통합 현장 관리
        </h2>
        <Link 
          href="/admin/works/new"
          className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          신규 현장 개설
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Search size={20} className="text-slate-500" />
            운영 중인 현장 목록
          </h3>
          <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
            총 {sites.length}건
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-sm font-semibold text-slate-500">
                <th className="p-4 w-20 text-center">ID</th>
                <th className="p-4 w-1/3">현장명</th>
                <th className="p-4">설명 / 메모</th>
                <th className="p-4 w-40 text-center">생성일</th>
                <th className="p-4 w-32 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isFetching ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">데이터를 불러오는 중입니다...</td>
                </tr>
              ) : sites.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">등록된 현장이 없습니다. 우측 상단 버튼을 눌러 새 현장을 개설해주세요.</td>
                </tr>
              ) : (
                sites.map((site: any) => (
                  <tr key={site.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 text-center text-slate-500 font-medium">{site.id}</td>
                    <td className="p-4 font-bold text-slate-800">{site.title}</td>
                    <td className="p-4 text-slate-600 text-sm truncate max-w-xs">{site.description || "-"}</td>
                    <td className="p-4 text-center text-slate-500 text-sm">
                      {new Date(site.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center">
                      <Link 
                        href={`/admin/works/${site.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 hover:border-indigo-400 hover:text-indigo-600 transition-all"
                      >
                        <FileSpreadsheet size={16} />
                        엑셀/상세
                      </Link>
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