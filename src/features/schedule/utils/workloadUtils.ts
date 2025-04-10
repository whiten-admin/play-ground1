import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  isSameWeek, 
  isSameMonth,
  addDays,
  isWithinInterval,
  getDay,
  parseISO,
  isValid
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { BUSINESS_HOURS } from '@/utils/constants/constants';
import { TodoWithMeta, WorkloadSummary, WorkloadSummaryByPeriod, TodoCategory } from '../types/schedule';

// 空の工数集計オブジェクトを作成する関数
export const createEmptyWorkloadSummary = (): WorkloadSummary => ({
  externalHours: 0,
  internalHours: 0,
  bufferHours: 0,
  freeHours: 0,
  totalHours: 0
});

// 日付から週のキーを生成する関数（YYYY-WW形式）
export const getWeekKey = (date: Date): string => {
  const firstDayOfWeek = startOfWeek(date, { locale: ja });
  const weekNumber = Math.ceil(((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
  return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
};

// 日付から月のキーを生成する関数（YYYY-MM形式）
export const getMonthKey = (date: Date): string => {
  return format(date, 'yyyy-MM');
};

// 予定の種別を判定する関数
export const determineTodoCategory = (todo: TodoWithMeta): TodoCategory => {
  // 既に種別が設定されていればそれを返す
  if (todo.category) {
    return todo.category;
  }
  
  // 外部予定（Googleカレンダーなど）
  if (todo.isExternal) {
    return 'external';
  }
  
  // バッファの判定（タスク名やテキストで判断）
  const todoText = todo.todo.text.toLowerCase();
  const taskTitle = todo.taskTitle?.toLowerCase() || '';
  if (
    todoText.includes('バッファ') || 
    todoText.includes('buffer') || 
    taskTitle.includes('バッファ') || 
    taskTitle.includes('buffer')
  ) {
    return 'buffer';
  }
  
  // 内部TODO
  return 'internal';
};

// カレンダー上のTODOから工数集計を行う関数
export const calculateWorkloadSummary = (
  todoSchedule: Map<string, TodoWithMeta[]>,
  startDate: Date,
  endDate: Date,
  dailyWorkHours: number = BUSINESS_HOURS.MAX_HOURS
): WorkloadSummaryByPeriod => {
  // 結果格納用のオブジェクト
  const result: WorkloadSummaryByPeriod = {
    daily: new Map<string, WorkloadSummary>(),
    weekly: new Map<string, WorkloadSummary>(),
    monthly: new Map<string, WorkloadSummary>()
  };
  
  // 日付の範囲内の各日に対して処理
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateKey = format(currentDate, 'yyyy-MM-dd');
    const weekKey = getWeekKey(currentDate);
    const monthKey = getMonthKey(currentDate);
    
    // 空の集計オブジェクトを初期化
    if (!result.daily.has(dateKey)) {
      result.daily.set(dateKey, createEmptyWorkloadSummary());
    }
    if (!result.weekly.has(weekKey)) {
      result.weekly.set(weekKey, createEmptyWorkloadSummary());
    }
    if (!result.monthly.has(monthKey)) {
      result.monthly.set(monthKey, createEmptyWorkloadSummary());
    }
    
    // 当日のTODOリスト
    const todosForDay = todoSchedule.get(dateKey) || [];
    
    // 種別ごとに工数を集計
    todosForDay.forEach(todo => {
      const category = determineTodoCategory(todo);
      const hours = todo.todo.estimatedHours || 0;
      
      // 日次集計
      const dailySummary = result.daily.get(dateKey)!;
      if (category === 'external') {
        dailySummary.externalHours += hours;
      } else if (category === 'internal') {
        dailySummary.internalHours += hours;
      } else if (category === 'buffer') {
        dailySummary.bufferHours += hours;
      }
      dailySummary.totalHours += hours;
      
      // 週次集計
      const weeklySummary = result.weekly.get(weekKey)!;
      if (category === 'external') {
        weeklySummary.externalHours += hours;
      } else if (category === 'internal') {
        weeklySummary.internalHours += hours;
      } else if (category === 'buffer') {
        weeklySummary.bufferHours += hours;
      }
      weeklySummary.totalHours += hours;
      
      // 月次集計
      const monthlySummary = result.monthly.get(monthKey)!;
      if (category === 'external') {
        monthlySummary.externalHours += hours;
      } else if (category === 'internal') {
        monthlySummary.internalHours += hours;
      } else if (category === 'buffer') {
        monthlySummary.bufferHours += hours;
      }
      monthlySummary.totalHours += hours;
    });
    
    // 次の日に進む
    currentDate = addDays(currentDate, 1);
  }
  
  // 空き時間（余裕工数）を計算
  // - 平日（月〜金）のみを対象とする
  result.daily.forEach((summary, dateKey) => {
    // 日付文字列をDateオブジェクトに変換
    const date = parseISO(dateKey);
    if (isValid(date)) {
      const dayOfWeek = getDay(date);
      // 平日のみ（0が日曜、6が土曜）
      if (dayOfWeek > 0 && dayOfWeek < 6) {
        summary.freeHours = Math.max(0, dailyWorkHours - summary.totalHours);
      }
    }
  });
  
  // 週の空き時間を計算
  result.weekly.forEach((summary, weekKey) => {
    // 平日の日数（5日）
    const workableDays = 5;
    summary.freeHours = Math.max(0, (dailyWorkHours * workableDays) - summary.totalHours);
  });
  
  // 月の空き時間を計算（概算として平均的な営業日数を使用）
  result.monthly.forEach((summary, monthKey) => {
    if (monthKey) {
      // 年と月を抽出
      const [yearStr, monthStr] = monthKey.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1; // JavaScriptの月は0-11
      
      // 月の開始日と終了日
      const monthStart = new Date(year, month, 1);
      const monthEnd = endOfMonth(monthStart);
      
      // 平日の日数を計算
      let workableDays = 0;
      let currentDate = monthStart;
      while (currentDate <= monthEnd) {
        const dayOfWeek = getDay(currentDate);
        if (dayOfWeek > 0 && dayOfWeek < 6) { // 1-5が平日
          workableDays++;
        }
        currentDate = addDays(currentDate, 1);
      }
      
      summary.freeHours = Math.max(0, (dailyWorkHours * workableDays) - summary.totalHours);
    }
  });
  
  return result;
};

// 工数の表示用にフォーマットする関数
export const formatHours = (hours: number): string => {
  return `${hours.toFixed(1)}h`;
}; 