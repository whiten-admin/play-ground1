// アプリケーション全体で使用する定数

// 営業時間の設定
export const BUSINESS_HOURS = {
  START_HOUR: 9,   // 営業開始時間（9:00）
  END_HOUR: 18,    // 営業終了時間（18:00）
  MAX_HOURS: 8,    // 1日の最大作業時間
  BREAK_START: 12, // 休憩開始時間（12:00）
  BREAK_END: 13,   // 休憩終了時間（13:00）
  
  // 表示用の時間範囲（前後2時間拡張）
  DISPLAY_START_HOUR: 7,  // 表示開始時間（7:00）
  DISPLAY_END_HOUR: 20,   // 表示終了時間（20:00）
};

// 時間帯の配列を生成する関数
export const generateTimeSlots = () => {
  return Array.from(
    { length: BUSINESS_HOURS.DISPLAY_END_HOUR - BUSINESS_HOURS.DISPLAY_START_HOUR + 1 }, 
    (_, i) => i + BUSINESS_HOURS.DISPLAY_START_HOUR
  );
}; 