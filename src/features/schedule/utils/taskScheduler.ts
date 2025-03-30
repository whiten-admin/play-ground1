import { Task, Todo } from '@/features/tasks/types/task';
import { format, startOfDay, addDays, addHours, setHours, isWeekend } from 'date-fns';
import { BUSINESS_HOURS } from '@/utils/constants/constants';
import { saveSeedDataToLocalStorage } from '@/services/storage/utils/seedDataUtils';
import { parseDate, calculateCalendarDateTime } from '@/utils/dateUtils';

const MAX_DAILY_HOURS = 8; // 1日の最大工数

/**
 * 開始日でTODOをソートする
 */
const sortTodosByStartDate = (todos: Todo[]): Todo[] => {
  return [...todos].sort((a, b) => {
    return a.startDate.getTime() - b.startDate.getTime();
  });
};

/**
 * タスクの期日でTODOをソートする
 */
const sortTodosByTaskDueDate = (todos: { todo: Todo; taskIndex: number }[], tasks: Task[]): { todo: Todo; taskIndex: number }[] => {
  return [...todos].sort((a, b) => {
    const aTask = tasks[a.taskIndex];
    const bTask = tasks[b.taskIndex];
    return aTask.dueDate.getTime() - bTask.dueDate.getTime();
  });
};

/**
 * 日付に基づいて適切な開始時間を取得する
 * @param date 日付
 * @param hour 希望する時間
 * @returns 適切な開始時間（休憩時間を避ける）
 */
const getAppropriateHour = (date: Date, hour: number): number => {
  // 営業時間外の場合は営業開始時間に設定
  if (hour < BUSINESS_HOURS.START_HOUR || hour > BUSINESS_HOURS.END_HOUR) {
    return BUSINESS_HOURS.START_HOUR;
  }
  
  // 休憩時間内の場合は休憩後に設定
  if (hour >= BUSINESS_HOURS.BREAK_START && hour < BUSINESS_HOURS.BREAK_END) {
    return BUSINESS_HOURS.BREAK_END;
  }
  
  return hour;
};

/**
 * 期日に基づいてTODOをスケジュールし、カレンダー表示用日時を設定する
 * @param tasks タスクのリスト
 * @returns 更新されたタスクのリスト
 */
