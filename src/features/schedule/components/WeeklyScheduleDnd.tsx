'use client'

import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Task } from '@/features/tasks/types/task'
import { BUSINESS_HOURS } from '@/utils/constants/constants'
import { useFilterContext } from '@/features/tasks/filters/FilterContext'

interface WeeklyScheduleDndProps {
  weekDays: Date[]
  timeSlots: number[]
  tasks: Task[]
  onTaskSelect: (taskId: string, todoId?: string) => void
  onTodoUpdate?: (todoId: string, taskId: string, newDate: Date, isPlannedDate?: boolean) => void
  selectedTodoId?: string | null
  onCalendarClick: (e: React.MouseEvent<HTMLDivElement>, day: Date, hour: number) => void
  isCreatingTodo: boolean
  newTodoDate: Date | null
  newTodoTaskId: string | null
  newTodoText: string
  newTodoEstimatedHours: number
  onNewTodoTaskIdChange: (taskId: string) => void
  onNewTodoTextChange: (text: string) => void
  onNewTodoEstimatedHoursChange: (hours: number) => void
  onCancelCreateTodo: () => void
  onCreateTodo: (taskId: string) => void
}

interface TodoWithMeta {
  todo: {
    id: string
    text: string
    completed: boolean
    startDate: Date
    calendarStartDateTime?: Date
    calendarEndDateTime?: Date
    dueDate: Date
    estimatedHours: number
    originalEstimatedHours?: number
    startTime?: number
    actualHours?: number
  }
  taskId: string
  taskTitle: string
  priority?: number
  isNextTodo?: boolean
}

