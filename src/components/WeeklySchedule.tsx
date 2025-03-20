'use client'

import React, { useState, useEffect } from 'react'
import { format, addDays, startOfWeek, isSameDay, addHours, isBefore, isToday, parse, startOfMonth, endOfMonth, getDaysInMonth, getDay, addMonths, startOfDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Task } from '@/types/task'
import { IoCalendarOutline, IoGrid, IoList, IoChevronBack, IoChevronForward, IoCalendarClearOutline, IoCalendarNumberOutline } from 'react-icons/io5'
import dynamic from 'next/dynamic'
import { BUSINESS_HOURS, generateTimeSlots } from '@/utils/constants'

const DndContext = dynamic(
  () => import('./WeeklyScheduleDnd').then(mod => mod.default),
  { ssr: false }
)

interface WeeklyScheduleProps {
  tasks: Task[]
  onTaskSelect: (taskId: string, todoId?: string) => void
  onTodoUpdate: (todoId: string, taskId: string, newDate: Date, isPlannedDate?: boolean) => void
  selectedTodoId?: string | null
}

interface TodoWithMeta {
  todo: {
    id: string
    text: string
    completed: boolean
    dueDate: Date
    estimatedHours: number
    originalEstimatedHours?: number
    startTime?: number
    plannedStartDate?: Date
  }
  taskId: string
  taskTitle: string
  priority?: number
  isNextTodo: boolean
}

// ビューモードの型定義
type ViewMode = 'day' | 'week' | 'month'

// ビューモードボタンの型定義
interface ViewModeButton {
  id: ViewMode
  icon: JSX.Element
  label: string
}

