"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { UploadCloud, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function QuestionUploadPage() {
  const router = useRouter();
  const [examTitle, setExamTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!examTitle || !file) {
      alert("시험 회차명과 엑셀 파일을 모두 입력해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("examTitle", examTitle);
    formData.append("file", file);

    try {
      setIsUploading(true);
      const res = await axios.post(`${API_BASE_URL}/api/questions/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.ok) {
        alert(`${res.data.saved}개의 문제가 성공적으로 등록되었습니다.`);
        router.push("/admin/question");
      }
    } catch (err) {
      console.error("업로드 에러:", err);
      alert("업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/question" className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">엑셀 문제 일괄 등록</h2>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">시험 회차명</label>
          <input
            type="text"
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
            placeholder="예: 전기기능사 1회"
            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">엑셀 파일 업로드</label>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50">
            <UploadCloud size={40} className="mx-auto text-slate-400 mb-3" />
            <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" id="excel-upload" />
            <label
              htmlFor="excel-upload"
              className="cursor-pointer bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors inline-block"
            >
              {file ? file.name : "파일 선택하기"}
            </label>
            <p className="text-xs text-slate-500 mt-2">.xlsx 형식의 파일만 지원됩니다.</p>
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save size={20} />
          {isUploading ? "등록 중..." : "문제 등록 완료"}
        </button>
      </div>
    </div>
  );
}