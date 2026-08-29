"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { ListChecks, Search, Filter, MapPin, CheckCircle2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WorkItemMonitorPage() {
    const router = useRouter();
    const getAuthHeaders = () => {
        const rawToken = localStorage.getItem("token") || "";
        const cleanToken = rawToken.replace(/^['"]|['"]$/g, '');

        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${cleanToken}`
        };
    };
    const [items, setItems] = useState<any[]>([]);
    const [sites, setSites] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // 💡 세션 스토리지에서 이전 필터 상태 복원 (없으면 기본값)
    const [selectedSite, setSelectedSite] = useState<string>(() => sessionStorage.getItem("work_selectedSite") || "");
    const [selectedStatus, setSelectedStatus] = useState<string>(() => sessionStorage.getItem("work_selectedStatus") || "");
    const [keywordInput, setKeywordInput] = useState<string>(() => sessionStorage.getItem("work_keyword") || "");
    const [keyword, setKeyword] = useState<string>(() => sessionStorage.getItem("work_keyword") || "");

    const [page, setPage] = useState<number>(() => Number(sessionStorage.getItem("work_page")) || 1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalCount, setTotalCount] = useState<number>(0);
    const pageSize = 20;

    const [currentListFields, setCurrentListFields] = useState<string[]>([]);

    // 체크박스 및 회원 배정 모달 관련 상태
    const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
    const [members, setMembers] = useState<any[]>([]);
    const [assignKeyword, setAssignKeyword] = useState<string>("");
    const [assignLoading, setAssignLoading] = useState<boolean>(false);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    const fetchSites = async () => {
        try {
            const siteRes = await axios.get(`${API_BASE_URL}/api/work-sites`);
            if (siteRes.data.ok) setSites(siteRes.data.data);
        } catch (err) {
            console.error("현장 목록 조회 실패:", err);
        }
    };

    const fetchMembers = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/members`, {
                headers: getAuthHeaders()
            });
            console.log("회원 API 응답:", res.data); // 응답 구조 확인

            // 💡 백엔드 응답이 res.data.data 배열 형태인지 아니면 res.data 자체가 배열인지 분기 처리
            const membersData = Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];

            if (membersData.length > 0) {
                setMembers(membersData);
            }
        } catch (err) {
            console.error("회원 목록 조회 실패:", err);
            // 실패 시 임시 데이터 (디버깅용)
            setMembers([
                { id: 1, name: "홍길동 (제로브이)", level: 2 },
                { id: 2, name: "김철수 (클린파트너)", level: 2 }
            ]);
        }
    };

    useEffect(() => {
        fetchSites();
        fetchMembers();
    }, []);

    // 💡 필터 상태가 바뀔 때마다 sessionStorage에 저장하여 뒤로가기 시 복원 가능하도록 함
    useEffect(() => {
        sessionStorage.setItem("work_selectedSite", selectedSite);
        sessionStorage.setItem("work_selectedStatus", selectedStatus);
        sessionStorage.setItem("work_keyword", keyword);
        sessionStorage.setItem("work_page", String(page));
    }, [selectedSite, selectedStatus, keyword, page]);

    const fetchItems = async () => {
        if (!selectedSite) {
            setItems([]);
            setCurrentListFields([]);
            setTotalPages(1);
            setTotalCount(0);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const targetSite = sites.find(s => String(s.id) === String(selectedSite));
            if (targetSite) {
                setCurrentListFields(targetSite.listVisibleFields || []);
            }

            let query = [`workSiteId=${selectedSite}`, `page=${page}`, `pageSize=${pageSize}`];
            if (selectedStatus) query.push(`status=${selectedStatus}`);
            if (keyword) query.push(`keyword=${encodeURIComponent(keyword)}`);

            const queryString = `?${query.join("&")}`;
            const itemsRes = await axios.get(`${API_BASE_URL}/api/work-items${queryString}`);
            if (itemsRes.data.ok) {
                setItems(itemsRes.data.data);
                setTotalCount(itemsRes.data.total || 0);
                setTotalPages(itemsRes.data.totalPages || 1);
                setSelectedItemIds([]);
            }
        } catch (err) {
            console.error("작업 현황 조회 실패:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [selectedSite, selectedStatus, keyword, page, sites]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedItemIds(items.map(item => item.id));
        } else {
            setSelectedItemIds([]);
        }
    };

    const handleSelectItem = (id: number) => {
        setSelectedItemIds(prev =>
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    const handleExecuteAssign = async (memberId: number, memberName: string) => {
        if (selectedItemIds.length === 0) return;

        try {
            setAssignLoading(true);

            // 💡 백엔드 작업자 배정 API 호출 (선택된 작업 ID 배열과 작업자 ID 전달)
            const response = await axios.post(`${API_BASE_URL}/api/work-items/assign`, {
                itemIds: selectedItemIds,
                memberId: memberId
            }, {
                headers: getAuthHeaders()
            });

            if (response.data.ok) {
                alert(`선택한 ${selectedItemIds.length}개의 작업이 [${memberName}] 회원에게 배정되었습니다.`);
                setIsAssignModalOpen(false);
                setAssignKeyword("");
                setSelectedItemIds([]);
                fetchItems(); // 💡 배정 완료 후 목록 새로고침
            } else {
                alert("작업자 배정에 실패했습니다.");
            }

        } catch (err) {
            console.error("작업자 배정 에러:", err);
            alert("작업자 배정 중 오류가 발생했습니다.");
        } finally {
            setAssignLoading(false);
        }
    };

    const handleSiteChange = (val: string) => {
        setSelectedSite(val);
        setPage(1);
    };

    const handleStatusChange = (val: string) => {
        setSelectedStatus(val);
        setPage(1);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setKeyword(keywordInput);
    };

    const handleClearSearch = () => {
        setKeywordInput("");
        setKeyword("");
        setPage(1);
    };

    const filteredMembers = members.filter(member => {
        const memberName = member.name || member.loginId || "이름없음";
        const company = member.companyName || "";
        const searchTarget = `${memberName} ${company}`.toLowerCase();

        return searchTarget.includes(assignKeyword.toLowerCase());
    });

    const pageSizeGroup = 10;
    const currentGroup = Math.ceil(page / pageSizeGroup);
    const startPage = (currentGroup - 1) * pageSizeGroup + 1;
    const endPage = Math.min(startPage + pageSizeGroup - 1, totalPages);
    const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">작업완료</span>;
            case 'IN_PROGRESS': return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-600 border border-blue-200">진행중</span>;
            case 'CANCELED': return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-50 text-red-600 border border-red-200">취소됨</span>;
            default: return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 border border-slate-200">대기중</span>;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <ListChecks className="text-indigo-600" />
                    전체 작업 현황 모니터링
                </h2>

                {selectedItemIds.length > 0 && (
                    <button
                        onClick={() => setIsAssignModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm animate-pulse"
                    >
                        <UserCheck size={18} />
                        선택한 작업자 배정 ({selectedItemIds.length}건)
                    </button>
                )}
            </div>

            {/* 필터 및 검색 영역 */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-semibold text-slate-600 mb-1 flex items-center gap-1">
                        <Filter size={16} /> 현장 선택 (필수)
                    </label>
                    <select
                        value={selectedSite}
                        onChange={(e) => handleSiteChange(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                    >
                        <option value="">-- 현장을 선택해주세요 --</option>
                        {sites.map(site => (
                            <option key={site.id} value={site.id}>{site.title}</option>
                        ))}
                    </select>
                </div>

                <div className="w-48">
                    <label className="block text-sm font-semibold text-slate-600 mb-1">상태 필터</label>
                    <select
                        value={selectedStatus}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={!selectedSite}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 disabled:opacity-50"
                    >
                        <option value="">전체 상태</option>
                        <option value="PENDING">대기중</option>
                        <option value="IN_PROGRESS">진행중</option>
                        <option value="COMPLETED">작업완료</option>
                        <option value="CANCELED">취소됨</option>
                    </select>
                </div>

                <div className="flex-1 min-w-[240px]">
                    <label className="block text-sm font-semibold text-slate-600 mb-1">통합 검색</label>
                    <form onSubmit={handleSearchSubmit} className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="고객명, 주소 등 검색어 입력"
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                disabled={!selectedSite}
                                className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 disabled:opacity-50"
                            />
                            {keywordInput && (
                                <button type="button" onClick={handleClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <button type="submit" disabled={!selectedSite} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0">
                            <Search size={16} /> 검색
                        </button>
                    </form>
                </div>
            </div>

            {/* 데이터 테이블 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Search size={20} className="text-slate-500" />
                        조회된 작업 목록
                    </h3>
                    <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                        총 {totalCount}건
                    </span>
                </div>

                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white border-b border-slate-200 text-sm font-semibold text-slate-500">
                            <tr>
                                <th className="p-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        checked={items.length > 0 && selectedItemIds.length === items.length}
                                        onChange={handleSelectAll}
                                        disabled={!selectedSite || items.length === 0}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                                    />
                                </th>
                                <th className="p-4 w-16 text-center">순번</th>
                                {currentListFields.map((field) => (
                                    <th key={field} className="p-4">{field}</th>
                                ))}
                                <th className="p-4 text-center w-28">위치 확인</th>
                                <th className="p-4 text-center w-28">상태</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {!selectedSite ? (
                                <tr>
                                    <td colSpan={6 + currentListFields.length} className="p-12 text-center text-slate-400 font-medium">
                                        상단에서 현장을 선택하시면 작업 현황이 표시됩니다.
                                    </td>
                                </tr>
                            ) : loading ? (
                                <tr>
                                    <td colSpan={6 + currentListFields.length} className="p-12 text-center text-slate-400">데이터를 불러오는 중입니다...</td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={6 + currentListFields.length} className="p-12 text-center text-slate-400">검색 결과가 없습니다.</td>
                                </tr>
                            ) : (
                                items.map((item) => {
                                    const isChecked = selectedItemIds.includes(item.id);
                                    return (
                                        <tr key={item.id} className={`hover:bg-slate-50 transition ${isChecked ? 'bg-indigo-50/40' : ''}`}>
                                            <td className="p-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => handleSelectItem(item.id)}
                                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-4 text-center text-slate-400 font-medium">{item.routeOrder}</td>
                                            {currentListFields.map((field, idx) => (
                                                <td
                                                    key={field}
                                                    className="p-4 font-semibold text-slate-700 cursor-pointer hover:text-indigo-600"
                                                    onClick={() => router.push(`/admin/works/items/${item.id}`)}
                                                >
                                                    <div className="flex flex-col gap-0.5">
                                                        {/* 첫 번째 필드(예: 고객명 또는 장소명) 아래에 담당자 이름 배치 */}
                                                        <span>{item.rowData?.[field] ?? "-"}</span>
                                                        {idx === 0 && (
                                                            <span className="text-xs font-normal">
                                                                {item.workerName ? (
                                                                    <span className="text-indigo-600 font-bold">
                                                                        담당: {item.workerName}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400">
                                                                        담당자 미배정
                                                                    </span>
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            ))}
                                            <td className="p-4 text-center">
                                                {item.latitude ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                                                        <CheckCircle2 size={14} /> 확인됨
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                                                        <MapPin size={14} /> 미확인
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                {getStatusBadge(item.status)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 블록 단위 페이징 UI */}
                {selectedSite && totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-center gap-1.5">
                        <button onClick={() => setPage(1)} disabled={page === 1 || loading} className="p-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition">
                            <ChevronsLeft size={16} />
                        </button>
                        <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1 || loading} className="p-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition">
                            <ChevronLeft size={16} />
                        </button>
                        <div className="flex items-center gap-1 mx-2">
                            {pageNumbers.map((num) => (
                                <button
                                    key={num}
                                    onClick={() => setPage(num)}
                                    disabled={loading}
                                    className={`w-9 h-9 rounded-lg text-sm font-bold transition ${page === num ? "bg-indigo-600 text-white shadow-sm" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"}`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages || loading} className="p-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition">
                            <ChevronRight size={16} />
                        </button>
                        <button onClick={() => setPage(totalPages)} disabled={page === totalPages || loading} className="p-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition">
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* 회원 배정 모달 */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <UserCheck className="text-indigo-600" /> 작업자 배정하기
                            </h3>
                            <button onClick={() => { setIsAssignModalOpen(false); setAssignKeyword(""); }} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-slate-600">
                            선택한 총 <b className="text-indigo-600">{selectedItemIds.length}건</b>의 작업을 배정할 담당 회원을 검색하고 선택하세요.
                        </p>

                        <div className="relative">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="회원 이름 또는 기업명 검색"
                                value={assignKeyword}
                                onChange={(e) => setAssignKeyword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 text-sm"
                            />
                            {assignKeyword && (
                                <button onClick={() => setAssignKeyword("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <div className="max-h-52 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                            {filteredMembers.length === 0 ? (
                                <p className="text-sm text-center text-slate-400 py-6">검색된 회원이 없습니다.</p>
                            ) : (
                                filteredMembers.map((member) => {
                                    // 화면에 표시할 이름 조합 (기업명이 있으면 함께 표시)
                                    const displayName = member.companyName
                                        ? `${member.name} (${member.companyName})`
                                        : member.name || member.loginId;

                                    return (
                                        <button
                                            key={member.id}
                                            onClick={() => handleExecuteAssign(member.id, displayName)}
                                            disabled={assignLoading}
                                            className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/50 transition font-semibold text-slate-700 flex items-center justify-between shadow-sm"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm">{displayName}</span>
                                                {/* 레벨이나 이메일을 보조 정보로 표시하면 좋습니다 */}
                                                <span className="text-xs text-slate-400 font-normal">{member.loginId}</span>
                                            </div>
                                            <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg shrink-0">선택</span>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => { setIsAssignModalOpen(false); setAssignKeyword(""); }}
                                className="px-5 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition text-sm"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}