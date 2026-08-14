"use client";

import { useState, useEffect } from "react";
import { Users, Edit2, Trash2, List, Shield, Search, Loader2, FileText, CheckCircle } from "lucide-react"; // 💡 Search 아이콘 추가 확인

const LEVEL_NAMES: Record<number, string> = {
  0: "차단/대기", 1: "일반회원", 2: "정회원", 3: "우수회원", 4: "VIP회원",
  5: "특별회원", 6: "부관리자", 7: "운영자", 8: "부서장", 9: "관리자", 10: "최고관리자"
};

export default function MemberManager() {
  const [members, setMembers] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"LIST" | "FORM">("LIST");
  const [isLoading, setIsLoading] = useState(false);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 💡 검색 관련 상태 추가
  const [searchType, setSearchType] = useState("loginId");
  const [keyword, setKeyword] = useState("");

  const [filterLevel, setFilterLevel] = useState<"ALL" | "0">("ALL");

  const initialForm = {
    id: 0, loginId: "", name: "", nickname: "", phone: "", mobile: "", address: "", level: 1, password: "", createdAt: ""
  };
  const [formData, setFormData] = useState(initialForm);

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
  });

  // 1. 회원 목록 조회 (💡 검색 파라미터 추가)
  const fetchMembers = async (currentPage = 1, currentFilter = filterLevel) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(currentPage),
        limit: "15",
      });
      if (keyword) {
        queryParams.append("searchType", searchType);
        queryParams.append("keyword", keyword);
      }
      // ✨ 특정 레벨 필터가 활성화된 경우 추가
      if (currentFilter !== "ALL") {
        queryParams.append("level", currentFilter);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/members?${queryParams.toString()}`, {
        headers: getAuthHeaders()
      });
      const json = await res.json();
      
      if (json.success) {
        setMembers(json.data);
        setTotalPages(json.pagination.totalPages);
        setPage(json.pagination.currentPage);
      } else {
        alert(json.message || "회원 목록을 불러오지 못했습니다.");
      }
    } catch (error) {
      console.error("회원 조회 오류:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchMembers(1);
  }, []);

  // 💡 검색 버튼 클릭 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMembers(1); // 검색 시 1페이지로 이동
  };

  // ✨ 신규: 가입 승인 처리
  const handleApprove = async (id: number) => {
    if (!confirm("해당 회원의 가입을 승인하시겠습니까?\n설정된 기본 회원 등급으로 상향됩니다.")) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/members/${id}/approve`, {
        method: "PATCH",
        headers: getAuthHeaders()
      });
      const json = await res.json();
      
      if (res.ok && json.success) {
        alert("승인되었습니다.");
        fetchMembers(page);
      } else {
        alert(json.message || "승인 처리에 실패했습니다.");
      }
    } catch (error) {
      alert("서버 오류가 발생했습니다.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("회원 정보를 수정하시겠습니까?")) return;

    const { password, ...restData } = formData;
    const updatePayload = password ? { ...restData, password } : restData;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/members/${formData.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(updatePayload)
      });
      const json = await res.json();
      
      if (res.ok && json.success) {
        alert("수정되었습니다.");
        setViewMode("LIST");
        fetchMembers(page);
      } else {
        alert(json.message || "수정에 실패했습니다.");
      }
    } catch (error) {
      alert("서버 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: number, level: number) => {
    if (level === 10) {
      alert("최고관리자 계정은 삭제할 수 없습니다.");
      return;
    }
    if (!confirm("정말 이 회원을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/members/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      const json = await res.json();

      if (res.ok && json.success) {
        alert("삭제되었습니다.");
        fetchMembers(page);
      } else {
        alert(json.message || "삭제에 실패했습니다.");
      }
    } catch (error) {
      alert("서버 오류가 발생했습니다.");
    }
  };

  const inputClass = "w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500";

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">회원 관리</h2>
          <p className="text-sm text-slate-500 mt-1">가입된 회원 목록을 조회하고 정보 및 등급(권한)을 수정합니다.</p>
        </div>
        
        {viewMode === "FORM" && (
          <button 
            onClick={() => { setViewMode("LIST"); setFormData(initialForm); }}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm hover:bg-black transition"
          >
            <List size={16}/> 목록으로
          </button>
        )}
      </div>

      {viewMode === "LIST" && (
        <div className="space-y-4">
          
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            {/* ✨ 상태 필터 탭 */}
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={() => { setFilterLevel("ALL"); fetchMembers(1, "ALL"); }}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${filterLevel === "ALL" ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                전체 회원
              </button>
              <button 
                onClick={() => { setFilterLevel("0"); fetchMembers(1, "0"); }}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${filterLevel === "0" ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                승인 대기 (미승인)
              </button>
            </div>

            {/* 검색 폼 */}
            <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
              <select value={searchType} onChange={(e) => setSearchType(e.target.value)} className="border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 w-28">
                <option value="loginId">아이디</option>
                <option value="name">이름</option>
              </select>
              <input type="text" placeholder="검색어 입력..." value={keyword} onChange={(e) => setKeyword(e.target.value)} className="flex-1 md:w-48 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" />
              <button type="submit" className="bg-slate-800 text-white px-4 rounded-lg flex items-center gap-2">
                <Search size={16} /> 검색
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
            {isLoading && (
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
              </div>
            )}

            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-bold text-center w-16">ID</th>
                  <th className="p-4 font-bold">아이디(로그인)</th>
                  <th className="p-4 font-bold">이름/닉네임</th>
                  <th className="p-4 font-bold">등급(권한)</th>
                  <th className="p-4 font-bold">가입일</th>
                  <th className="p-4 font-bold text-center w-36">관리</th>
                </tr>
              </thead>
              <tbody>
                {members.length > 0 ? members.map(m => (
                  <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-center text-slate-500">{m.id}</td>
                    <td className="p-4 font-bold text-slate-800">{m.loginId}</td>
                    <td className="p-4">
                      <div className="font-medium flex items-center gap-2">
                        {m.name}
                        {m.approvalFileUrl && (
                          <a href={m.approvalFileUrl} target="_blank" rel="noreferrer" title="승인 서류 보기" className="text-indigo-500 hover:text-indigo-700">
                            <FileText size={14} />
                          </a>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">{m.nickname || '-'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        m.level === 0 ? 'bg-amber-100 text-amber-700' :
                        m.level >= 9 ? 'bg-rose-100 text-rose-700' : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        LV.{m.level} {LEVEL_NAMES[m.level] || "알수없음"}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center">
                      {/* ✨ 레벨 0일 때 노출되는 [승인] 버튼 */}
                      {m.level === 0 && (
                        <button onClick={() => handleApprove(m.id)} className="text-emerald-500 hover:text-emerald-700 mr-3 transition-colors" title="가입 승인">
                          <CheckCircle size={18}/>
                        </button>
                      )}
                      <button onClick={() => { setFormData({ ...m, password: "" }); setViewMode("FORM"); }} className="text-indigo-600 hover:text-indigo-800 mr-3 transition-colors" title="수정">
                        <Edit2 size={16}/>
                      </button>
                      <button onClick={() => handleDelete(m.id, m.level)} className="text-red-400 hover:text-red-600 transition-colors" title="삭제">
                        <Trash2 size={16}/>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500">
                      일치하는 회원 정보가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* 페이지네이션 (기존과 동일) */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => fetchMembers(p)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                      p === page ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- FORM 영역은 동일 --- */}
      {viewMode === "FORM" && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
            <div className="bg-white p-3 rounded-full shadow-sm border border-slate-100">
              <Users className="text-indigo-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{formData.loginId}</h3>
              <p className="text-xs text-slate-500">가입일: {new Date(formData.createdAt || Date.now()).toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block font-bold mb-1 text-slate-700">이름</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className={inputClass} />
            </div>
            <div>
              <label className="block font-bold mb-1 text-slate-700">닉네임</label>
              <input type="text" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} className={inputClass} />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700">유선 전화번호</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block font-bold mb-1 text-slate-700">휴대폰 번호</label>
              <input type="text" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className={inputClass} />
            </div>

            <div className="col-span-2">
              <label className="block font-bold mb-1 text-slate-700">주소</label>
              <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className={inputClass} />
            </div>

            <div className="col-span-2 border-t border-slate-100 pt-6 mt-2">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Shield size={18} className="text-rose-500"/> 계정 보안 및 등급 관리
              </h4>
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
                
                <div>
                  <label className="block font-bold mb-1 text-slate-700">회원 등급(권한)</label>
                  <select 
                    value={formData.level} 
                    onChange={e => setFormData({...formData, level: Number(e.target.value)})} 
                    className={inputClass}
                    disabled={formData.level === 10} 
                  >
                    {Object.entries(LEVEL_NAMES).map(([level, name]) => (
                      <option key={level} value={level}>{name} (Level {level})</option>
                    ))}
                  </select>
                  {formData.level === 10 && <p className="text-xs text-rose-500 mt-1">* 최고관리자 계정은 등급을 변경할 수 없습니다.</p>}
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">비밀번호 변경</label>
                  <input 
                    type="password" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    placeholder="변경 시에만 입력하세요." 
                    className={inputClass} 
                  />
                  <p className="text-xs text-slate-500 mt-1">* 입력하지 않으면 기존 비밀번호가 유지됩니다.</p>
                </div>

              </div>
            </div>

          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition shadow-md shadow-indigo-200">
            회원 정보 수정하기
          </button>
        </form>
      )}
    </div>
  );
}