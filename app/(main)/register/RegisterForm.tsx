// src/app/register/RegisterForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import Script from "next/script"; // 💡 다음 우편번호 API 로드를 위해 추가

interface RegisterFormProps {
  settings: any;
}

export default function RegisterForm({ settings }: RegisterFormProps) {
  const router = useRouter();
  
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
    companyName: "",
    // 💡 주소 관련 필드 추가
    postcode: "",
    address: "",
    address_detail: "",
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

  const handleTypeChange = (type: "NORMAL" | "UNION") => {
    clearMessages();
    setMemberType(type);
  };

  // 💡 다음 우편번호 검색 팝업 열기
  const openPostcode = () => {
    if (typeof window === "undefined" || !(window as any).daum) {
      setErrorMessage("우편번호 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    new (window as any).daum.Postcode({
      oncomplete: (data: any) => {
        // 검색 결과 항목을 클릭했을때 실행할 코드를 작성하는 부분.
        setFormData((prev) => ({
          ...prev,
          postcode: data.zonecode, // 우편번호 (5자리)
          address: data.address, // 기본 주소
        }));
        clearMessages();
        
        // 상세주소 입력 칸으로 포커스를 이동하기 위한 로직 추가 가능
        const detailInput = document.querySelector('input[name="address_detail"]') as HTMLInputElement;
        if (detailInput) {
          detailInput.focus();
        }
      },
    }).open();
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
    onSuccess: () => {
      setSuccessMessage("회원가입이 완료되었습니다. 잠시 후 로그인 페이지로 이동합니다.");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    },
    onError: (error: any) => {
      setErrorMessage(error.message || "서버와 통신할 수 없습니다. 네트워크 상태를 확인해주세요.");
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

    if (settings?.useAddress) {
      if (!formData.postcode || !formData.address) {
        return setErrorMessage("우편번호 및 기본 주소를 입력해 주세요.");
      }
    }

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
    
    // 💡 주소 데이터 Append 추가
    if (settings?.useAddress) {
      submitData.append("postcode", formData.postcode);
      submitData.append("address", formData.address);
      submitData.append("address_detail", formData.address_detail);
    }

    if (memberType === "NORMAL" && settings?.useNickname) {
      submitData.append("nickname", formData.nickname);
    }
    
    if (memberType === "UNION") {
      submitData.append("companyName", formData.companyName);
      if (approvalFile) {
        submitData.append("approvalFile", approvalFile);
      }
    }

    registerMutation.mutate(submitData);
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm dark:text-white";
  const labelClass = "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5";

  return (
    <>
      {/* 💡 다음 우편번호 API 스크립트 로드 */}
      <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl mb-6">
          {/* <button
            type="button"
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
              memberType === "NORMAL"
                ? "bg-white dark:bg-slate-800 shadow text-indigo-600 dark:text-indigo-400"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
            onClick={() => handleTypeChange("NORMAL")}
          >
            일반 회원
          </button> */}
          {/* <button
            type="button"
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
              memberType === "UNION"
                ? "bg-white dark:bg-slate-800 shadow text-indigo-600 dark:text-indigo-400"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
            onClick={() => handleTypeChange("UNION")}
          >
            조합원회원
          </button> */}
        </div>

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

        <div className="border-t border-slate-100 dark:border-slate-800 my-4"></div>

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
        )}

        {settings?.useMobile && (
          <div>
            <label className={labelClass}>{memberType === "UNION" ? "담당자 휴대폰 번호" : "휴대폰 번호"} <span className="text-red-500">*</span></label>
            <input type="tel" name="mobile" required onChange={handleChange} className={inputClass} placeholder="010-0000-0000" />
          </div>
        )}

        {settings?.useDob && (
          <div>
            <label className={labelClass}>생년월일</label>
            <input type="date" name="dob" onChange={handleChange} className={inputClass} />
          </div>
        )}

        {/* 💡 주소 입력 폼 렌더링 */}
        {settings?.useAddress && (
          <div className="space-y-3">
            <label className={labelClass}>주소 <span className="text-red-500">*</span></label>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                name="postcode" 
                value={formData.postcode} 
                readOnly 
                className={`${inputClass} flex-1 bg-slate-100 dark:bg-slate-700/50 cursor-not-allowed`} 
                placeholder="우편번호" 
              />
              <button 
                type="button" 
                onClick={openPostcode} 
                className="px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
              >
                우편번호 검색
              </button>
            </div>
            
            <input 
              type="text" 
              name="address" 
              value={formData.address} 
              readOnly 
              className={`${inputClass} bg-slate-100 dark:bg-slate-700/50 cursor-not-allowed`} 
              placeholder="기본 주소" 
            />
            <input 
              type="text" 
              name="address_detail" 
              value={formData.address_detail} 
              onChange={handleChange} 
              className={inputClass} 
              placeholder="상세 주소를 입력해주세요" 
            />
          </div>
        )}

        {(settings?.useTermsOfService || settings?.usePrivacyPolicy) && (
          <div className="pt-4 space-y-6 border-t border-slate-100 dark:border-slate-800">
            {settings?.useTermsOfService && (
              <div className="space-y-3">
                <label className={labelClass}>이용약관 동의 <span className="text-red-500">*</span></label>
                <div 
                  className="w-full h-36 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-400"
                  dangerouslySetInnerHTML={{ __html: settings.termsContent || "이용약관 내용이 아직 등록되지 않았습니다." }}
                />
                <label className="flex items-center gap-2.5 cursor-pointer w-fit">
                  <input 
                    type="checkbox" 
                    checked={agreeTerms}
                    onChange={(e) => { clearMessages(); setAgreeTerms(e.target.checked); }}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" 
                  />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    (필수) 이용약관에 동의합니다.
                  </span>
                </label>
              </div>
            )}

            {settings?.usePrivacyPolicy && (
              <div className="space-y-3">
                <label className={labelClass}>개인정보처리방침 동의 <span className="text-red-500">*</span></label>
                <div 
                  className="w-full h-36 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-400"
                  dangerouslySetInnerHTML={{ __html: settings.privacyContent || "개인정보처리방침 내용이 아직 등록되지 않았습니다." }}
                />
                <label className="flex items-center gap-2.5 cursor-pointer w-fit">
                  <input 
                    type="checkbox" 
                    checked={agreePrivacy}
                    onChange={(e) => { clearMessages(); setAgreePrivacy(e.target.checked); }}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" 
                  />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    (필수) 개인정보 수집 및 이용에 동의합니다.
                  </span>
                </label>
              </div>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold">
            <AlertCircle size={18} className="flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}
        
        {successMessage && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-bold">
            <CheckCircle2 size={18} className="flex-shrink-0" />
            <p>{successMessage}</p>
          </div>
        )}

        <div className="pt-2">
          <button 
            type="submit" 
            disabled={registerMutation.isPending}
            className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md transition-colors text-lg disabled:opacity-70"
          >
            {registerMutation.isPending && <Loader2 className="animate-spin" size={20} />}
            {registerMutation.isPending ? "가입 처리 중..." : "가입하기"}
          </button>
        </div>
      </form>
    </>
  );
}