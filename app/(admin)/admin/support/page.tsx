"use client";

import { useState, useEffect } from "react";
import { DownloadCloud, ExternalLink, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function SupportFundManager() {
  const [funds, setFunds] = useState<any[]>([]);
  const [isScraping, setIsScraping] = useState(false);
  
  // 검색 및 페이징 상태
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTitle, setSearchTitle] = useState("");

  const fetchFunds = async (currentPage = 1, title = "") => {
    try {
      const query = new URLSearchParams({
        page: String(currentPage),
        limit: "15",
        ...(title && { title })
      });
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/funds?${query}`);
      const json = await res.json();
      
      if (json.success) {
        setFunds(json.data);
        setTotalPages(json.pagination.totalPages);
        setPage(json.pagination.currentPage);
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    }
  };

  useEffect(() => {
    fetchFunds(1);
  }, []);

  // 기업마당 크롤링 호출
  const handleScrapeBizinfo = async () => {
    if (!confirm("기업마당(Bizinfo) 공고를 갱신하시겠습니까?\n이 작업은 약 10~20초 정도 소요될 수 있습니다.")) return;
    
    setIsScraping(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/funds/scrape`, { method: "POST" });
      const json = await res.json();
      alert(json.message);
      fetchFunds(1);
    } catch (e) {
      console.log(e);
      alert("기업마당 데이터 수집 중 오류가 발생했습니다.");
    } finally {
      setIsScraping(false);
    }
  };

  // K-Startup 크롤링 호출
  const handleScrapeKStartup = async () => {
    if (!confirm("K-Startup 진행중인 공고를 추가로 가져오시겠습니까?")) return;
    
    setIsScraping(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/funds/scrape/k-startup`, { method: "POST" });
      const json = await res.json();
      alert(json.message);
      fetchFunds(1);
    } catch (e) {
      alert("K-Startup 데이터 수집 중 오류가 발생했습니다.");
    } finally {
      setIsScraping(false);
    }
  };
  
  // 소상공인24 크롤링 호출
  const handleScrapeSbiz24 = async () => {
    if (!confirm("소상공인24 정책자금 공고를 추가로 가져오시겠습니까?\n(가상 브라우저를 구동하여 수집하므로 시간이 조금 더 소요될 수 있습니다.)")) return;
    
    setIsScraping(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/funds/scrape/sbiz24`, { method: "POST" });
      const json = await res.json();
      alert(json.message);
      fetchFunds(1);
    } catch (e) {
      alert("소상공인24 데이터 수집 중 오류가 발생했습니다.");
    } finally {
      setIsScraping(false);
    }
  };

  // 💡 [추가] 한국자활복지개발원 크롤링 호출
  const handleScrapeKdissw = async () => {
    if (!confirm("한국자활복지개발원 사업공고를 추가로 가져오시겠습니까?")) return;
    
    setIsScraping(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/funds/scrape/kdissw`, { method: "POST" });
      const json = await res.json();
      alert(json.message);
      fetchFunds(1);
    } catch (e) {
      alert("한국자활복지개발원 데이터 수집 중 오류가 발생했습니다.");
    } finally {
      setIsScraping(false);
    }
  };

  // 💡 [추가] 부산광역자활센터 크롤링 호출
  const handleScrapeBusanjh = async () => {
    if (!confirm("부산광역자활센터 공지사항을 추가로 가져오시겠습니까?")) return;
    
    setIsScraping(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/funds/scrape/busanjh`, { method: "POST" });
      const json = await res.json();
      alert(json.message);
      fetchFunds(1);
    } catch (e) {
      alert("부산광역자활센터 데이터 수집 중 오류가 발생했습니다.");
    } finally {
      setIsScraping(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFunds(1, searchTitle);
  };

  // --- 페이지네이션 계산 로직 ---
  const PAGE_GROUP_SIZE = 10;
  const currentGroup = Math.ceil(page / PAGE_GROUP_SIZE);
  const startPage = (currentGroup - 1) * PAGE_GROUP_SIZE + 1;
  const endPage = Math.min(currentGroup * PAGE_GROUP_SIZE, totalPages);
  
  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      
      {/* 데이터 갱신(크롤링) 중 로딩 오버레이 */}
      {isScraping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={48} />
            <p className="font-bold text-slate-700 text-lg">데이터를 수집하고 있습니다...</p>
            <p className="text-sm text-slate-500">창을 닫지 말고 잠시만 기다려주세요.</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">사업지원금 관리</h2>
          <p className="text-sm text-slate-500 mt-1">다양한 기관에서 공고를 자동으로 수집하여 보여줍니다.</p>
        </div>
        
        {/* 💡 동기화 버튼 그룹 (flex-wrap 및 간격 조정) */}
        <div className="flex flex-wrap gap-2 justify-end">
          <button 
            onClick={handleScrapeBizinfo}
            disabled={isScraping}
            className="bg-indigo-600 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 text-xs hover:bg-indigo-700 transition"
          >
            <DownloadCloud size={14}/> 기업마당
          </button>
          {/* <button 
            onClick={handleScrapeKStartup}
            disabled={isScraping}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 text-xs hover:bg-blue-700 transition"
          >
            <DownloadCloud size={14}/> K-Startup
          </button> */}
          <button 
            onClick={handleScrapeSbiz24}
            disabled={isScraping}
            className="bg-emerald-600 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 text-xs hover:bg-emerald-700 transition"
          >
            <DownloadCloud size={14}/> 소상공인24
          </button>
          {/* 한국자활 버튼 추가 */}
          <button 
            onClick={handleScrapeKdissw}
            disabled={isScraping}
            className="bg-teal-600 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 text-xs hover:bg-teal-700 transition"
          >
            <DownloadCloud size={14}/> 한국자활
          </button>
          {/* 부산자활 버튼 추가 */}
          <button 
            onClick={handleScrapeBusanjh}
            disabled={isScraping}
            className="bg-violet-600 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 text-xs hover:bg-violet-700 transition"
          >
            <DownloadCloud size={14}/> 부산자활
          </button>
        </div>
      </div>

      {/* 검색 바 */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
          <input 
            type="text" 
            placeholder="지원사업명 검색..."
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
            className="flex-1 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"
          />
          <button type="submit" className="bg-slate-800 text-white px-4 rounded-lg flex items-center gap-2">
            <Search size={16} /> 검색
          </button>
        </form>
      </div>

      {/* 목록 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-bold w-28">지원분야</th>
              <th className="p-4 font-bold">지원사업명</th>
              <th className="p-4 font-bold w-48">소관부처/지자체</th>
              <th className="p-4 font-bold w-48">신청기간</th>
              <th className="p-4 font-bold w-24 text-center">상세</th>
            </tr>
          </thead>
          <tbody>
            {funds.length > 0 ? funds.map(f => (
              <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                    {f.category || '기타'}
                  </span>
                </td>
                <td className="p-4 font-medium text-slate-800 leading-tight">
                  {f.title}
                </td>
                <td className="p-4 text-slate-600 text-xs">
                  {f.department}
                </td>
                <td className="p-4 text-slate-500 text-xs tracking-tighter">
                  {f.period || '-'}
                </td>
                <td className="p-4 text-center">
                  <a 
                    href={f.detailUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                  >
                    보기 <ExternalLink size={12} />
                  </a>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  데이터가 없습니다. 우측 상단의 동기화 버튼을 눌러 데이터를 수집해 주세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* --- 그룹화된 페이지네이션 --- */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex justify-center items-center gap-2">
            <button
              onClick={() => fetchFunds(startPage - 1, searchTitle)}
              disabled={startPage === 1}
              className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                startPage === 1 
                  ? 'text-slate-300 cursor-not-allowed' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="이전 10페이지"
            >
              <ChevronLeft size={20} />
            </button>

            {pages.map(p => (
              <button
                key={p}
                onClick={() => fetchFunds(p, searchTitle)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                  p === page 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => fetchFunds(endPage + 1, searchTitle)}
              disabled={endPage === totalPages}
              className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                endPage === totalPages 
                  ? 'text-slate-300 cursor-not-allowed' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="다음 10페이지"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}