export const scheduleTodosByDueDate = (tasks: Task[]): Task[] => {
  // 日付ごとの割り当て済み工数を管理するマップ
  const dailyHours = new Map<string, number>();
  
  // 更新対象のタスクをディープコピー
  const updatedTasks = JSON.parse(JSON.stringify(tasks)) as Task[];
  
  // JSONによる変換でDateオブジェクトが文字列になるので、再度Dateオブジェクトに変換
  updatedTasks.forEach(task => {
    // タスクの日付を変換
    task.dueDate = new Date(task.dueDate);
    if (task.completedDateTime) {
      task.completedDateTime = new Date(task.completedDateTime);
    }
    
    // TODOの日付を変換
    task.todos.forEach(todo => {
      todo.startDate = new Date(todo.startDate);
      
      if (todo.calendarStartDateTime) {
        todo.calendarStartDateTime = new Date(todo.calendarStartDateTime);
      }
      
      if (todo.calendarEndDateTime) {
        todo.calendarEndDateTime = new Date(todo.calendarEndDateTime);
      }
      
      if (todo.completedDateTime) {
        todo.completedDateTime = new Date(todo.completedDateTime);
      }
    });
  });
  
  // 全タスクのTODOを日付でソートしたリストを作成
  const allTodos: { todo: Todo; taskIndex: number }[] = [];
  
  updatedTasks.forEach((task, taskIndex) => {
    const sortedTodos = sortTodosByStartDate(task.todos);
    sortedTodos.forEach(todo => {
      // 完了済みのTODOはスケジューリング対象外
      if (!todo.completed) {
        allTodos.push({ todo, taskIndex });
      }
    });
  });
  
  // タスクの期日順、同じ期日内では優先度順にソート
  const sortedTodos = sortTodosByTaskDueDate(allTodos, updatedTasks);
  sortedTodos.sort((a, b) => {
    const aTask = updatedTasks[a.taskIndex];
    const bTask = updatedTasks[b.taskIndex];
    
    // 期日が異なる場合は期日順
    if (aTask.dueDate.getTime() !== bTask.dueDate.getTime()) {
      return aTask.dueDate.getTime() - bTask.dueDate.getTime();
    }
    return 1;
  });
  
  // 日付文字列の形式を統一
  const getDateKey = (date: Date) => format(date, 'yyyy-MM-dd');
  
  // 各TODOをスケジュール
  sortedTodos.forEach(({ todo, taskIndex }) => {
    // 開始日を決定（すでにstartDateが設定されている）
    let currentDate = startOfDay(todo.startDate);
    
    // 過去日の場合は今日からスケジュール
    if (currentDate < startOfDay(new Date())) {
      currentDate = startOfDay(new Date());
      todo.startDate = new Date(currentDate);
    }
    
    let remainingHours = todo.estimatedHours;
    
    // 残りの工数がなくなるまでスケジュール
    while (remainingHours > 0) {
      const dateKey = getDateKey(currentDate);
      
      // 日付ごとの割り当て済み工数を取得
      const currentDailyHours = dailyHours.get(dateKey) || 0;
      
      // 今日の残り工数を計算
      const availableHours = MAX_DAILY_HOURS - currentDailyHours;
      
      if (availableHours > 0) {
        // 割り当て可能な工数
        const allocatedHours = Math.min(availableHours, remainingHours);
        
        // 開始時間を計算
        let startHour = BUSINESS_HOURS.START_HOUR + currentDailyHours;
        
        // 休憩時間をまたぐ場合は調整
        if (startHour < BUSINESS_HOURS.BREAK_START && 
            startHour + allocatedHours > BUSINESS_HOURS.BREAK_START) {
          // 休憩前に可能な工数
          const beforeBreakHours = BUSINESS_HOURS.BREAK_START - startHour;
          
          if (beforeBreakHours > 0) {
            // 休憩前に割り当て
            const originalTodo = updatedTasks[taskIndex].todos.find(t => t.id === todo.id);
            if (originalTodo) {
              // カレンダー表示用の日時を設定
              const calStartDateTime = new Date(currentDate);
              calStartDateTime.setHours(startHour, 0, 0, 0);
              
              const calEndDateTime = new Date(calStartDateTime);
              calEndDateTime.setHours(calStartDateTime.getHours() + beforeBreakHours, 0, 0, 0);
              
              originalTodo.calendarStartDateTime = calStartDateTime;
              originalTodo.calendarEndDateTime = calEndDateTime;
              originalTodo.estimatedHours = beforeBreakHours;
              
              // 休憩後に残りを割り当て（新しいTODOとして）
              const afterBreakHours = allocatedHours - beforeBreakHours;
              if (afterBreakHours > 0) {
                // 新しいTODOを作成
                const afterBreakStartDateTime = new Date(currentDate);
                afterBreakStartDateTime.setHours(BUSINESS_HOURS.BREAK_END, 0, 0, 0);
                
                const afterBreakEndDateTime = new Date(afterBreakStartDateTime);
                afterBreakEndDateTime.setHours(afterBreakStartDateTime.getHours() + afterBreakHours, 0, 0, 0);
                
                const newTodo: Todo = {
                  ...JSON.parse(JSON.stringify(originalTodo)), // ディープコピー
                  id: `${originalTodo.id}-after-break`,
                  calendarStartDateTime: afterBreakStartDateTime,
                  calendarEndDateTime: afterBreakEndDateTime,
                  estimatedHours: afterBreakHours,
                  startDate: new Date(currentDate),
                };
                updatedTasks[taskIndex].todos.push(newTodo);
              }
            }
          }
        } else {
          // 休憩時間を考慮して開始時間を調整
          if (startHour >= BUSINESS_HOURS.BREAK_START && startHour < BUSINESS_HOURS.BREAK_END) {
            startHour = BUSINESS_HOURS.BREAK_END;
          }
          
          // TODOのカレンダー表示用日時を設定
          const originalTodo = updatedTasks[taskIndex].todos.find(t => t.id === todo.id);
          if (originalTodo) {
            // カレンダー表示用の日時を設定
            const calStartDateTime = new Date(currentDate);
            calStartDateTime.setHours(startHour, 0, 0, 0);
            
            const calEndDateTime = new Date(calStartDateTime);
            calEndDateTime.setHours(calStartDateTime.getHours() + allocatedHours, 0, 0, 0);
            
            originalTodo.calendarStartDateTime = calStartDateTime;
            originalTodo.calendarEndDateTime = calEndDateTime;
          } else {
            console.warn(`TODOが見つかりません: ID=${todo.id}`);
          }
        }
        
        // 日付の割り当て済み工数を更新
        dailyHours.set(dateKey, currentDailyHours + allocatedHours);
        
        // 残り工数を減らす
        remainingHours -= allocatedHours;
      }
      
      // 日付を1日進める
      currentDate = addDays(currentDate, 1);
      
      // 週末は飛ばす（オプション）
      while (isWeekend(currentDate)) {
        currentDate = addDays(currentDate, 1);
      }
    }
  });
  
  // 更新されたタスクを返す
  return updatedTasks;
};

/**
 * 期日に基づいてTODOをスケジュールし、ローカルストレージに保存する
 * @param tasks タスクのリスト
 * @returns 更新されたタスクのリスト
 */
export const scheduleAndSaveTasks = (tasks: Task[]): Task[] => {
  try {
    console.log('スケジュールを開始します...');
    const updatedTasks = scheduleTodosByDueDate(tasks);
    console.log('スケジュールが完了しました。ローカルストレージに保存します...');
    saveSeedDataToLocalStorage(updatedTasks);
    return updatedTasks;
  } catch (error) {
    console.error('スケジューリング中にエラーが発生しました:', error);
    throw error; // 上位のハンドラーに再スローして処理を継続
  }
};
