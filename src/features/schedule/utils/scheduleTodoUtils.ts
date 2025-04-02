import { Task, Todo } from '@/features/tasks/types/task';
import { format, startOfDay, addDays } from 'date-fns';
import { BUSINESS_HOURS } from '@/utils/constants/constants';
import { TodoWithMeta } from '../types/schedule';

/**
 * TODOをカレンダーに配置するためのユーティリティ関数
 * @param tasks タスクのリスト
 * @param selectedUserIds 選択されたユーザーID
 * @param showUnassigned 未割り当てTODOを表示するかどうか
 * @returns 日付ごとにグループ化されたTODOリスト
 */
export const scheduleTodos = (
  tasks: Task[],
  selectedUserIds: string[],
  showUnassigned: boolean
): Map<string, TodoWithMeta[]> => {
  console.log('scheduleTodoUtils - scheduleTodos 開始', { 
    tasksCount: tasks.length, 
    selectedUserIds, 
    showUnassigned 
  });
  
  // TODOを日付ごとにグループ化するためのMap
  const todosByDate = new Map<string, TodoWithMeta[]>();
  
  // 全タスクからのTODOを抽出し初期グループ化
  const groupedTodos = groupTodosByDate(tasks, selectedUserIds, showUnassigned);
  
  // グループ化されたTODOをソート
  sortTodosByTimeAndPriority(groupedTodos);
  
  // 今日の日付にNEXTTODOマークを設定
  markNextTodoForToday(groupedTodos);
  
  // 日付ごとのTODOをスケジュール配置
  const processedDates = new Set<string>(); // 処理済みの日付を管理
  const scheduleQueue: { dateKey: string, overflow: TodoWithMeta[] }[] = []; // 翌日以降にスケジュールするTODOのキュー
  
  // 日付順にすべての日付を処理
  Array.from(groupedTodos.keys())
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .forEach(dateKey => {
      scheduleDateTodos(dateKey, groupedTodos, scheduleQueue);
      processedDates.add(dateKey);
    });
  
  // キューに入ったオーバーフローを処理
  while (scheduleQueue.length > 0) {
    const queueItem = scheduleQueue.shift()!;
    const { dateKey, overflow } = queueItem;
    
    // 翌日の日付を計算
    const currentDate = new Date(dateKey);
    currentDate.setDate(currentDate.getDate() + 1);
    const nextDateKey = format(currentDate, 'yyyy-MM-dd');
    
    // 翌日のTODOリストを取得または作成
    if (!groupedTodos.has(nextDateKey)) {
      groupedTodos.set(nextDateKey, []);
    }
    
    // 超過分のTODOを翌日のリストに追加
    const nextDayTodos = groupedTodos.get(nextDateKey) || [];
    nextDayTodos.push(...overflow);
    
    // 翌日がまだ処理されていない場合、スケジューリング
    if (!processedDates.has(nextDateKey)) {
      scheduleDateTodos(nextDateKey, groupedTodos, scheduleQueue);
      processedDates.add(nextDateKey);
    } else {
      // 既に処理済みの日付の場合は再スケジューリング
      scheduleDateTodos(nextDateKey, groupedTodos, scheduleQueue);
    }
  }
  
  console.log('scheduleTodoUtils - scheduleTodos 完了', { 
    dateCount: groupedTodos.size,
    todoCount: Array.from(groupedTodos.values()).reduce((sum, todos) => sum + todos.length, 0),
    sampleDateKeys: Array.from(groupedTodos.keys()).slice(0, 3)
  });
  
  return groupedTodos;
};

/**
 * タスクからTODOを抽出して日付ごとにグループ化する
 */
