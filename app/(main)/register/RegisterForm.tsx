"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RegisterForm({ settings }: { settings: any }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // 회원 유형 탭 상태 (NORMAL: 일반회원, UNION: 조합원회원)
  const [memberType, setMemberType] = useState<"NORMAL" | "UNION">("NORMAL");

  // 상태 메시지 표시용 State (경고 및 성공 창)
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 기본 폼 데이터 State (companyName 추가)
  const [formData, setFormData] = useState({
    loginId: "",
    email: "",
    password: "",
    passwordConfirm: "",
    name: "",
    nickname: "",
    mobile: "",
    phone: "",
    dob: "",
    address: "",
    companyName: "" // 조합원용 기업명
  });

  // 파일 첨부 상태
  const [approvalFile, setApprovalFile] = useState<File | null>(null);

  // 약관 동의 상태 관리 State
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  // 입력 시 기존 에러 메시지 초기화
  const clearMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearMessages();
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearMessages();
    if (e.target.files && e.target.files.length > 0) {
      setApprovalFile(e.target.files[0]);
    } else {
      setApprovalFile(null);
    }
  };

  const handleTypeChange = (type: "NORMAL" | "UNION") => {
    clearMessages();
    setMemberType(type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    // 1. 비밀번호 확인 유효성 체크
    if (formData.password !== formData.passwordConfirm) {
      return setErrorMessage("비밀번호가 일치하지 않습니다.");
    }

    // 2. 조합원일 경우 첨부파일 필수 체크
    if (memberType === "UNION" && !approvalFile) {
      return setErrorMessage("승인을 위한 증빙서류를 첨부해 주세요.");
    }

    // 3. 약관 동의 유효성 체크
    if (settings.useTermsOfService && !agreeTerms) {
      return setErrorMessage("이용약관에 동의해 주세요.");
    }
    if (settings.usePrivacyPolicy && !agreePrivacy) {
      return setErrorMessage("개인정보처리방침에 동의해 주세요.");
    }

    setIsLoading(true);
    try {
      const submitData = new FormData();
      submitData.append("memberType", memberType);
      
      const finalLoginId = settings.useEmailAsLoginId ? formData.email : formData.loginId;
      submitData.append("loginId", finalLoginId);
      
      submitData.append("email", formData.email);
      submitData.append("password", formData.password);
      
      if (settings.useName) submitData.append("name", formData.name);
      if (settings.useMobile) submitData.append("mobile", formData.mobile);
      if (settings.usePhone) submitData.append("phone", formData.phone);
      if (settings.useDob) submitData.append("dob", formData.dob);
      if (settings.useAddress) submitData.append("address", formData.address);

      // 탭에 따른 분기 처리
      if (memberType === "NORMAL" && settings.useNickname) {
        submitData.append("nickname", formData.nickname);
      }
      
      if (memberType === "UNION") {
        submitData.append("companyName", formData.companyName);
        if (approvalFile) {
          submitData.append("approvalFile", approvalFile);
        }
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register`, {
        method: "POST",
        body: submitData,
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage("회원가입이 완료되었습니다. 잠시 후 로그인 페이지로 이동합니다.");
        // 사용자에게 메시지를 보여준 뒤 1.5초 후 이동
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        setErrorMessage(data.message || "가입 처리 중 문제가 발생했습니다.");
      }
    } catch (error) {
      setErrorMessage("서버와 통신할 수 없습니다. 네트워크 상태를 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm dark:text-white";
  const labelClass = "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      
      {/* 회원 유형(탭) 선택 영역 */}
      <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl mb-6">
        <button
          type="button"
          className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
            memberType === "NORMAL"
              ? "bg-white dark:bg-slate-800 shadow text-indigo-600 dark:text-indigo-400"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
          onClick={() => handleTypeChange("NORMAL")}
        >
          일반 회원
        </button>
        <button
          type="button"
          className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
            memberType === "UNION"
              ? "bg-white dark:bg-slate-800 shadow text-indigo-600 dark:text-indigo-400"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
          onClick={() => handleTypeChange("UNION")}
        >
          조합원회원
        </button>
      </div>

      {/* --- 공통 기본 정보 입력 영역 --- */}
      {settings.useEmailAsLoginId ? (
        <div>
          <label className={labelClass}>이메일 (아이디) <span className="text-red-500">*</span></label>
          <input type="email" name="email" required onChange={handleChange} className={inputClass} placeholder="example@email.com" />
        </div>
      ) : (
        <>
          <div>
            <label className={labelClass}>아이디 <span className="text-red-500">*</span></label>
            <input type="text" name="loginId" required onChange={handleChange} className={inputClass} placeholder="영문, 숫자 조합 4~12자" />
          </div>
          {settings.useEmail && (
            <div>
              <label className={labelClass}>이메일 <span className="text-red-500">*</span></label>
              <input type="email" name="email" required onChange={handleChange} className={inputClass} placeholder="example@email.com" />
            </div>
          )}
        </>
      )}

      <div>
        <label className={labelClass}>비밀번호 <span className="text-red-500">*</span></label>
        <input type="password" name="password" required onChange={handleChange} className={inputClass} placeholder="비밀번호 입력" />
      </div>
      <div>
        <label className={labelClass}>비밀번호 확인 <span className="text-red-500">*</span></label>
        <input type="password" name="passwordConfirm" required onChange={handleChange} className={inputClass} placeholder="비밀번호를 다시 입력해주세요" />
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 my-4"></div>

      {settings.useName && (
        <div>
          <label className={labelClass}>{memberType === "UNION" ? "담당자 이름" : "이름"} <span className="text-red-500">*</span></label>
          <input type="text" name="name" required onChange={handleChange} className={inputClass} placeholder="실명 입력" />
        </div>
      )}

      {/* 탭에 따른 분기: 일반 회원은 닉네임, 조합원회원은 기업명과 첨부파일 */}
      {memberType === "NORMAL" ? (
        settings.useNickname && (
          <div>
            <label className={labelClass}>닉네임</label>
            <input type="text" name="nickname" onChange={handleChange} className={inputClass} placeholder="활동에 사용할 닉네임" />
          </div>
        )
      ) : (
        <>
          <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800 space-y-4">
            <div>
              <label className={labelClass}>기업명 <span className="text-red-500">*</span></label>
              <input type="text" name="companyName" required onChange={handleChange} className={inputClass} placeholder="기업명을 정확히 입력해주세요" />
            </div>
            <div>
              <label className={labelClass}>승인을 위한 증빙서류 (사업자등록증 등) <span className="text-red-500">*</span></label>
              <input 
                type="file" 
                required 
                onChange={handleFileChange} 
                className={`${inputClass} !p-2 bg-white dark:bg-slate-800`} 
                accept=".jpg,.jpeg,.png,.pdf" 
              />
              <p className="text-xs text-slate-500 mt-1">파일 확장자: jpg, png, pdf 허용</p>
            </div>
          </div>
        </>
      )}

      {settings.useMobile && (
        <div>
          <label className={labelClass}>{memberType === "UNION" ? "담당자 휴대폰 번호" : "휴대폰 번호"} <span className="text-red-500">*</span></label>
          <input type="tel" name="mobile" required onChange={handleChange} className={inputClass} placeholder="010-0000-0000" />
        </div>
      )}

      {settings.useDob && (
        <div>
          <label className={labelClass}>생년월일</label>
          <input type="date" name="dob" onChange={handleChange} className={inputClass} />
        </div>
      )}

      {/* --- 약관 및 정책 동의 영역 --- */}
      {(settings.useTermsOfService || settings.usePrivacyPolicy) && (
        <div className="pt-4 space-y-6 border-t border-slate-100 dark:border-slate-800">
          
          {settings.useTermsOfService && (
            <div className="space-y-3">
              <label className={labelClass}>이용약관 동의 <span className="text-red-500">*</span></label>
              <div 
                className="w-full h-36 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-400 prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: settings.termsContent || "이용약관 내용이 아직 등록되지 않았습니다." }}
              />
              <label className="flex items-center gap-2.5 cursor-pointer w-fit">
                <input 
                  type="checkbox" 
                  checked={agreeTerms}
                  onChange={(e) => {
                    clearMessages();
                    setAgreeTerms(e.target.checked);
                  }}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700" 
                />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  (필수) 이용약관에 동의합니다.
                </span>
              </label>
            </div>
          )}

          {settings.usePrivacyPolicy && (
            <div className="space-y-3">
              <label className={labelClass}>개인정보처리방침 동의 <span className="text-red-500">*</span></label>
              <div 
                className="w-full h-36 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-400 prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: settings.privacyContent || "개인정보처리방침 내용이 아직 등록되지 않았습니다." }}
              />
              <label className="flex items-center gap-2.5 cursor-pointer w-fit">
                <input 
                  type="checkbox" 
                  checked={agreePrivacy}
                  onChange={(e) => {
                    clearMessages();
                    setAgreePrivacy(e.target.checked);
                  }}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700" 
                />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  (필수) 개인정보 수집 및 이용에 동의합니다.
                </span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* --- 에러 및 성공 메시지 출력 영역 --- */}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 size={18} className="flex-shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      {/* --- 가입하기 버튼 --- */}
      <div className="pt-2">
        <button 
          type="submit" 
          disabled={isLoading}
          className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md transition-colors text-lg disabled:opacity-70"
        >
          {isLoading && <Loader2 className="animate-spin" size={20} />}
          {isLoading ? "가입 처리 중..." : "가입하기"}
        </button>
      </div>
    </form>
  );
}