"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { FolderKanban, Plus, Search, FileSpreadsheet, User, UserPlus } from "lucide-react";

export default function WorkSiteListPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [userLevel, setUserLevel] = useState<number>(0);
  const [isFetching, setIsFetching] = useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  
  const getAuthHeaders = () => {
    const rawToken = localStorage.getItem("token") || "";
    const cleanToken = rawToken.replace(/^['"]|['"]$/g, ''); 

    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cleanToken}`
    };
  };

  // 1. 접속한 유저의 레벨 확인 (레벨 10 최고관리자인지 파악하기 위함)
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserLevel(user.level);
      } catch (e) {
        console.error("유저 정보 파싱 오류", e);
      }
    }
  }, []);

  // 2. 레벨 9(현장관리자) 회원 목록 불러오기
  const fetchMembers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/members`, {
        headers: getAuthHeaders()
      });
      const data = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      // 레벨 9인 회원만 필터링하여 상태에 저장
      setMembers(data.filter((m: any) => m.level === 9));
    } catch (err) {
      console.error("회원 목록 조회 실패:", err);
    }
  };

  // 3. 현장 목록 불러오기
  const fetchSites = async () => {
    try {
      setIsFetching(true);
      const res = await axios.get(`${API_BASE_URL}/api/work-sites`, {
        headers: getAuthHeaders()
      });
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
    fetchMembers();
  }, []);

  // 4. 담당자(레벨 9) 배정 처리 함수
  const handleAssignMember = async (siteId: number, memberId: string) => {
    if (!memberId) return;
    
    if (!confirm("해당 관리자를 이 현장의 담당자로 배정하시겠습니까?")) return;

    try {
      // 기존 백엔드의 현장 수정(PATCH) 라우터를 활용하여 memberId 업데이트
      const res = await axios.patch(`${API_BASE_URL}/api/work-sites/${siteId}`, {
        memberId: Number(memberId)
      }, {
        headers: getAuthHeaders()
      });

      if (res.data.ok) {
        alert("담당자가 배정되었습니다.");
        fetchSites(); // 목록 새로고침
      }
    } catch (error) {
      console.error("담당자 배정 실패:", error);
      alert("담당자 배정에 실패했습니다.");
    }
  };

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
                {/* 💡 담당자 컬럼 추가 */}
                <th className="p-4 w-40 text-center">담당 관리자</th>
                <th className="p-4 w-32 text-center">생성일</th>
                <th className="p-4 w-32 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isFetching ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">데이터를 불러오는 중입니다...</td>
                </tr>
              ) : sites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">등록된 현장이 없습니다. 우측 상단 버튼을 눌러 새 현장을 개설해주세요.</td>
                </tr>
              ) : (
                sites.map((site: any) => {
                  // 현재 현장에 배정된 회원 찾기
                  const assignedMember = members.find(m => m.id === site.memberId);

                  return (
                    <tr key={site.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 text-center text-slate-500 font-medium">{site.id}</td>
                      <td className="p-4 font-bold text-slate-800">{site.title}</td>
                      <td className="p-4 text-slate-600 text-sm truncate max-w-xs">{site.description || "-"}</td>
                      
                      {/* 💡 담당자 표시 및 배정 UI */}
                      <td className="p-4 text-center">
                        {site.memberId ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200">
                            <User size={14} />
                            {assignedMember ? (assignedMember.companyName ? `${assignedMember.name}(${assignedMember.companyName})` : assignedMember.name) : `회원 #${site.memberId}`}
                          </span>
                        ) : userLevel === 10 ? (
                          <div className="flex items-center justify-center gap-1">
                            <UserPlus size={14} className="text-slate-400" />
                            <select
                              className="text-xs border border-slate-300 rounded-md px-2 py-1.5 outline-none focus:border-indigo-500 bg-white font-semibold text-slate-600 cursor-pointer"
                              defaultValue=""
                              onChange={(e) => handleAssignMember(site.id, e.target.value)}
                            >
                              <option value="" disabled>담당자 선택</option>
                              {members.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.companyName ? `${m.name}(${m.companyName})` : m.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded-md">미배정</span>
                        )}
                      </td>

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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}