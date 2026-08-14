// src/app/(admin)/admin/statistics/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart2, Calendar, Search, Loader2, MousePointerClick, Activity } from "lucide-react";

export default function StatisticsManager() {
  const [activeTab, setActiveTab] = useState<"TIME" | "PAGE">("TIME");
  const [statsData, setStatsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [timeType, setTimeType] = useState("daily");
  
  // 💡 월/년 단위도 계산할 수 있도록 유틸 함수 보강
  const getInitialDate = (offsetDays: number = 0, offsetMonths: number = 0, offsetYears: number = 0) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - offsetYears);
    d.setMonth(d.getMonth() - offsetMonths);
    d.setDate(d.getDate() - offsetDays);
    
    const kstOffset = 9 * 60 * 60 * 1000;
    return new Date(d.getTime() + kstOffset).toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(getInitialDate(7));
  const [endDate, setEndDate] = useState(getInitialDate(0));

  // 통계 데이터 가져오기
  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = "";
      if (activeTab === "TIME") {
        url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/visitors/stats/time?type=${timeType}&startDate=${startDate}&endDate=${endDate}`;
      } else {
        url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/visitors/stats/page`;
      }

      const res = await fetch(url);
      const json = await res.json();
      
      if (json.success) {
        setStatsData(json.data);
      } else {
        setStatsData([]);
      }
    } catch (error) {
      console.error("통계 조회 실패:", error);
      alert("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, timeType, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, [activeTab]); // 탭 전환 시 조회

  // 💡 조회 기준 변경 시 날짜를 센스있게 자동 갱신해주는 핸들러
  const handleTimeTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setTimeType(newType);
    
    if (newType === "hourly") setStartDate(getInitialDate(1)); // 1일 전
    else if (newType === "daily") setStartDate(getInitialDate(7)); // 7일 전
    else if (newType === "monthly") setStartDate(getInitialDate(0, 6, 0)); // 6개월 전
    else if (newType === "yearly") setStartDate(getInitialDate(0, 0, 3)); // 3년 전
    
    setEndDate(getInitialDate(0)); // 종료일은 항상 오늘
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStats();
  };

  const maxCount = Math.max(...statsData.map(item => Number(item.visitCount)), 1);

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">
      
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">방문자 통계</h2>
          <p className="text-sm text-slate-500 mt-1">사이트의 트래픽 흐름과 인기 페이지를 분석합니다.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("TIME")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === "TIME" 
              ? "border-indigo-600 text-indigo-600" 
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <Activity size={18} /> 기간별 통계
        </button>
        <button
          onClick={() => setActiveTab("PAGE")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === "PAGE" 
              ? "border-indigo-600 text-indigo-600" 
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <MousePointerClick size={18} /> 페이지별 통계
        </button>
      </div>

      {activeTab === "TIME" && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">조회 기준</label>
              <select 
                value={timeType} 
                onChange={handleTimeTypeChange} /* 💡 수정된 핸들러 연결 */
                className="border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"
              >
                <option value="hourly">시간별 (Hourly)</option>
                <option value="daily">일별 (Daily)</option>
                <option value="monthly">월별 (Monthly)</option>
                <option value="yearly">연도별 (Yearly)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">시작일</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="pb-2 text-slate-400 font-bold">~</div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">종료일</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button type="submit" className="bg-slate-800 hover:bg-black text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold text-sm transition">
              <Search size={16} /> 통계 보기
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center flex-col gap-3">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <p className="text-sm font-bold text-slate-600">데이터를 분석 중입니다...</p>
          </div>
        )}

        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-bold w-1/3">
                {activeTab === "TIME" ? "조회 기간" : "페이지 URL 경로"}
              </th>
              <th className="p-4 font-bold w-32 text-right">방문 수(View)</th>
              <th className="p-4 font-bold">비율 / 시각화</th>
            </tr>
          </thead>
          <tbody>
            {statsData.length > 0 ? (
              statsData.map((row, idx) => {
                const count = Number(row.visitCount);
                const percent = Math.round((count / maxCount) * 100);
                
                return (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-700 break-all">
                      {activeTab === "TIME" ? row.timePeriod : (
                        <a href={row.pageUrl} target="_blank" rel="noreferrer" className="hover:text-indigo-600 hover:underline">
                          {row.pageUrl === "/" ? "/ (메인 페이지)" : row.pageUrl}
                        </a>
                      )}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-900">
                      {count.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3 w-full max-w-sm">
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-700 ease-out" 
                            style={{ width: `${percent}%` }} 
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-8">{percent}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={3} className="p-12 text-center text-slate-500">
                  해당 조건에 일치하는 통계 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}