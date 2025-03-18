// アプリケーション全体で使用する定数

// 営業時間の設定
export const BUSINESS_HOURS = {
  START_HOUR: 9,   // 営業開始時間（9:00）
  END_HOUR: 18,    // 営業終了時間（18:00）
  MAX_HOURS: 8,    // 1日の最大作業時間
  BREAK_START: 12, // 休憩開始時間（12:00）
  BREAK_END: 13,   // 休憩終了時間（13:00）
};

// 時間帯の配列を生成する関数
export const generateTimeSlots = () => {
  return Array.from(
    { length: BUSINESS_HOURS.END_HOUR - BUSINESS_HOURS.START_HOUR + 1 }, 
    (_, i) => i + BUSINESS_HOURS.START_HOUR
  );
}; 