export default function WeeklyScheduleDnd({
  weekDays,
  timeSlots,
  tasks,
  onTaskSelect,
  onTodoUpdate,
  selectedTodoId,
  onCalendarClick,
  isCreatingTodo,
  newTodoDate,
  newTodoTaskId,
  newTodoText,
  newTodoEstimatedHours,
  onNewTodoTaskIdChange,
  onNewTodoTextChange,
  onNewTodoEstimatedHoursChange,
  onCancelCreateTodo,
  onCreateTodo
}: WeeklyScheduleDndProps) {
  const [mounted, setMounted] = useState(false)
  const [todos, setTodos] = useState<Map<string, TodoWithMeta[]>>(new Map())
  
  // フィルタリングコンテキストを使用
  const { selectedUserIds, showUnassigned } = useFilterContext()

  // tasksが変更されたときにtodosを再計算
  useEffect(() => {
    const initialTodos = scheduleTodos()
    setTodos(initialTodos)
  }, [tasks, selectedUserIds, showUnassigned]) // フィルター条件が変更されたときも再計算

  // selectedTodoIdが変更されたときにコンソールログに出力
  useEffect(() => {
    if (selectedTodoId) {
      console.log('WeeklyScheduleDnd - 選択されたTODO:', selectedTodoId)
    }
  }, [selectedTodoId])

  // マウント状態の管理
  useEffect(() => {
    setMounted(true)
  }, [])

  // TODOをカレンダーに配置するための処理
  const scheduleTodos = () => {
    // 全タスクのTODOを日付でグループ化
    const todosByDate = new Map<string, TodoWithMeta[]>()
    const today = format(new Date(), 'yyyy-MM-dd')
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    
    // フィルタリングされたタスクを使用
    const filteredTasks = tasks.filter(task => {
      // 各タスクのTODOから担当者リストを作成
      const taskAssignees = new Set<string>();
      task.todos.forEach(todo => {
        if (todo.assigneeId) {
          taskAssignees.add(todo.assigneeId);
        }
      });
      
      // アサインされていないタスクを表示するかどうか
      if (showUnassigned && taskAssignees.size === 0) {
        return true;
      }
      
      // 選択されたユーザーのタスクを表示
      if (Array.from(taskAssignees).some(id => selectedUserIds.includes(id))) {
        return true;
      }
      
      return false;
    })

    // まず、WeeklySchedule.tsxと同様のロジックですべてのTODOを適切な日付に配置
    filteredTasks.forEach(task => {
      task.todos.forEach(todo => {
        // TODO自体の担当者でもフィルタリング
        const todoAssigneeId = todo.assigneeId || ''
        const isAssignedToSelectedUser = todoAssigneeId && selectedUserIds.includes(todoAssigneeId)
        const isUnassigned = !todoAssigneeId
        
        // フィルタリング条件に合わない場合はスキップ
        if (!(isAssignedToSelectedUser || (showUnassigned && isUnassigned))) {
          return
        }
        
        // 該当する日付を決定
        let dateKey: string
        let scheduleDate: Date
        
        // startDateを使用
        dateKey = format(new Date(todo.startDate), 'yyyy-MM-dd')
        scheduleDate = new Date(todo.startDate)
        
        if (!todosByDate.has(dateKey)) {
          todosByDate.set(dateKey, [])
        }
        
        // デフォルトの開始時間は営業開始時間
        const defaultStartTime = BUSINESS_HOURS.START_HOUR;
        
        // 表示用の見積もり時間を調整（最大時間に制限）
        const displayEstimatedHours = Math.min(todo.estimatedHours, BUSINESS_HOURS.MAX_HOURS);
        
        // 開始時間の決定
        let startTime = defaultStartTime;
        
        // calendarStartDateTimeが設定されている場合はその時間を使用
        if (todo.calendarStartDateTime) {
          const calendarHour = todo.calendarStartDateTime.getHours();
          // 営業時間内の場合のみその時間を使用（休憩時間は除く）
          if (calendarHour >= BUSINESS_HOURS.START_HOUR && calendarHour <= BUSINESS_HOURS.END_HOUR - 1 && 
              !(calendarHour >= BUSINESS_HOURS.BREAK_START && calendarHour < BUSINESS_HOURS.BREAK_END)) {
            startTime = calendarHour;
          } else if (calendarHour >= BUSINESS_HOURS.BREAK_START && calendarHour < BUSINESS_HOURS.BREAK_END) {
            // 休憩時間内の場合は休憩後に設定
            startTime = BUSINESS_HOURS.BREAK_END;
          }
        }
          
        todosByDate.get(dateKey)?.push({
          todo: {
            ...todo,
            dueDate: scheduleDate,
            startTime: startTime,
            estimatedHours: displayEstimatedHours,
            originalEstimatedHours: todo.estimatedHours
          },
          taskId: task.id,
          taskTitle: task.title,
          priority: 0, // 優先度はデフォルト値を使用
          isNextTodo: false
        })
      })
    })

    // 各日付のTODOを時間と優先度で並べ替え
    todosByDate.forEach((todos, dateKey) => {
      // 今日の日付かどうかチェック
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const isTodayDate = dateKey === todayStr;
      
      // TODOをソート（優先度のみ、完了状態は考慮しない）
      todos.sort((a, b) => {
        // 1. 優先度でソート（高い順）
        if (a.priority !== b.priority) {
          return (b.priority || 0) - (a.priority || 0);
        }
        
        // 2. 期日でソート
        const today = new Date();
        today.setHours(0, 0, 0, 0);  // startOfDay相当の処理
        
        const aDueDate = a.todo.dueDate;
        const bDueDate = b.todo.dueDate;
        const aIsOverdue = aDueDate.getTime() < today.getTime();
        const bIsOverdue = bDueDate.getTime() < today.getTime();
        const aIsToday = aDueDate.getTime() === today.getTime();
        const bIsToday = bDueDate.getTime() === today.getTime();

        if (aIsOverdue !== bIsOverdue) return aIsOverdue ? -1 : 1;
        if (aIsToday !== bIsToday) return aIsToday ? -1 : 1;
        return aDueDate.getTime() - bDueDate.getTime();
      });
      
      // 今日の未完了TODOの中で最優先のものをNEXTTODOとしてマーク
      if (isTodayDate) {
        const incompleteTodos = todos.filter(item => !item.todo.completed);
        if (incompleteTodos.length > 0) {
          incompleteTodos[0].isNextTodo = true;
        }
      }
    });

    // 日付ごとのTODOをスケジュール配置する
    const processedDates = new Set<string>(); // 処理済みの日付を管理
    const scheduleQueue: { dateKey: string, overflow: TodoWithMeta[] }[] = []; // 翌日以降にスケジュールするTODOのキュー

    // 初回は日付順にすべての日付を処理
    Array.from(todosByDate.keys())
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime()) // 日付順にソート
      .forEach(dateKey => {
        scheduleDateTodos(dateKey);
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
      if (!todosByDate.has(nextDateKey)) {
        todosByDate.set(nextDateKey, []);
      }

      // 超過分のTODOを翌日のリストに追加
      const nextDayTodos = todosByDate.get(nextDateKey) || [];
      nextDayTodos.push(...overflow);
      
      // 翌日がまだ処理されていない場合、スケジューリング
      if (!processedDates.has(nextDateKey)) {
        scheduleDateTodos(nextDateKey);
        processedDates.add(nextDateKey);
      } else {
        // 既に処理済みの日付の場合は再スケジューリング
        rescheduleDateTodos(nextDateKey);
      }
    }

    // 指定した日付のTODOをスケジュールする関数
    function scheduleDateTodos(dateKey: string) {
      const todos = todosByDate.get(dateKey) || [];
      if (todos.length === 0) return;

      // 今日の日付かどうかチェック
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const isTodayDate = dateKey === todayStr;
      
      let currentHour = BUSINESS_HOURS.START_HOUR;
      let totalWorkHours = 0;
      const overflowTodos: TodoWithMeta[] = [];

      todos.forEach((todoWithMeta) => {
        const { todo } = todoWithMeta;
        
        // 休憩時間を考慮して開始時間を設定
        if (currentHour === BUSINESS_HOURS.BREAK_START) {
          currentHour = BUSINESS_HOURS.BREAK_END; // 休憩時間は飛ばす
        }
        
        // 1日の最大作業時間をチェック
        if (totalWorkHours + todo.estimatedHours > BUSINESS_HOURS.MAX_HOURS) {
          // 1日あたりの最大作業時間を超える場合
          const remainingHours = BUSINESS_HOURS.MAX_HOURS - totalWorkHours;
          
          if (remainingHours > 0) {
            // 残りの時間でできる分だけ設定
            todo.startTime = currentHour;
            
            // 調整された見積時間
            const actualEstimatedHours = Math.min(
              remainingHours, 
              todo.estimatedHours
            );
            
            // 翌日にスケジュールする時間
            const overflowHours = todo.estimatedHours - actualEstimatedHours;
            
            // 今日の分の見積時間を調整
            todo.estimatedHours = actualEstimatedHours;
            
            // 開始時間を更新
            currentHour += actualEstimatedHours;
            totalWorkHours += actualEstimatedHours;
            
            // 翌日分のTODOを作成（残りの時間分）
            if (overflowHours > 0) {
              // 同じTODOを複製して超過分として記録
              const overflowTodo: TodoWithMeta = {
                todo: {
                  ...todo,
                  id: `${todo.id}-overflow-${Date.now()}`, // 一意のIDを生成
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
        } else {
          // 最大作業時間内に収まる場合
          // 開始時間を割り当て
          todo.startTime = currentHour;
          
          // 次のTODOの開始時間を計算（休憩時間を考慮）
          let nextHour = currentHour + todo.estimatedHours;
          
          // 作業時間が休憩時間をまたぐ場合
          if (currentHour < BUSINESS_HOURS.BREAK_START && nextHour > BUSINESS_HOURS.BREAK_START) {
            // 休憩開始時間までの作業時間に制限する
            todo.estimatedHours = BUSINESS_HOURS.BREAK_START - currentHour;
            nextHour = BUSINESS_HOURS.BREAK_START;
          }
          
          // 次の開始時間が休憩時間内にある場合は休憩後に設定
          if (nextHour >= BUSINESS_HOURS.BREAK_START && nextHour < BUSINESS_HOURS.BREAK_END) {
            nextHour = BUSINESS_HOURS.BREAK_END;
          }
          
          // 終了時間が営業終了時間を超えないように調整
          nextHour = Math.min(BUSINESS_HOURS.END_HOUR, nextHour);
          currentHour = nextHour;
          totalWorkHours += todo.estimatedHours;
        }
      });

      // 超過分のTODOがある場合、スケジュールキューに追加
      if (overflowTodos.length > 0) {
        scheduleQueue.push({ dateKey, overflow: overflowTodos });
      }
    }

    // 既に処理済みの日付のTODOを再スケジュールする関数
    function rescheduleDateTodos(dateKey: string) {
      const todos = todosByDate.get(dateKey) || [];
      if (todos.length === 0) return;
      
      // 最新の状態でソート（優先度のみ、完了状態は考慮しない）
      todos.sort((a, b) => {
        // 1. 優先度でソート（高い順）
        if (a.priority !== b.priority) {
          return (b.priority || 0) - (a.priority || 0);
        }
        
        // 2. 期日でソート
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const aDueDate = a.todo.dueDate;
        const bDueDate = b.todo.dueDate;
        const aIsOverdue = aDueDate.getTime() < today.getTime();
        const bIsOverdue = bDueDate.getTime() < today.getTime();
        const aIsToday = aDueDate.getTime() === today.getTime();
        const bIsToday = bDueDate.getTime() === today.getTime();

        if (aIsOverdue !== bIsOverdue) return aIsOverdue ? -1 : 1;
        if (aIsToday !== bIsToday) return aIsToday ? -1 : 1;
        return aDueDate.getTime() - bDueDate.getTime();
      });
      
      // すべての予定を一旦リセットして再スケジュール
      scheduleDateTodos(dateKey);
    }

    // デバッグのためにスケジュールされたTODOの情報を出力
    console.log('スケジュールされたTODO:', Array.from(todosByDate.entries()).map(([date, todos]) => {
      return {
        date,
        todos: todos.map(t => ({
          id: t.todo.id,
          text: t.todo.text,
          startTime: t.todo.startTime,
          estimatedHours: t.todo.estimatedHours,
          completed: t.todo.completed
        }))
      };
    }));

    return todosByDate
  }

  if (!mounted) {
    return (
      <div className="relative">
        {timeSlots.map((hour) => (
          <div 
            key={hour} 
            className="grid" 
            style={{ gridTemplateColumns: `3rem repeat(${weekDays.length}, 1fr)` }}
          >
            <div className="h-12 text-xs text-right pr-1 pt-1 text-gray-500 w-12">
              {`${hour}:00`}
            </div>
            {weekDays.map((_, dayIndex) => (
              <div
                key={dayIndex}
                className="h-12 border-t border-l relative"
              />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="relative">
      {timeSlots.map((hour) => (
        <div 
          key={hour} 
          className="grid" 
          style={{ gridTemplateColumns: `3rem repeat(${weekDays.length}, 1fr)` }}
        >
          <div className="h-12 text-xs text-right pr-1 pt-1 text-gray-500 w-12">
            {`${hour}:00`}
          </div>
          {weekDays.map((day, dayIndex) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const todosForDay = todos.get(dateKey) || []
            // 時間枠に一致するTODOを表示
            const todosForHour = todosForDay.filter(
              ({ todo }) => Math.floor(todo.startTime || 0) === hour
            )

            return (
              <div
                key={`${format(day, 'yyyy-MM-dd')}-${hour}`}
                className={`h-12 border-t border-l relative ${
                  hour === BUSINESS_HOURS.BREAK_START ? 'bg-gray-200' : ''
                }`}
                onClick={(e) => onCalendarClick(e, day, hour)}
              >
                {hour === BUSINESS_HOURS.BREAK_START && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 font-medium z-10">
                    休憩
                  </div>
                )}
                {todosForHour.map(({ todo, taskId, taskTitle, priority, isNextTodo }) => {
                  // 選択されているかどうかをチェック
                  const isSelected = selectedTodoId === todo.id;
                  
                  // デバッグ用：選択状態を出力
                  if (isSelected) {
                    console.log('選択されたTODOを表示:', todo.id, todo.text);
                  }

                  return (
                    <div
                      key={`${todo.id}-${taskId}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        console.log('TODO選択:', todo.id, taskId);
                        onTaskSelect(taskId, todo.id)
                      }}
                      style={{
                        height: `${todo.estimatedHours * 48}px`,
                        width: 'calc(100% - 2px)',
                        position: 'absolute',
                        top: 0,
                        left: 1,
                        // 選択されている場合は前面に表示
                        zIndex: isSelected ? 10 : 1,
                        // 選択されている場合は境界線を追加
                        border: isSelected ? '2px solid #3b82f6' : undefined,
                        // 選択されている場合は影を強調
                        boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.5)' : undefined,
                        // 選択されている場合は背景色を強調
                        backgroundColor: isSelected ? 
                          (todo.completed ? '#e5e7eb' : 
                           (format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && isNextTodo) ? '#fef3c7' : 
                           priority === 2 ? '#fee2e2' : 
                           priority === 1 ? '#ffedd5' : '#dbeafe') : undefined
                      }}
                      className={`${
                        todo.completed ? 'bg-gray-100' : 
                        (format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && 
                         isNextTodo) ? 'bg-amber-100' :
                        priority === 2 ? 'bg-red-100' : 
                        priority === 1 ? 'bg-orange-100' : 'bg-blue-100'
                      } rounded p-1 cursor-pointer hover:shadow-md transition-shadow overflow-hidden
                        ${isSelected ? 'ring-4 ring-blue-500 shadow-md' : ''}`}
                    >
                      <div className={`text-xs font-medium truncate ${isSelected ? 'text-blue-700 font-bold' : ''}`}>
                        {todo.text}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{taskTitle}</div>
                      <div className="text-xs text-gray-500">{Math.round((todo.originalEstimatedHours || todo.estimatedHours) * 10) / 10}h</div>
                      {priority === 2 && !todo.completed && (
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" title="高優先度" />
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      ))}

      {/* TODO作成モーダル */}
      {isCreatingTodo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">新しいTODOを作成</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日付
                </label>
                <div className="text-sm text-gray-600">
                  {newTodoDate ? format(newTodoDate, 'yyyy年M月d日 (E) HH:mm', { locale: ja }) : ''}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タスク
                </label>
                <select
                  value={newTodoTaskId || ''}
                  onChange={(e) => onNewTodoTaskIdChange(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">タスクを選択</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TODO名
                </label>
                <input
                  type="text"
                  value={newTodoText}
                  onChange={(e) => onNewTodoTextChange(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="TODOの名前を入力"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  見積もり工数（時間）
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={newTodoEstimatedHours}
                  onChange={(e) => onNewTodoEstimatedHoursChange(Number(e.target.value))}
                  className="w-full p-2 border rounded-md"
                  placeholder="見積もり工数を入力"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={onCancelCreateTodo}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                キャンセル
              </button>
              <button
                onClick={() => newTodoTaskId && onCreateTodo(newTodoTaskId)}
                disabled={!newTodoTaskId || !newTodoText.trim()}
                className="px-4 py-2 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 