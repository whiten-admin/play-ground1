/**
 * 日付操作のユーティリティ関数
 */

import { addHours } from 'date-fns';
import { Task, Todo } from '@/features/tasks/types/task';

/**
 * 文字列形式の日付からDateオブジェクトに変換する
 * @param dateString ISO形式の日付文字列 ('YYYY-MM-DD')
 * @returns Dateオブジェクト
 */
export function parseDate(dateString: string): Date {
  if (!dateString) {
    return new Date();
  }
  
  // 日付文字列がISOフォーマットでない場合は修正
  if (!dateString.includes('T')) {
    dateString = `${dateString}T00:00:00`;
  }
  
  return new Date(dateString);
}

/**
 * TODOの着手予定日からカレンダー表示用の開始日時と終了日時を計算する
 * @param startDate 着手予定日
 * @param estimatedHours 予定工数
 * @returns カレンダー表示用日時のオブジェクト
 */
export function calculateCalendarDateTime(startDate: Date, estimatedHours: number): {
  calendarStartDateTime: Date;
  calendarEndDateTime: Date;
} {
  const calendarStartDateTime = new Date(startDate);
  // デフォルトは午前9時から開始
  calendarStartDateTime.setHours(9, 0, 0, 0);
  
  // 終了時刻は開始時刻 + 予定工数
  const calendarEndDateTime = addHours(calendarStartDateTime, estimatedHours);
  
  return {
    calendarStartDateTime,
    calendarEndDateTime
  };
}