export default function WeeklySchedule({ tasks, onTaskSelect, onTodoUpdate, selectedTodoId }: WeeklyScheduleProps) {
  const [isClient, setIsClient] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showWeekend, setShowWeekend] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [viewModeButtons, setViewModeButtons] = useState<ViewModeButton[]>([
    { id: 'day', icon: <IoCalendarClearOutline className="w-5 h-5" />, label: '日' },
    { id: 'week', icon: <IoCalendarOutline className="w-5 h-5" />, label: '週' },
    { id: 'month', icon: <IoCalendarNumberOutline className="w-5 h-5" />, label: '月' }
  ])
  
  // 選択状態の変更を検知するuseEffect
  useEffect(() => {
    if (selectedTodoId) {
      console.log('WeeklySchedule - selectedTodoId変更:', selectedTodoId)
    }
  }, [selectedTodoId])

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 週の開始日を取得（月曜始まり）
  const startDate = startOfWeek(currentDate, { locale: ja })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i))
  const displayDays = showWeekend ? weekDays : weekDays.slice(1, 6)

  // 月の日付を計算
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDayOfWeek = getDay(monthStart)
  const daysInMonth = getDaysInMonth(currentDate)
  
  // 月カレンダーに表示する日付の配列を生成
  const generateMonthCalendarDays = () => {
    // 前月の日を追加（日曜始まり）
    const dayOfWeekStart = startDayOfWeek
    const previousMonthDays = Array.from({ length: dayOfWeekStart }, (_, i) => {
      return addDays(monthStart, -(dayOfWeekStart - i))
    })
    
    // 当月の日を追加
    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => {
      return addDays(monthStart, i)
    })
    
    // 翌月の日を追加（カレンダーを6週間分表示するために必要な日数）
    const totalDaysDisplayed = 42 // 6週間 x 7日
    const nextMonthDays = Array.from(
      { length: totalDaysDisplayed - previousMonthDays.length - currentMonthDays.length },
      (_, i) => {
        return addDays(monthEnd, i + 1)
      }
    )
    
    return [...previousMonthDays, ...currentMonthDays, ...nextMonthDays]
  }
  
  const monthCalendarDays = generateMonthCalendarDays()

  // 時間帯の設定
  const timeSlots = generateTimeSlots()

  // 前へ移動
  const movePrevious = () => {
    if (viewMode === 'day') {
      setCurrentDate(prev => addDays(prev, -1))
    } else if (viewMode === 'week') {
      setCurrentDate(prev => addDays(prev, -7))
    } else {
      setCurrentDate(prev => addMonths(prev, -1))
    }
  }

  // 次へ移動
  const moveNext = () => {
    if (viewMode === 'day') {
      setCurrentDate(prev => addDays(prev, 1))
    } else if (viewMode === 'week') {
      setCurrentDate(prev => addDays(prev, 7))
    } else {
      setCurrentDate(prev => addMonths(prev, 1))
    }
  }

  // 今日へ
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // TODOをカレンダーに配置するための処理
  const scheduleTodos = () => {
    // 全タスクのTODOを日付でグループ化
    const todosByDate = new Map<string, TodoWithMeta[]>()
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayDate = startOfDay(new Date());
    
    // すべてのTODOを一度に処理し、適切な日付に配置
    tasks.forEach(task => {
      task.todos.forEach(todo => {
        // 該当する日付を決定
        let dateKey: string;
        
        if (todo.plannedStartDate) {
          // 着手予定日が設定されている場合はそれを使用
          dateKey = format(todo.plannedStartDate, 'yyyy-MM-dd');
        } else if (todo.startDate) {
          // startDateが設定されている場合はそれを使用
          dateKey = format(new Date(todo.startDate), 'yyyy-MM-dd');
        } else {
          // それ以外は期日に配置
          dateKey = format(new Date(todo.dueDate), 'yyyy-MM-dd');
        }
        
        // 該当日付のリストがなければ作成
        if (!todosByDate.has(dateKey)) {
          todosByDate.set(dateKey, []);
        }
        
        // 表示用の見積もり時間を調整（最大8時間とする）
        const displayEstimatedHours = Math.min(todo.estimatedHours, BUSINESS_HOURS.MAX_HOURS);
        
        // TODOを追加
        todosByDate.get(dateKey)?.push({
          todo: {
            ...todo,
            startTime: todo.plannedStartDate ? todo.plannedStartDate.getHours() : BUSINESS_HOURS.START_HOUR, // 着手予定日の時間または9時をデフォルト設定
            // 見積もり工数は最大8時間に制限
            estimatedHours: displayEstimatedHours,
            originalEstimatedHours: todo.estimatedHours // 元の見積もり時間を保持
          },
          taskId: task.id,
          taskTitle: task.title,
          priority: task.priority || 0, // 優先度を追加（未設定の場合は0）
          isNextTodo: false // NEXTTODOフラグの初期値
        });
      });
    });

    // 各日付のTODOを優先度で並べ替え（完了状態は考慮しない）
    todosByDate.forEach((todos, dateKey) => {
      // 優先度のみでソート（完了状態は考慮しない）
      todos.sort((a, b) => {
        // 1. 優先度でソート（高い順）
        if (a.priority !== b.priority) {
          return (b.priority || 0) - (a.priority || 0);
        }
        
        // 2. 期日でソート
        const today = startOfDay(new Date());
        const aDueDate = a.todo.dueDate;
        const bDueDate = b.todo.dueDate;
        const aIsOverdue = isBefore(aDueDate, today);
        const bIsOverdue = isBefore(bDueDate, today);
        const aIsToday = isToday(aDueDate);
        const bIsToday = isToday(bDueDate);

        if (aIsOverdue !== bIsOverdue) return aIsOverdue ? -1 : 1;
        if (aIsToday !== bIsToday) return aIsToday ? -1 : 1;
        return aDueDate.getTime() - bDueDate.getTime();
      });

      // 今日の日付かどうかチェック
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const isTodayDate = dateKey === todayStr;

      // NEXTTODOの設定：今日の未完了TODOの中で最も優先度の高いものをマーク
      if (isTodayDate) {
        // 未完了のTODOを探して最初のものをNEXTTODOとしてマーク
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
      
      let startTime = BUSINESS_HOURS.START_HOUR;
      let totalWorkHours = 0;
      const overflowTodos: TodoWithMeta[] = [];

      // すべてのTODOをスケジュール
      todos.forEach((todoWithMeta, index) => {
        const { todo } = todoWithMeta;
        
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
            const actualEstimatedHours = Math.min(
              remainingHours, 
              todo.estimatedHours
            );
            
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
              
              // 日付のTODOリストに追加
              todos.push(afterBreakTodo);
            }
          } else if (nextStartTime <= BUSINESS_HOURS.BREAK_END && nextStartTime > BUSINESS_HOURS.BREAK_START) {
            // 休憩時間内で終わる場合は問題なし
            nextStartTime = BUSINESS_HOURS.BREAK_END;
          } else if (nextStartTime > BUSINESS_HOURS.BREAK_END) {
            // 休憩時間をまたぐ場合は休憩時間分をスキップ
            if (startTime < BUSINESS_HOURS.BREAK_START) {
              nextStartTime += (BUSINESS_HOURS.BREAK_END - BUSINESS_HOURS.BREAK_START);
            }
          }
          
          startTime = nextStartTime;
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
      
      // 最新の状態でソート
      todos.sort((a, b) => {
        // 1. 優先度でソート（高い順）
        if (a.priority !== b.priority) {
          return (b.priority || 0) - (a.priority || 0);
        }
        
        // 2. 期日でソート
        const today = startOfDay(new Date());
        const aDueDate = a.todo.dueDate;
        const bDueDate = b.todo.dueDate;
        const aIsOverdue = isBefore(aDueDate, today);
        const bIsOverdue = isBefore(bDueDate, today);
        const aIsToday = isToday(aDueDate);
        const bIsToday = isToday(bDueDate);

        if (aIsOverdue !== bIsOverdue) return aIsOverdue ? -1 : 1;
        if (aIsToday !== bIsToday) return aIsToday ? -1 : 1;
        return aDueDate.getTime() - bDueDate.getTime();
      });
      
      // すべての予定を一旦リセットして再スケジュール
      scheduleDateTodos(dateKey);
    }

    // 今日以外の日付の場合のスケジュール調整（plannedStartDateがあればその時間を尊重）
    todosByDate.forEach((todos, dateKey) => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const isTodayDate = dateKey === todayStr;
      
      if (!isTodayDate) {
        todos.forEach((todoWithMeta) => {
          const { todo } = todoWithMeta;
          // 既に着手予定時間が設定されている場合はそれを使用
          if (todo.plannedStartDate) {
            const plannedHour = todo.plannedStartDate.getHours();
            // 営業時間内の場合のみその時間を使用（休憩時間は除く）
            if (plannedHour >= BUSINESS_HOURS.START_HOUR && plannedHour <= BUSINESS_HOURS.END_HOUR - 1 && 
                !(plannedHour >= BUSINESS_HOURS.BREAK_START && plannedHour < BUSINESS_HOURS.BREAK_END)) {
              todo.startTime = plannedHour;
              
              // 終了予定時間が休憩時間にかかる場合は調整
              const estimatedEndHour = plannedHour + todo.estimatedHours;
              if (plannedHour < BUSINESS_HOURS.BREAK_START && estimatedEndHour > BUSINESS_HOURS.BREAK_START) {
                // 休憩時間前までの分割部分
                const beforeBreakHours = BUSINESS_HOURS.BREAK_START - plannedHour;
                const afterBreakHours = todo.estimatedHours - beforeBreakHours;
                
                // 休憩前の部分に調整
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
                  
                  // 日付のTODOリストに追加
                  todos.push(afterBreakTodo);
                }
              }
              
              // 終了時間が営業終了時間を超えないように調整
              if (plannedHour + todo.estimatedHours > BUSINESS_HOURS.END_HOUR) {
                todo.estimatedHours = Math.max(1, BUSINESS_HOURS.END_HOUR - plannedHour);
              }
              return;
            }
          }
          
          // 開始時間のデフォルトは営業開始時間（休憩時間を避ける）
          let defaultStartTime = BUSINESS_HOURS.START_HOUR;
          if (defaultStartTime === BUSINESS_HOURS.BREAK_START) {
            defaultStartTime = BUSINESS_HOURS.BREAK_END;
          }
          
          todo.startTime = todo.startTime || defaultStartTime;
          
          // 開始時間が休憩時間内の場合は休憩後に調整
          if (todo.startTime >= BUSINESS_HOURS.BREAK_START && todo.startTime < BUSINESS_HOURS.BREAK_END) {
            todo.startTime = BUSINESS_HOURS.BREAK_END;
          }
          
          // 終了時間が営業終了時間を超えないように調整
          if (todo.startTime + todo.estimatedHours > BUSINESS_HOURS.END_HOUR) {
            todo.estimatedHours = Math.max(1, BUSINESS_HOURS.END_HOUR - todo.startTime);
          }
        });
      }
    });

    return todosByDate;
  }

  const todoSchedule = scheduleTodos()
  
  // デバッグ用：今日のTODOをコンソールに出力
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTodos = todoSchedule.get(todayStr) || [];
  console.log('今日のTODO一覧:', todayTodos.map(item => ({
    id: item.todo.id,
    text: item.todo.text,
    taskId: item.taskId,
    taskTitle: item.taskTitle,
    estimatedHours: item.todo.estimatedHours,
    originalEstimatedHours: item.todo.originalEstimatedHours,
    startTime: item.todo.startTime
  })));

  // 親コンポーネントのonTaskSelectに通知
  const handleTaskSelect = (taskId: string, todoId?: string) => {
    console.log('WeeklySchedule - handleTaskSelect:', { taskId, todoId })
    // 親コンポーネントに通知するだけ
    onTaskSelect(taskId, todoId)
  }

  // 日単位ビューのレンダリング
  const renderDayView = () => {
    const todayKey = format(currentDate, 'yyyy-MM-dd')
    const todayTodos = todoSchedule.get(todayKey) || []

    return (
      <div className="min-w-[600px]">
        {/* 日付ヘッダー */}
        <div 
          className="grid border-b" 
          style={{ 
            gridTemplateColumns: `3rem 1fr` 
          }}
        >
          <div className="h-8 w-12" />
          <div
            className={`text-center py-1 text-xs font-medium border-l ${
              isToday(currentDate) ? 'bg-amber-100' : ''
            }`}
          >
            {format(currentDate, 'M/d (E)', { locale: ja })}
          </div>
        </div>

        {/* 時間帯と予定 */}
        <div className="grid" style={{ gridTemplateColumns: `3rem 1fr` }}>
          {/* 時間帯 */}
          <div className="border-r">
            {timeSlots.map(hour => (
              <div key={hour} className="h-16 text-xs text-gray-500 flex items-start justify-end pr-1 pt-1">
                {`${hour}:00`}
              </div>
            ))}
          </div>

          {/* 予定エリア */}
          <div className="relative">
            {/* 時間帯の区切り線 */}
            {timeSlots.map(hour => (
              <div 
                key={hour} 
                className={`h-16 border-b border-gray-200 ${
                  hour === BUSINESS_HOURS.BREAK_START ? 'bg-gray-200' : ''
                }`}
              >
                {hour === BUSINESS_HOURS.BREAK_START && (
                  <div className="flex items-center justify-center h-full text-sm text-gray-500 font-medium">
                    休憩
                  </div>
                )}
              </div>
            ))}

            {/* TODOの表示 */}
            {todayTodos.map(({ todo, taskId, taskTitle, priority, isNextTodo }) => {
              const hourHeight = 64; // 1時間の高さ（px）
              const top = (todo.startTime || BUSINESS_HOURS.START_HOUR) * hourHeight - BUSINESS_HOURS.START_HOUR * hourHeight;
              const height = todo.estimatedHours * hourHeight;
              
              // 状態に応じた色分け
              let borderColor = todo.completed ? 'border-gray-400' : 'border-blue-400';
              let bgColor = 'bg-white';
              let textColor = 'text-gray-800';
              
              if (todo.completed) {
                // 完了済みTODO：グレーアウト
                bgColor = 'bg-gray-100';
                textColor = 'text-gray-500';
              } else {
                // NEXTTODOかどうか判定（今日かつisNextTodoがtrueのTODOのみ黄色にする）
                const today = format(new Date(), 'yyyy-MM-dd');
                const isDisplayingToday = today === todayKey;
                
                if (isDisplayingToday && isNextTodo) {
                  // 今日のTODO（NEXTTODO表示対象）：黄色系
                  bgColor = 'bg-amber-100';
                  borderColor = 'border-amber-500';
                }
                // それ以外のTODOは白（デフォルト）のまま
              }
              
              // ラベル（予定か期日かの区別）
              let timeLabel = '';
              if (todo.plannedStartDate) {
                timeLabel = '予定: ';
              } else if (isToday(todo.dueDate)) {
                timeLabel = '期日: ';
              }

              return (
                <div
                  key={todo.id}
                  className={`absolute left-0 right-0 mx-1 p-1 rounded overflow-hidden border-l-4 ${borderColor} ${bgColor} ${textColor} ${selectedTodoId === todo.id ? 'ring-4 ring-blue-500 shadow-md' : ''}`}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    // 選択されている場合は前面に表示
                    zIndex: selectedTodoId === todo.id ? 10 : 1,
                    // 選択されている場合は境界線を追加
                    boxShadow: selectedTodoId === todo.id ? '0 4px 12px rgba(59, 130, 246, 0.5)' : undefined,
                    // 選択時の背景色を追加
                    backgroundColor: selectedTodoId === todo.id ? (todo.completed ? '#e5e7eb' : '#dbeafe') : undefined
                  }}
                  onClick={() => handleTaskSelect(taskId, todo.id)}
                >
                  <div className={`font-medium truncate ${selectedTodoId === todo.id ? 'text-blue-700 font-bold' : ''}`}>
                    {todo.text}
                    {todo.id.includes('-after-break-') && <span className="text-xs ml-1 text-amber-600">（休憩後）</span>}
                  </div>
                  <div className="text-gray-500 truncate">{taskTitle}</div>
                  <div className="text-gray-500">
                    {timeLabel}{Math.round((todo.originalEstimatedHours || todo.estimatedHours) * 10) / 10}h
                    {todo.plannedStartDate && format(todo.plannedStartDate, 'yyyy-MM-dd') !== todayKey && (
                      <span className="ml-1 text-xs text-gray-400">(予定: {format(todo.plannedStartDate, 'M/d')})</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // 月単位ビューのレンダリング
  const renderMonthView = () => {
    const weeks = [];
    for (let i = 0; i < 6; i++) {
      weeks.push(monthCalendarDays.slice(i * 7, (i + 1) * 7));
    }

    return (
      <div className="min-w-[800px] relative">
        {/* 年月表示 - スティッキーポジショニングを適用 */}
        <div className="sticky left-0 z-10 text-left font-medium py-2 text-gray-700 pl-2 bg-white">
          {format(currentDate, 'yyyy年M月', { locale: ja })}
        </div>
        
        {/* 曜日ヘッダー */}
        <div 
          className="grid grid-cols-7 border-b"
        >
          {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
            <div
              key={index}
              className="text-center py-1 text-xs font-medium border-l"
            >
              {day}
            </div>
          ))}
        </div>

        {/* カレンダー本体 */}
        <div className="grid grid-cols-7">
          {monthCalendarDays.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayTodos = todoSchedule.get(dateKey) || [];
            const isSunday = getDay(day) === 0;
            const isSaturday = getDay(day) === 6;
            
            return (
              <div 
                key={index}
                className={`min-h-[100px] border-b border-l p-1 ${
                  isToday(day) ? 'bg-amber-100' : 
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 
                  isSunday ? 'text-red-500' : 
                  isSaturday ? 'text-blue-500' : ''
                }`}
              >
                <div className="text-right text-xs mb-1">
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayTodos.slice(0, 3).map(({ todo, taskId, priority, isNextTodo }) => {
                    // 状態に応じた色分け
                    let bgColor = 'bg-white';
                    let textColor = 'text-gray-800';
                    let borderClass = 'border border-gray-200';
                    
                    if (todo.completed) {
                      // 完了済みTODO：グレーアウト
                      bgColor = 'bg-gray-100';
                      textColor = 'text-gray-500';
                      borderClass = 'border border-gray-300';
                    } else {
                      // NEXTTODOかどうか判定（今日かつisNextTodoがtrueのTODOのみ黄色にする）
                      const today = format(new Date(), 'yyyy-MM-dd');
                      const isDisplayingToday = isToday(day) && format(day, 'yyyy-MM-dd') === today;
                      
                      if (isDisplayingToday && isNextTodo) {
                        // 今日のTODO（NEXTTODO表示対象）：黄色系
                        bgColor = 'bg-amber-100';
                        borderClass = 'border border-amber-400';
                      } else {
                        // 予定TODO：デフォルト白色
                        bgColor = 'bg-white';
                      }
                    }
                    
                    // 選択されたTODOの場合、スタイルを強調
                    if (selectedTodoId === todo.id) {
                      bgColor = todo.completed ? 'bg-gray-200' : 'bg-blue-100';
                      borderClass = 'border-2 border-blue-600';
                      textColor = 'text-blue-800 font-bold';
                    }

                    return (
                      <div
                        key={todo.id}
                        className={`text-xs p-1 ${bgColor} rounded truncate cursor-pointer flex items-center ${textColor} ${borderClass} ${selectedTodoId === todo.id ? 'ring-4 ring-blue-500 shadow-md' : ''}`}
                        style={{
                          boxShadow: selectedTodoId === todo.id ? '0 4px 8px rgba(59, 130, 246, 0.5)' : undefined,
                          zIndex: selectedTodoId === todo.id ? 10 : 1,
                          position: 'relative'
                        }}
                        onClick={() => handleTaskSelect(taskId, todo.id)}
                      >
                        <span className="truncate">
                          {todo.text}
                        </span>
                      </div>
                    );
                  })}
                  {dayTodos.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      + {dayTodos.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isClient) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold">スケジュール</h2>
          <div className="flex items-center gap-2">
            <button className="p-1 hover:bg-gray-100 rounded">
              <IoChevronBack className="w-5 h-5" />
            </button>
            <button className="px-2 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
              今日
            </button>
            <button className="p-1 hover:bg-gray-100 rounded">
              <IoChevronForward className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* ローディング表示 */}
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 mb-4"></div>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold">
          スケジュール
        </h2>
        
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {viewModeButtons.map((button) => (
              <button
                key={button.id}
                onClick={() => setViewMode(button.id)}
                className={`p-2 rounded ${
                  viewMode === button.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={button.label}
              >
                {button.icon}
              </button>
            ))}
          </div>
          
          <div className="h-6 border-l border-gray-300"></div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={movePrevious}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <IoChevronBack className="w-5 h-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-2 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              {viewMode === 'day' ? '今日' : viewMode === 'week' ? '今週' : '今月'}
            </button>
            <button
              onClick={moveNext}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <IoChevronForward className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end mb-2">
        {(viewMode === 'week' || viewMode === 'month') && (
          <button
            onClick={() => setShowWeekend(!showWeekend)}
            className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            {showWeekend ? '土日を非表示' : '土日を表示'}
            <span className="text-xs">
              {showWeekend ? '▼' : '▶'}
            </span>
          </button>
        )}
      </div>
      
      {/* 月表示の場合は年月表示を外部に配置 */}
      {viewMode === 'month' && (
        <div className="font-medium py-2 text-gray-700 pl-2 border-b mb-2">
          {format(currentDate, 'yyyy年M月', { locale: ja })}
        </div>
      )}
      
      <div className="overflow-x-auto">
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && (
          <div className={showWeekend ? "min-w-[800px]" : "min-w-[600px]"}>
            {/* 曜日ヘッダー */}
            <div 
              className="grid border-b" 
              style={{ 
                gridTemplateColumns: `3rem repeat(${displayDays.length}, 1fr)` 
              }}
            >
              <div className="h-8 w-12" />
              {displayDays.map((day, index) => (
                <div
                  key={index}
                  className={`text-center py-1 text-xs font-medium border-l ${
                    isToday(day) ? 'bg-amber-100' : ''
                  }`}
                >
                  {format(day, 'M/d (E)', { locale: ja })}
                </div>
              ))}
            </div>

            <DndContext
              weekDays={displayDays}
              timeSlots={timeSlots}
              tasks={tasks}
              onTaskSelect={handleTaskSelect}
              onTodoUpdate={onTodoUpdate}
              selectedTodoId={selectedTodoId}
            />
          </div>
        )}
        {viewMode === 'month' && (
          <div className={showWeekend ? "min-w-[800px]" : "min-w-[600px]"}>            
            {/* 曜日ヘッダー */}
            <div 
              className="grid border-b"
              style={{ 
                gridTemplateColumns: showWeekend ? 'repeat(7, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))' 
              }}
            >
              {(showWeekend ? ['日', '月', '火', '水', '木', '金', '土'] : ['月', '火', '水', '木', '金']).map((day, index) => (
                <div
                  key={index}
                  className="text-center py-1 text-xs font-medium border-l"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* カレンダー本体 */}
            <div 
              className="grid"
              style={{ 
                gridTemplateColumns: showWeekend ? 'repeat(7, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))' 
              }}
            >
              {monthCalendarDays
                .filter(day => showWeekend || (getDay(day) !== 0 && getDay(day) !== 6))
                .map((day, index) => {
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayTodos = todoSchedule.get(dateKey) || [];
                const isSunday = getDay(day) === 0;
                const isSaturday = getDay(day) === 6;
                
                return (
                  <div 
                    key={`${dateKey}-${index}`}
                    className={`min-h-[100px] border-b border-l p-1 ${
                      isToday(day) ? 'bg-amber-100' : 
                      !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 
                      isSunday ? 'text-red-500' : 
                      isSaturday ? 'text-blue-500' : ''
                    }`}
                  >
                    <div className="text-right text-xs mb-1">
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayTodos.slice(0, 3).map(({ todo, taskId, priority, isNextTodo }) => {
                        // 状態に応じた色分け
                        let bgColor = 'bg-white';
                        let textColor = 'text-gray-800';
                        let borderClass = 'border border-gray-200';
                        
                        if (todo.completed) {
                          // 完了済みTODO：グレーアウト
                          bgColor = 'bg-gray-100';
                          textColor = 'text-gray-500';
                          borderClass = 'border border-gray-300';
                        } else {
                          // NEXTTODOかどうか判定（今日かつisNextTodoがtrueのTODOのみ黄色にする）
                          const today = format(new Date(), 'yyyy-MM-dd');
                          const isDisplayingToday = isToday(day) && format(day, 'yyyy-MM-dd') === today;
                          
                          if (isDisplayingToday && isNextTodo) {
                            // 今日のTODO（NEXTTODO表示対象）：黄色系
                            bgColor = 'bg-amber-100';
                            borderClass = 'border border-amber-400';
                          } else {
                            // 予定TODO：デフォルト白色
                            bgColor = 'bg-white';
                          }
                        }
                        
                        // 選択されたTODOの場合、スタイルを強調
                        if (selectedTodoId === todo.id) {
                          bgColor = todo.completed ? 'bg-gray-200' : 'bg-blue-100';
                          borderClass = 'border-2 border-blue-600';
                          textColor = 'text-blue-800 font-bold';
                        }

                        return (
                          <div
                            key={todo.id}
                            className={`text-xs p-1 ${bgColor} rounded truncate cursor-pointer flex items-center ${textColor} ${borderClass} ${selectedTodoId === todo.id ? 'ring-4 ring-blue-500 shadow-md' : ''}`}
                            style={{
                              boxShadow: selectedTodoId === todo.id ? '0 4px 8px rgba(59, 130, 246, 0.5)' : undefined,
                              zIndex: selectedTodoId === todo.id ? 10 : 1,
                              position: 'relative'
                            }}
                            onClick={() => handleTaskSelect(taskId, todo.id)}
                          >
                            <span className="truncate">
                              {todo.text}
                            </span>
                          </div>
                        );
                      })}
                      {dayTodos.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          + {dayTodos.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 