const groupTodosByDate = (
  tasks: Task[], 
  selectedUserIds: string[], 
  showUnassigned: boolean
): Map<string, TodoWithMeta[]> => {
  const todosByDate = new Map<string, TodoWithMeta[]>();
  
  tasks.forEach(task => {
    task.todos.forEach(todo => {
      // フィルタリング条件：担当者が選択されているか、未割り当てが表示対象か
      const todoAssigneeId = todo.assigneeId || '';
      const isAssignedToSelectedUser = todoAssigneeId && selectedUserIds.includes(todoAssigneeId);
      const isUnassigned = !todoAssigneeId;
      
      // フィルタリング条件に合わない場合はスキップ
      if (!(isAssignedToSelectedUser || (showUnassigned && isUnassigned))) {
        return;
      }
      
      // 日付キーを取得
      const dateKey = format(todo.startDate, 'yyyy-MM-dd');
      
      // 該当日付のTODOリストがなければ初期化
      if (!todosByDate.has(dateKey)) {
        todosByDate.set(dateKey, []);
      }
      
      // 見積時間は最大8時間に制限
      const displayEstimatedHours = Math.min(todo.estimatedHours, BUSINESS_HOURS.MAX_HOURS);
      
      // カレンダー表示用の開始時間を設定
      const startTime = todo.calendarStartDateTime 
        ? todo.calendarStartDateTime.getHours() 
        : BUSINESS_HOURS.START_HOUR;
      
      // TodoWithMetaオブジェクトを作成
      todosByDate.get(dateKey)?.push({
        todo: {
          ...todo,
          startTime,
          estimatedHours: displayEstimatedHours,
          originalEstimatedHours: todo.estimatedHours,
          dueDate: task.dueDate,
        },
        taskId: task.id,
        taskTitle: task.title,
        priority: 0,
        isNextTodo: false
      });
    });
  });
  
  return todosByDate;
};

/**
 * 各日付のTODOを時間順と優先度でソート
 */
const sortTodosByTimeAndPriority = (todosByDate: Map<string, TodoWithMeta[]>): void => {
  todosByDate.forEach(todos => {
    todos.sort((a, b) => {
      // まず開始時間でソート
      const aStartTime = a.todo.startTime || BUSINESS_HOURS.START_HOUR;
      const bStartTime = b.todo.startTime || BUSINESS_HOURS.START_HOUR;
      
      if (aStartTime !== bStartTime) {
        return aStartTime - bStartTime;
      }
      
      // 次に優先度でソート（優先度が高いものを先に）
      if (a.priority !== b.priority) {
        return (b.priority || 0) - (a.priority || 0);
      }
      
      // 最後に期日でソート
      const aDueDate = a.todo.dueDate || new Date();
      const bDueDate = b.todo.dueDate || new Date();
      return aDueDate.getTime() - bDueDate.getTime();
    });
  });
};

/**
 * 今日の日付の未完了TODOで最優先のものをNEXTTODOとしてマーク
 */
const markNextTodoForToday = (todosByDate: Map<string, TodoWithMeta[]>): void => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTodos = todosByDate.get(todayStr);
  
  if (todayTodos) {
    const incompleteTodo = todayTodos.find(item => !item.todo.completed);
    if (incompleteTodo) {
      incompleteTodo.isNextTodo = true;
    }
  }
};

/**
 * 指定した日付のTODOを時間的に配置する（休憩時間とオーバーフローを考慮）
 */
