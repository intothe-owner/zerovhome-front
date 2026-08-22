export const formatPhone = (raw: string) => {
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

/** 숫자에 3자리 마다 콤마(,)를 추가합니다 (예: 1000 -> "1,000") */
export const formatNumber = (value: number | string): string => {
  if (value === null || value === undefined || value === '') return '';
  const numericString = String(value).replace(/[^0-9]/g, '');
  if (!numericString) return '';
  return Number(numericString).toLocaleString('ko-KR');
};

/** 콤마가 포함된 문자열에서 콤마를 제거하고 숫자로 변환합니다 (예: "1,000" -> 1000) */
export const parseNumber = (value: string): number => {
  if (!value) return 0;
  const cleanString = String(value).replace(/,/g, '');
  const parsed = Number(cleanString);
  return isNaN(parsed) ? 0 : parsed;
};