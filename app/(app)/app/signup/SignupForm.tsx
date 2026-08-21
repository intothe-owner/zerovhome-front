"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

interface SignupFormProps {
  settings: any;
}

export default function SignupForm({ settings }: SignupFormProps) {
  const router = useRouter();
  
  // 일반(NORMAL), 조합원(UNION) 회원 유형 구분[cite: 3, 6]
  const [memberType, setMemberType] = useState<"NORMAL" | "UNION">("NORMAL");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
    companyName: ""
  });

  const [approvalFile, setApprovalFile] = useState<File | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

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

  const registerMutation = useMutation({
    mutationFn: async (submitData: FormData) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register`, {
        method: "POST",
        body: submitData,
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "가입 처리 중 문제가 발생했습니다.");
      }
      return data;
    },
    onSuccess: (data) => {
      setSuccessMessage("회원가입이 완료되었습니다.");
      
      // 💡 [안드로이드 웹뷰 연동 포인트]
      // 가입 성공 후 기기 푸시 토큰 등록(MemberDevice)을 위해 네이티브로 데이터 전송[cite: 2]
      // 네이티브에서 addJavascriptInterface(..., "AndroidBridge")로 지정한 이름을 사용합니다.
      const win = window as any;
      
      // 안드로이드 인터페이스 이름 'Android'로 변경하여 호출
      if (win.Android && win.Android.postMessage) {
        win.Android.postMessage(JSON.stringify({
          type: "SIGNUP_SUCCESS",
          memberId: data.memberId
        }));
      }

      setTimeout(() => {
        router.replace("/app/login"); 
      }, 1500);
    },
    onError: (error: any) => {
      setErrorMessage(error.message || "네트워크 상태를 확인해주세요.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (formData.password !== formData.passwordConfirm) {
      return setErrorMessage("비밀번호가 일치하지 않습니다.");
    }

    if (memberType === "UNION" && !approvalFile) {
      return setErrorMessage("승인을 위한 증빙서류를 첨부해 주세요.");
    }

    // MemberSetting 약관 설정 체크[cite: 4]
    if (settings?.useTermsOfService && !agreeTerms) {
      return setErrorMessage("이용약관에 동의해 주세요.");
    }
    if (settings?.usePrivacyPolicy && !agreePrivacy) {
      return setErrorMessage("개인정보처리방침에 동의해 주세요.");
    }

    const submitData = new FormData();
    submitData.append("memberType", memberType);
    
    const finalLoginId = settings?.useEmailAsLoginId ? formData.email : formData.loginId;
    submitData.append("loginId", finalLoginId);
    
    submitData.append("email", formData.email);
    submitData.append("password", formData.password);
    
    if (settings?.useName) submitData.append("name", formData.name);
    if (settings?.useMobile) submitData.append("mobile", formData.mobile);
    if (settings?.usePhone) submitData.append("phone", formData.phone);
    if (settings?.useDob) submitData.append("dob", formData.dob);
    if (settings?.useAddress) submitData.append("address", formData.address);

    if (memberType === "NORMAL" && settings?.useNickname) {
      submitData.append("nickname", formData.nickname);
    }
    
    if (memberType === "UNION") {
      submitData.append("companyName", formData.companyName);
      if (approvalFile) submitData.append("approvalFile", approvalFile);
    }

    registerMutation.mutate(submitData);
  };

  // 모바일 환경에 맞춘 인풋 및 라벨 스타일 (터치 영역 확보)
  const inputClass = "w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-[15px] dark:text-white";
  const labelClass = "block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 회원 유형 선택 탭[cite: 3, 6] */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        <button
          type="button"
          className={`flex-1 py-3 text-[14px] font-bold rounded-lg transition-all ${
            memberType === "NORMAL"
              ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
          onClick={() => { clearMessages(); setMemberType("NORMAL"); }}
        >
          일반 회원
        </button>
        <button
          type="button"
          className={`flex-1 py-3 text-[14px] font-bold rounded-lg transition-all ${
            memberType === "UNION"
              ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
          onClick={() => { clearMessages(); setMemberType("UNION"); }}
        >
          조합원 회원
        </button>
      </div>

      <div className="space-y-5">
        {settings?.useEmailAsLoginId ? (
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
            {settings?.useEmail && (
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

        {settings?.useName && (
          <div>
            <label className={labelClass}>{memberType === "UNION" ? "담당자 이름" : "이름"} <span className="text-red-500">*</span></label>
            <input type="text" name="name" required onChange={handleChange} className={inputClass} placeholder="실명 입력" />
          </div>
        )}

        {memberType === "NORMAL" ? (
          settings?.useNickname && (
            <div>
              <label className={labelClass}>닉네임</label>
              <input type="text" name="nickname" onChange={handleChange} className={inputClass} placeholder="활동에 사용할 닉네임" />
            </div>
          )
        ) : (
          <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 space-y-4 mt-2">
            <div>
              <label className={labelClass}>기업명 <span className="text-red-500">*</span></label>
              <input type="text" name="companyName" required onChange={handleChange} className={inputClass} placeholder="기업명을 정확히 입력해주세요" />
            </div>
            <div>
              <label className={labelClass}>승인 증빙서류 <span className="text-red-500">*</span></label>
              {/* 모바일에서 파일 첨부가 용이하도록 UI 구성 */}
              <input 
                type="file" 
                required 
                onChange={handleFileChange} 
                className={`w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 dark:file:bg-slate-700 dark:file:text-slate-300`} 
                accept=".jpg,.jpeg,.png,.pdf" 
              />
            </div>
          </div>
        )}

        {settings?.useMobile && (
          <div>
            <label className={labelClass}>{memberType === "UNION" ? "담당자 휴대폰" : "휴대폰 번호"} <span className="text-red-500">*</span></label>
            <input type="tel" name="mobile" required onChange={handleChange} className={inputClass} placeholder="010-0000-0000" />
          </div>
        )}
      </div>

      {/* 약관 동의 영역 (모바일 스크롤 고려 높이 조정)[cite: 4] */}
      {(settings?.useTermsOfService || settings?.usePrivacyPolicy) && (
        <div className="pt-2 space-y-5">
          {settings?.useTermsOfService && (
            <div className="space-y-2">
              <label className={labelClass}>이용약관 동의 <span className="text-red-500">*</span></label>
              <div 
                className="w-full h-28 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[12px] text-slate-600 dark:text-slate-400"
                dangerouslySetInnerHTML={{ __html: settings.termsContent || "이용약관 내용이 등록되지 않았습니다." }}
              />
              <label className="flex items-center gap-2.5 cursor-pointer py-1">
                <input 
                  type="checkbox" 
                  checked={agreeTerms}
                  onChange={(e) => { clearMessages(); setAgreeTerms(e.target.checked); }}
                  className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" 
                />
                <span className="text-[14px] font-semibold text-slate-700 dark:text-slate-300">(필수) 이용약관에 동의합니다.</span>
              </label>
            </div>
          )}

          {settings?.usePrivacyPolicy && (
            <div className="space-y-2">
              <label className={labelClass}>개인정보처리방침 동의 <span className="text-red-500">*</span></label>
              <div 
                className="w-full h-28 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[12px] text-slate-600 dark:text-slate-400"
                dangerouslySetInnerHTML={{ __html: settings.privacyContent || "개인정보처리방침 내용이 등록되지 않았습니다." }}
              />
              <label className="flex items-center gap-2.5 cursor-pointer py-1">
                <input 
                  type="checkbox" 
                  checked={agreePrivacy}
                  onChange={(e) => { clearMessages(); setAgreePrivacy(e.target.checked); }}
                  className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" 
                />
                <span className="text-[14px] font-semibold text-slate-700 dark:text-slate-300">(필수) 개인정보 수집 및 이용에 동의합니다.</span>
              </label>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="flex items-center gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-bold">
          <CheckCircle2 size={18} className="flex-shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      <div className="pt-4 pb-8">
        <button 
          type="submit" 
          disabled={registerMutation.isPending}
          className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md transition-colors text-[16px] disabled:opacity-70"
        >
          {registerMutation.isPending && <Loader2 className="animate-spin" size={20} />}
          {registerMutation.isPending ? "가입 처리 중..." : "가입하기"}
        </button>
      </div>
    </form>
  );
}