const scheduleDateTodos = (
  dateKey: string, 
  todosByDate: Map<string, TodoWithMeta[]>,
  scheduleQueue: { dateKey: string, overflow: TodoWithMeta[] }[]
): void => {
  const todos = todosByDate.get(dateKey) || [];
  if (todos.length === 0) return;
  
  let startTime = BUSINESS_HOURS.START_HOUR;
  let totalWorkHours = 0;
  const overflowTodos: TodoWithMeta[] = [];
  const processedTodoIds = new Set<string>(); // 処理済みTODO IDを管理
  
  // すべてのTODOをスケジュール
  for (let i = 0; i < todos.length; i++) {
    const todoWithMeta = todos[i];
    const { todo } = todoWithMeta;
    
    // 既に処理されたTODOはスキップ
    if (processedTodoIds.has(todo.id)) continue;
    
    // 休憩時間を考慮して開始時間を設定
    if (startTime === BUSINESS_HOURS.BREAK_START) {
      startTime = BUSINESS_HOURS.BREAK_END; // 休憩時間は飛ばす
    }
    
    // 1日の最大作業時間をチェック
    if (totalWorkHours + todo.estimatedHours > BUSINESS_HOURS.MAX_HOURS) {
      // 1日あたりの最大作業時間を超える場合
      const remainingHours = BUSINESS_HOURS.MAX_HOURS - totalWorkHours;
      
      if (remainingHours > 0) {
        // 残りの時間でできる分だけ設定
        todo.startTime = startTime;
        
        // 調整された見積時間
        const actualEstimatedHours = Math.min(remainingHours, todo.estimatedHours);
        
        // 翌日にスケジュールする時間
        const overflowHours = todo.estimatedHours - actualEstimatedHours;
        
        // 今日の分の見積時間を調整
        todo.estimatedHours = actualEstimatedHours;
        
        // 開始時間を更新
        startTime += actualEstimatedHours;
        totalWorkHours += actualEstimatedHours;
        
        // 翌日分のTODOを作成（残りの時間分）
        if (overflowHours > 0) {
          // 同じTODOを複製して超過分として記録
          const overflowTodo: TodoWithMeta = {
            todo: {
              ...todo,
              id: `${todo.id}-overflow`, // 一意だが安定したIDを生成
              estimatedHours: overflowHours,
              originalEstimatedHours: todo.originalEstimatedHours
            },
            taskId: todoWithMeta.taskId,
            taskTitle: todoWithMeta.taskTitle,
            priority: todoWithMeta.priority,
            isNextTodo: false
          };
          
          overflowTodos.push(overflowTodo);
        }
      } else {
        // 今日はもう時間が残っていない場合、全て翌日にスケジュール
        overflowTodos.push(todoWithMeta);
      }
      
      // 処理済みとしてマーク
      processedTodoIds.add(todo.id);
    } else {
      // 最大作業時間内に収まる場合
      todo.startTime = startTime;
      
      // 次のTODOの開始時間を計算（休憩時間を考慮）
      let nextStartTime = startTime + todo.estimatedHours;
      
      // 次の開始時間が休憩時間にかかる場合
      if (startTime < BUSINESS_HOURS.BREAK_START && nextStartTime > BUSINESS_HOURS.BREAK_START) {
        // 休憩時間をまたぐTODOを分割
        const beforeBreakHours = BUSINESS_HOURS.BREAK_START - startTime;
        const afterBreakHours = todo.estimatedHours - beforeBreakHours;
        
        // 元のTODOを休憩前の部分に調整
        todo.estimatedHours = beforeBreakHours;
        
        // 休憩後の部分を別のTODOとして作成し、日付のTODOリストに追加
        if (afterBreakHours > 0) {
          const afterBreakTodo: TodoWithMeta = {
            todo: {
              ...todo,
              id: `${todo.id}-after-break`, // 一意だが安定したIDを生成
              startTime: BUSINESS_HOURS.BREAK_END,
              estimatedHours: afterBreakHours,
              originalEstimatedHours: todo.originalEstimatedHours
            },
            taskId: todoWithMeta.taskId,
            taskTitle: todoWithMeta.taskTitle,
            priority: todoWithMeta.priority,
            isNextTodo: false
          };
          
          // 日付のTODOリストに追加（後で処理するために）
          todos.push(afterBreakTodo);
        }
        
        nextStartTime = BUSINESS_HOURS.BREAK_END;
      } else if (nextStartTime > BUSINESS_HOURS.BREAK_START && nextStartTime <= BUSINESS_HOURS.BREAK_END) {
        // 休憩時間内で終わる場合は休憩時間後に設定
        nextStartTime = BUSINESS_HOURS.BREAK_END;
      }
      
      // 開始時間を更新
      startTime = nextStartTime;
      totalWorkHours += todo.estimatedHours;
      
      // 処理済みとしてマーク
      processedTodoIds.add(todo.id);
    }
  }
  
  // 超過分のTODOがある場合、スケジュールキューに追加
  if (overflowTodos.length > 0) {
    scheduleQueue.push({ dateKey, overflow: overflowTodos });
  }
};

/**
 * TODOの時間調整を行う補助関数
 * @param todos TODOリスト
 * @param isToday 今日の日付かどうか
 */
export const adjustTodoTiming = (todos: TodoWithMeta[], isToday: boolean): void => {
  todos.forEach(todoWithMeta => {
    const { todo } = todoWithMeta;
    
    // 既に設定された開始時間を取得または初期値を設定
    let startTime = todo.startTime || BUSINESS_HOURS.START_HOUR;
    
    // 休憩時間を避ける
    if (startTime >= BUSINESS_HOURS.BREAK_START && startTime < BUSINESS_HOURS.BREAK_END) {
      startTime = BUSINESS_HOURS.BREAK_END;
    }
    
    // 営業時間内に収まるように調整
    if (startTime + todo.estimatedHours > BUSINESS_HOURS.END_HOUR) {
      todo.estimatedHours = Math.max(1, BUSINESS_HOURS.END_HOUR - startTime);
    }
    
    // 調整後の開始時間を設定
    todo.startTime = startTime;
  });
}; 