"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Users, Shield, KeyRound, UserCheck, Power, FileText, Sparkles } from "lucide-react";

export default function MemberSettingsPage() {
  const [formData, setFormData] = useState({
    memberSystemMode: "ALL",
    useEmailAsLoginId: true,
    useEmail: true,
    useName: true,
    useNickname: true,
    usePhone: false,
    useMobile: true,
    useAddress: false,
    useDob: false,

    // 승인제 관련 상태
    useApproval: false,
    approvalType: "DOCUMENT",
    approvalNotice: "",
    approvalWaitLevel: 0,

    useTermsOfService: true,
    usePrivacyPolicy: true,
    termsContent: "",
    privacyContent: "",

    defaultLevel: 1,
    levelNames: {} as Record<number, string>,

    useKakaoLogin: false, kakaoClientId: "", kakaoClientSecret: "",
    useNaverLogin: false, naverClientId: "", naverClientSecret: "",
    useGoogleLogin: false, googleClientId: "", googleClientSecret: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [aiPrompts, setAiPrompts] = useState({ terms: "", privacy: "" });
  const [isGenerating, setIsGenerating] = useState({ terms: false, privacy: false });
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/member-settings`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const s = (val: string | null) => val || "";
          setFormData({
            memberSystemMode: json.data.memberSystemMode || "ALL",
            useEmailAsLoginId: Boolean(json.data.useEmailAsLoginId),
            useEmail: Boolean(json.data.useEmail),
            useName: Boolean(json.data.useName),
            useNickname: Boolean(json.data.useNickname),
            usePhone: Boolean(json.data.usePhone),
            useMobile: Boolean(json.data.useMobile),
            useAddress: Boolean(json.data.useAddress),
            useDob: Boolean(json.data.useDob),

            useApproval: Boolean(json.data.useApproval),
            approvalType: json.data.approvalType || "DOCUMENT",
            approvalNotice: s(json.data.approvalNotice),
            approvalWaitLevel: json.data.approvalWaitLevel ?? 0,

            useTermsOfService: Boolean(json.data.useTermsOfService ?? true),
            usePrivacyPolicy: Boolean(json.data.usePrivacyPolicy ?? true),
            termsContent: s(json.data.termsContent),
            privacyContent: s(json.data.privacyContent),


            defaultLevel: json.data.defaultLevel ?? 1,
            levelNames: json.data.levelNames || {
              0: "승인대기", 1: "일반회원", 2: "정회원", 10: "최고관리자"
            },
            useKakaoLogin: Boolean(json.data.useKakaoLogin),
            kakaoClientId: s(json.data.kakaoClientId),
            kakaoClientSecret: s(json.data.kakaoClientSecret),
            useNaverLogin: Boolean(json.data.useNaverLogin),
            naverClientId: s(json.data.naverClientId),
            naverClientSecret: s(json.data.naverClientSecret),
            useGoogleLogin: Boolean(json.data.useGoogleLogin),
            googleClientId: s(json.data.googleClientId),
            googleClientSecret: s(json.data.googleClientSecret),
          });
        }
      })
      .finally(() => setIsLoading(false));
  }, []);
  const handleAIGenerate = async (type: "terms" | "privacy") => {
    const promptText = type === "terms" ? aiPrompts.terms : aiPrompts.privacy;
    if (!promptText.trim()) {
      alert("AI에게 요청할 내용을 입력해주세요.");
      return;
    }

    setIsGenerating((prev) => ({ ...prev, [type]: true }));
    try {
      const currentContent = type === "terms" ? formData.termsContent : formData.privacyContent;

      // 약관에 맞는 전문 작성을 유도하기 위해 프롬프트 보강
      const enhancedPrompt = `${promptText}\n(조건: HTML 태그를 활용해 가독성 좋게 작성해주고, 법적인 약관/방침 형태의 전문을 제공해줘)`;

      // 💡 1. API 경로 확인 및 수정 (/api/generate-policy)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ai/generate-policy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          currentContent: currentContent,
          policyType: type, // 💡 2. targetType 대신 백엔드가 요구하는 policyType 전달
        }),
      });

      const json = await res.json();

      // HTTP 상태 코드가 200이 아닌 경우 (예: 503 과부하 에러) 백엔드 메시지 띄우기
      if (!res.ok) {
        throw new Error(json.message || "서버 통신 오류가 발생했습니다.");
      }

      // 💡 3. 백엔드 반환 값에 맞춰 json.elements 대신 json.content를 직접 사용
      if (json.success && json.content) {
        setFormData((prev) => ({
          ...prev,
          [type === "terms" ? "termsContent" : "privacyContent"]: json.content,
        }));
      } else {
        alert("AI가 내용을 생성하지 못했습니다: " + (json.message || "알 수 없는 오류"));
      }
    } catch (error: any) {
      alert(`AI 생성 실패: ${error.message}`);
    } finally {
      setIsGenerating((prev) => ({ ...prev, [type]: false }));
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, type, checked, value } = target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLevelNameChange = (level: number, nameValue: string) => {
    setFormData((prev) => ({
      ...prev,
      levelNames: { ...prev.levelNames, [level]: nameValue }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/member-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) alert("회원 설정이 성공적으로 저장되었습니다.");
      else alert("저장 실패!");
    } catch (error) {
      alert("서버 통신 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="flex h-64 items-center justify-center text-indigo-600">
      <Loader2 className="animate-spin mr-2" size={24} /> 데이터를 불러오는 중...
    </div>
  );

  const inputClass = "w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1.5";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-slate-900">회원 설정</h2>
        <p className="text-sm text-slate-500 mt-1">회원가입 정책, 가입 승인 방식, 0~10 레벨 및 소셜 로그인을 관리합니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 px-6 py-4 flex items-center gap-2">
            <Power className="text-emerald-400" size={20} />
            <h3 className="text-lg font-bold text-white">1. 회원 시스템 운영 모드</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* 개방형 (모두 사용) */}
            <label className={`cursor-pointer border-2 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all ${formData.memberSystemMode === 'ALL' ? 'border-emerald-500 bg-emerald-50/50 shadow-md' : 'border-slate-200 hover:border-emerald-300 bg-slate-50 hover:bg-white'}`}>
              <input type="radio" name="memberSystemMode" value="ALL" checked={formData.memberSystemMode === 'ALL'} onChange={handleChange} className="hidden" />
              <span className={`font-black text-lg mb-1 ${formData.memberSystemMode === 'ALL' ? 'text-emerald-700' : 'text-slate-700'}`}>개방형 (모두 허용)</span>
              <span className="text-xs text-slate-500 leading-relaxed mt-1">신규 회원가입과 로그인을<br />모두 허용합니다.</span>
            </label>

            {/* 폐쇄형 (로그인만) */}
            {/* <label className={`cursor-pointer border-2 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all ${formData.memberSystemMode === 'LOGIN_ONLY' ? 'border-indigo-500 bg-indigo-50/50 shadow-md' : 'border-slate-200 hover:border-indigo-300 bg-slate-50 hover:bg-white'}`}>
               <input type="radio" name="memberSystemMode" value="LOGIN_ONLY" checked={formData.memberSystemMode === 'LOGIN_ONLY'} onChange={handleChange} className="hidden" />
               <span className={`font-black text-lg mb-1 ${formData.memberSystemMode === 'LOGIN_ONLY' ? 'text-indigo-700' : 'text-slate-700'}`}>폐쇄형 (로그인 전용)</span>
               <span className="text-xs text-slate-500 leading-relaxed mt-1">신규 가입을 차단하고<br/>기존 회원만 로그인합니다.</span>
            </label> */}

            {/* 비회원제 (모두 차단) */}
            <label className={`cursor-pointer border-2 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all ${formData.memberSystemMode === 'NONE' ? 'border-red-500 bg-red-50/50 shadow-md' : 'border-slate-200 hover:border-red-300 bg-slate-50 hover:bg-white'}`}>
              <input type="radio" name="memberSystemMode" value="NONE" checked={formData.memberSystemMode === 'NONE'} onChange={handleChange} className="hidden" />
              <span className={`font-black text-lg mb-1 ${formData.memberSystemMode === 'NONE' ? 'text-red-700' : 'text-slate-700'}`}>비회원제 (모두 차단)</span>
              <span className="text-xs text-slate-500 leading-relaxed mt-1">가입과 로그인을 모두 차단하고<br />사이트를 운영합니다.</span>
            </label>

          </div>
        </div>
        {/* 섹션 1: 가입 폼 및 승인 정책 설정 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <Users className="text-indigo-600" size={20} />
            <h3 className="text-lg font-bold text-slate-800">1. 회원가입 폼 및 가입 승인 제도</h3>
          </div>
          <div className="p-6 space-y-6">

            {/* 이메일 통합 토글 */}
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">아이디와 이메일 통합 사용</p>
                <p className="text-xs text-slate-500 mt-0.5">회원가입 시 이메일 주소를 로그인 아이디로 직접 사용합니다.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="useEmailAsLoginId" checked={formData.useEmailAsLoginId} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* 가입 승인제 설정 (신규 추가) */}
            <div className="p-5 border border-slate-200 rounded-xl space-y-4 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="text-indigo-600" size={20} />
                  <div>
                    <p className="font-bold text-slate-800">관리자 가입 승인 제도 사용</p>
                    <p className="text-xs text-slate-500">회원가입 직후 바로 로그인하지 못하고 승인 대기 상태로 설정합니다.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="useApproval" checked={formData.useApproval} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {formData.useApproval && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  {/* ✨ 승인 대기 회원 레벨 선택 추가 */}
                  <div>
                    <label className={labelClass}>승인 대기 회원 임시 권한 (Wait Level)</label>
                    <select name="approvalWaitLevel" value={formData.approvalWaitLevel} onChange={handleChange} className={inputClass}>
                      {Array.from({ length: 11 }, (_, i) => (
                        <option key={i} value={i}>
                          레벨 {i} ({formData.levelNames[i] || `권한 ${i}`})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                      가입 직후 관리자 승인이 완료되기 전까지 임시로 부여될 레벨입니다. (일반적으로 레벨 0 지정)
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>승인 방식 선택</label>
                    <select name="approvalType" value={formData.approvalType} onChange={handleChange} className={inputClass}>
                      <option value="DOCUMENT">증빙 서류 업로드 심사 (사업자등록증, 자격증 등)</option>
                      <option value="EMAIL">이메일 본인 인증 (인증 링크 클릭 시 자동 승인)</option>
                    </select>
                  </div>

                  {formData.approvalType === "DOCUMENT" && (
                    <div>
                      <label className={labelClass}>서류 제출 안내 및 심사 조건 문구</label>
                      <textarea
                        name="approvalNotice"
                        value={formData.approvalNotice}
                        onChange={handleChange}
                        rows={3}
                        placeholder="예: 사업자등록증 사본을 첨부해 주세요. 관리자 확인 후 1영업일 내에 승인됩니다."
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 가입 폼 필드 체크박스 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${!formData.useEmailAsLoginId ? 'border-indigo-300 bg-indigo-50/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input type="checkbox" name="useEmail" checked={formData.useEmail} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                <div>
                  <span className="text-sm font-semibold text-slate-700 block">이메일 사용</span>
                  {!formData.useEmailAsLoginId && <span className="text-[10px] text-indigo-600 font-bold">필수 활성화</span>}
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                <input type="checkbox" name="useName" checked={formData.useName} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                <span className="text-sm font-semibold text-slate-700">이름 사용</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                <input type="checkbox" name="useNickname" checked={formData.useNickname} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                <span className="text-sm font-semibold text-slate-700">닉네임 사용</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                <input type="checkbox" name="useMobile" checked={formData.useMobile} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                <span className="text-sm font-semibold text-slate-700">휴대폰 번호 사용</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                <input type="checkbox" name="usePhone" checked={formData.usePhone} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                <span className="text-sm font-semibold text-slate-700">일반 전화번호 사용</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                <input type="checkbox" name="useAddress" checked={formData.useAddress} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                <span className="text-sm font-semibold text-slate-700">주소 입력 사용</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                <input type="checkbox" name="useDob" checked={formData.useDob} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                <span className="text-sm font-semibold text-slate-700">생년월일 사용</span>
              </label>
            </div>
          </div>
        </div>

        {/* 섹션 2: 0~10 권한 레벨 및 명칭 설정 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <Shield className="text-indigo-600" size={20} />
            <h3 className="text-lg font-bold text-slate-800">2. 회원 권한 레벨(0~10) 및 명칭 설정</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className={labelClass}>신규 가입 회원 기본 권한 (Default Level)</label>
              <select name="defaultLevel" value={formData.defaultLevel} onChange={handleChange} className={inputClass}>
                {Array.from({ length: 11 }, (_, i) => (
                  <option key={i} value={i}>
                    레벨 {i} ({formData.levelNames[i] || `권한 ${i}`})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>레벨별 명칭 정의 (0레벨 ~ 10레벨)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {Array.from({ length: 11 }, (_, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md w-14 text-center">
                      Lv.{i}
                    </span>
                    <input
                      type="text"
                      value={formData.levelNames[i] || ""}
                      onChange={(e) => handleLevelNameChange(i, e.target.value)}
                      placeholder={`레벨 ${i} 명칭 입력`}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 섹션 3: SNS 로그인 연동 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <KeyRound className="text-indigo-600" size={20} />
            <h3 className="text-lg font-bold text-slate-800">3. 소셜(SNS) 로그인 연동 설정</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* 카카오 */}
            <div className="p-4 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">카카오 로그인</span>
                <input type="checkbox" name="useKakaoLogin" checked={formData.useKakaoLogin} onChange={handleChange} className="w-5 h-5 text-yellow-500 rounded border-slate-300" />
              </div>
              {formData.useKakaoLogin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <input type="text" name="kakaoClientId" value={formData.kakaoClientId} onChange={handleChange} className={inputClass} placeholder="카카오 REST API 키" />
                  <input type="text" name="kakaoClientSecret" value={formData.kakaoClientSecret} onChange={handleChange} className={inputClass} placeholder="카카오 Client Secret (선택)" />
                </div>
              )}
            </div>

            {/* 네이버 */}
            <div className="p-4 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">네이버 로그인</span>
                <input type="checkbox" name="useNaverLogin" checked={formData.useNaverLogin} onChange={handleChange} className="w-5 h-5 text-green-600 rounded border-slate-300" />
              </div>
              {formData.useNaverLogin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <input type="text" name="naverClientId" value={formData.naverClientId} onChange={handleChange} className={inputClass} placeholder="네이버 Client ID" />
                  <input type="text" name="naverClientSecret" value={formData.naverClientSecret} onChange={handleChange} className={inputClass} placeholder="네이버 Client Secret" />
                </div>
              )}
            </div>

            {/* 구글 */}
            <div className="p-4 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">구글 로그인</span>
                <input type="checkbox" name="useGoogleLogin" checked={formData.useGoogleLogin} onChange={handleChange} className="w-5 h-5 text-blue-500 rounded border-slate-300" />
              </div>
              {formData.useGoogleLogin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <input type="text" name="googleClientId" value={formData.googleClientId} onChange={handleChange} className={inputClass} placeholder="구글 Client ID" />
                  <input type="text" name="googleClientSecret" value={formData.googleClientSecret} onChange={handleChange} className={inputClass} placeholder="구글 Client Secret" />
                </div>
              )}
            </div>
          </div>
          {/* 가입약관 및 개인정보처리 방침 설정 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
              <FileText className="text-indigo-600" size={20} />
              <h3 className="text-lg font-bold text-slate-800">4. 가입 약관 및 정책 설정</h3>
            </div>
            <div className="p-6 space-y-10">

              {/* --- 이용약관 영역 --- */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <p className="font-bold text-slate-800 text-base">이용약관 동의</p>
                    <p className="text-xs text-slate-500 mt-1">회원가입 시 이용약관 동의 항목을 노출합니다.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="useTermsOfService" checked={formData.useTermsOfService} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {formData.useTermsOfService && (
                  <div className="space-y-3">
                    {/* AI 어시스턴트 입력 폼 */}
                    <div className="flex flex-col gap-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                      <label className="text-sm font-bold text-indigo-700 flex items-center gap-1.5">
                        <Sparkles size={16} className="text-indigo-500" />
                        AI 자동 작성 및 수정
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={aiPrompts.terms}
                          onChange={(e) => setAiPrompts(prev => ({ ...prev, terms: e.target.value }))}
                          placeholder="예: 표준 쇼핑몰 이용약관 초안을 작성해줘"
                          className="flex-1 border border-indigo-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAIGenerate("terms"); } }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAIGenerate("terms")}
                          disabled={isGenerating.terms}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold disabled:opacity-50 min-w-[110px] flex justify-center items-center gap-1.5 transition-colors"
                        >
                          {isGenerating.terms ? <><Loader2 className="animate-spin" size={16} /> 생성 중</> : "AI 적용"}
                        </button>
                      </div>
                    </div>

                    <textarea
                      name="termsContent"
                      value={formData.termsContent}
                      onChange={handleChange}
                      rows={12}
                      placeholder="이용약관 내용을 입력하세요. (HTML 또는 평문 지원)"
                      className={inputClass}
                    />
                  </div>
                )}
              </div>

              {/* --- 개인정보처리방침 영역 --- */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <p className="font-bold text-slate-800 text-base">개인정보처리방침 동의</p>
                    <p className="text-xs text-slate-500 mt-1">회원가입 시 개인정보 수집 및 이용 동의 항목을 노출합니다.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="usePrivacyPolicy" checked={formData.usePrivacyPolicy} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {formData.usePrivacyPolicy && (
                  <div className="space-y-3">
                    {/* AI 어시스턴트 입력 폼 */}
                    <div className="flex flex-col gap-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                      <label className="text-sm font-bold text-indigo-700 flex items-center gap-1.5">
                        <Sparkles size={16} className="text-indigo-500" />
                        AI 자동 작성 및 수정
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={aiPrompts.privacy}
                          onChange={(e) => setAiPrompts(prev => ({ ...prev, privacy: e.target.value }))}
                          placeholder="예: 이름, 이메일, 연락처를 수집하는 개인정보처리방침 작성해줘"
                          className="flex-1 border border-indigo-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAIGenerate("privacy"); } }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAIGenerate("privacy")}
                          disabled={isGenerating.privacy}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold disabled:opacity-50 min-w-[110px] flex justify-center items-center gap-1.5 transition-colors"
                        >
                          {isGenerating.privacy ? <><Loader2 className="animate-spin" size={16} /> 생성 중</> : "AI 적용"}
                        </button>
                      </div>
                    </div>

                    <textarea
                      name="privacyContent"
                      value={formData.privacyContent}
                      onChange={handleChange}
                      rows={12}
                      placeholder="개인정보처리방침 내용을 입력하세요. (HTML 또는 평문 지원)"
                      className={inputClass}
                    />
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end pt-2 pb-10">
          <button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-lg transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-70">
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? "저장 중..." : "회원 설정 저장하기"}
          </button>
        </div>
      </form>
    </div>
  );
}