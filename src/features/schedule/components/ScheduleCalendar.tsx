'use client'

import React, { useState, useEffect } from 'react'
import { format, addDays, startOfWeek, isBefore, isToday, startOfMonth, endOfMonth, getDaysInMonth, getDay, addMonths, startOfDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { IoCalendarOutline, IoChevronBack, IoChevronForward, IoCalendarClearOutline, IoCalendarNumberOutline } from 'react-icons/io5'
import dynamic from 'next/dynamic'
import { BUSINESS_HOURS, generateTimeSlots } from '@/utils/constants/constants'
import { useFilterContext } from '@/features/tasks/filters/FilterContext'
import { ScheduleCalendarProps, TodoWithMeta, ViewMode, ViewModeButton } from '../types/schedule'
import DayView from './DayView'
import MonthView from './MonthView'
import ScheduleHeader from './ScheduleHeader'
import { Task, Todo } from '@/features/tasks/types/task'

const WeeklyScheduleDnd = dynamic(
  () => import('./WeeklyScheduleDnd').then(mod => mod.default),
  { ssr: false }
)

export default function ScheduleCalendar({ 
  tasks, 
  onTaskSelect, 
  onTodoUpdate, 
  selectedTodoId, 
  onTaskUpdate 
}: ScheduleCalendarProps) {
  const [isClient, setIsClient] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showWeekend, setShowWeekend] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [isCreatingTodo, setIsCreatingTodo] = useState(false)
  const [newTodoDate, setNewTodoDate] = useState<Date | null>(null)
  const [newTodoTaskId, setNewTodoTaskId] = useState<string | null>(null)
  const [newTodoText, setNewTodoText] = useState('')
  const [newTodoEstimatedHours, setNewTodoEstimatedHours] = useState(0.5)
  const [viewModeButtons, setViewModeButtons] = useState<ViewModeButton[]>([
    { id: 'day', icon: <IoCalendarClearOutline className="w-5 h-5" />, label: '日' },
    { id: 'week', icon: <IoCalendarOutline className="w-5 h-5" />, label: '週' },
    { id: 'month', icon: <IoCalendarNumberOutline className="w-5 h-5" />, label: '月' }
  ])
  const [todoSchedule, setTodoSchedule] = useState<Map<string, TodoWithMeta[]>>(new Map())
  
  // フィルタリングコンテキストを使用
  const { selectedUserIds, showUnassigned } = useFilterContext()
  
  // 選択状態の変更を検知するuseEffect
  useEffect(() => {
    if (selectedTodoId) {
      console.log('ScheduleCalendar - selectedTodoId変更:', selectedTodoId)
    }
  }, [selectedTodoId])

  useEffect(() => {
    setIsClient(true)
  }, [])

  // tasksが変更されたときにtodoScheduleを再計算
  useEffect(() => {
    if (isClient) {
      console.log('ScheduleCalendar - tasksが変更されました。スケジュール再計算', {
        tasksLength: tasks.length,
        totalTodos: tasks.reduce((acc, task) => acc + task.todos.length, 0)
      });
      const schedule = scheduleTodos();
      setTodoSchedule(schedule);
    }
  }, [tasks, selectedUserIds, showUnassigned, isClient]);

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
    console.log('ScheduleCalendar - scheduleTodos 開始', { 
      tasksCount: tasks.length, 
      selectedUserIds, 
      showUnassigned 
    });
    
    // TODOを日付ごとにグループ化するためのMap
    const todosByDate = new Map<string, TodoWithMeta[]>();
    
    // すべてのタスクからTODOを抽出し、フィルタリングして処理
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
    
    // 今日の日付を取得
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    // 各日付のTODOに対して処理
    todosByDate.forEach((todos, dateKey) => {
      // カレンダーの開始時間でソート
      todos.sort((a, b) => {
        const aStartTime = a.todo.startTime || BUSINESS_HOURS.START_HOUR;
        const bStartTime = b.todo.startTime || BUSINESS_HOURS.START_HOUR;
        return aStartTime - bStartTime;
      });
      
      // 今日の日付の場合、最初の未完了TODOをNEXTTODOとしてマーク
      if (dateKey === todayStr) {
        const incompleteTodo = todos.find(item => !item.todo.completed);
        if (incompleteTodo) {
          incompleteTodo.isNextTodo = true;
        }
      }
      
      // 休憩時間の調整とTODOの時間調整
      adjustTodoTiming(todos, dateKey === todayStr);
    });
    
    console.log('ScheduleCalendar - scheduleTodos 完了', { 
      dateCount: todosByDate.size,
      todoCount: Array.from(todosByDate.values()).reduce((sum, todos) => sum + todos.length, 0)
    });
    
    return todosByDate;
  };
  
  // TODOの時間調整を行う補助関数
  const adjustTodoTiming = (todos: TodoWithMeta[], isToday: boolean) => {
    todos.forEach(todoWithMeta => {
      const { todo } = todoWithMeta;
      
      // 既に設定された開始時間を取得または初期値を設定
      let startTime = todo.startTime || BUSINESS_HOURS.START_HOUR;
      
      // 休憩時間を避ける
      if (startTime >= BUSINESS_HOURS.BREAK_START && startTime < BUSINESS_HOURS.BREAK_END) {
        startTime = BUSINESS_HOURS.BREAK_END;
      }
      
      // 終了時間が休憩時間にかかる場合の調整は省略（単純化のため）
      
      // 営業時間内に収まるように調整
      if (startTime + todo.estimatedHours > BUSINESS_HOURS.END_HOUR) {
        todo.estimatedHours = Math.max(1, BUSINESS_HOURS.END_HOUR - startTime);
      }
      
      // 調整後の開始時間を設定
      todo.startTime = startTime;
    });
  };

  // カレンダー部分のクリックイベントハンドラー
  const handleCalendarClick = (e: React.MouseEvent<HTMLDivElement>, day: Date, hour: number) => {
    // クリックした日付と時間を取得（引数から直接受け取る）
    const clickedDate = new Date(day);
    
    // 休憩時間内の場合は営業時間または休憩後に調整
    let clickedHour = hour;
    if (clickedHour >= BUSINESS_HOURS.BREAK_START && clickedHour < BUSINESS_HOURS.BREAK_END) {
      clickedHour = BUSINESS_HOURS.BREAK_END;
    }
    
    // 営業時間外の場合は営業開始時間に設定
    if (clickedHour < BUSINESS_HOURS.START_HOUR || clickedHour >= BUSINESS_HOURS.END_HOUR) {
      clickedHour = BUSINESS_HOURS.START_HOUR;
    }
    
    // 日付に時間を設定
    clickedDate.setHours(clickedHour, 0, 0, 0);
    
    console.log('ScheduleCalendar - handleCalendarClick:', {
      clickedDay: format(day, 'yyyy-MM-dd'),
      clickedDate,
      clickedHour,
      weekDays
    });
    
    setNewTodoDate(clickedDate);
    setNewTodoText(''); // テキストをリセット
    setIsCreatingTodo(true);
  };

  // 新しいTODOを作成する関数
  const handleCreateTodo = (taskId: string) => {
    if (!newTodoDate || !newTodoText.trim()) {
      console.log('ScheduleCalendar - handleCreateTodo: 必要なデータが不足', {
        newTodoDate,
        onTaskUpdate: !!onTaskUpdate,
        newTodoText: newTodoText.trim()
      });
      return;
    }

    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.log('ScheduleCalendar - handleCreateTodo: タスクが見つからない', { taskId });
      return;
    }

    // カレンダー表示用の日時を計算
    const calendarStartDateTime = new Date(newTodoDate);
    calendarStartDateTime.setHours(newTodoDate.getHours(), 0, 0, 0);
    
    const calendarEndDateTime = new Date(calendarStartDateTime);
    calendarEndDateTime.setHours(calendarStartDateTime.getHours() + newTodoEstimatedHours);

    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: newTodoText.trim(),
      completed: false,
      startDate: new Date(newTodoDate),
      calendarStartDateTime,
      calendarEndDateTime,
      estimatedHours: newTodoEstimatedHours,
      actualHours: 0,
      assigneeId: ''
    };

    console.log('ScheduleCalendar - handleCreateTodo: 新しいTODOを作成', {
      todoId: newTodo.id,
      taskId: task.id,
      date: newTodoDate,
      estimatedHours: newTodoEstimatedHours,
      todo: newTodo
    });

    // 既存のタスクに新しいTODOを追加
    const updatedTask: Task = {
      ...task,
      todos: [...task.todos, newTodo]
    };

    // 親コンポーネントに通知してタスクを更新
    if (onTaskUpdate) {
      onTaskUpdate(updatedTask);
      
      // 状態をリセット
      setIsCreatingTodo(false);
      setNewTodoDate(null);
      setNewTodoTaskId(null);
      setNewTodoText('');
      setNewTodoEstimatedHours(0.5); // デフォルト値にリセット
      
      // すぐにカレンダー上にTODOを表示するためにスケジュールを再計算
      setTimeout(() => {
        const updatedSchedule = scheduleTodos();
        setTodoSchedule(updatedSchedule);
        console.log('ScheduleCalendar - handleCreateTodo: スケジュール再計算完了', {
          updatedSchedule: updatedSchedule.size,
          newTodoId: newTodo.id
        });
      }, 100);
    }
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
      <ScheduleHeader 
        currentDate={currentDate}
        viewMode={viewMode}
        viewModeButtons={viewModeButtons}
        showWeekend={showWeekend}
        onViewModeChange={setViewMode}
        onShowWeekendChange={setShowWeekend}
        onMovePrevious={movePrevious}
        onMoveNext={moveNext}
        onGoToToday={goToToday}
      />
      
      {/* 月表示の場合は年月表示を外部に配置 */}
      {viewMode === 'month' && (
        <div className="font-medium py-2 text-gray-700 pl-2 border-b mb-2">
          {format(currentDate, 'yyyy年M月', { locale: ja })}
        </div>
      )}
      
      <div className="overflow-x-auto">
        {viewMode === 'day' && 
          <DayView 
            currentDate={currentDate}
            timeSlots={timeSlots}
            todoSchedule={todoSchedule}
            selectedTodoId={selectedTodoId}
            onTaskSelect={onTaskSelect}
          />
        }
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

            <WeeklyScheduleDnd
              weekDays={displayDays}
              timeSlots={timeSlots}
              tasks={tasks}
              onTaskSelect={onTaskSelect}
              onTodoUpdate={onTodoUpdate}
              selectedTodoId={selectedTodoId}
              onCalendarClick={(e: React.MouseEvent<HTMLDivElement>, day: Date, hour: number) => handleCalendarClick(e, day, hour)}
              isCreatingTodo={isCreatingTodo}
              newTodoDate={newTodoDate}
              newTodoTaskId={newTodoTaskId}
              newTodoText={newTodoText}
              newTodoEstimatedHours={newTodoEstimatedHours}
              onNewTodoTaskIdChange={setNewTodoTaskId}
              onNewTodoTextChange={setNewTodoText}
              onNewTodoEstimatedHoursChange={setNewTodoEstimatedHours}
              onCancelCreateTodo={() => {
                setIsCreatingTodo(false);
                setNewTodoDate(null);
                setNewTodoTaskId(null);
                setNewTodoText('');
                setNewTodoEstimatedHours(0.5);
              }}
              onCreateTodo={handleCreateTodo}
            />
          </div>
        )}
        {viewMode === 'month' && (
          <MonthView 
            currentDate={currentDate}
            showWeekend={showWeekend}
            monthCalendarDays={monthCalendarDays}
            todoSchedule={todoSchedule}
            selectedTodoId={selectedTodoId}
            onTaskSelect={onTaskSelect}
          />
        )}
      </div>

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
                  onChange={(e) => setNewTodoTaskId(e.target.value)}
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
                  onChange={(e) => setNewTodoText(e.target.value)}
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
                  onChange={(e) => setNewTodoEstimatedHours(Number(e.target.value))}
                  className="w-full p-2 border rounded-md"
                  placeholder="見積もり工数を入力"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsCreatingTodo(false);
                  setNewTodoDate(null);
                  setNewTodoTaskId(null);
                  setNewTodoText('');
                  setNewTodoEstimatedHours(0.5);
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                キャンセル
              </button>
              <button
                onClick={() => newTodoTaskId && handleCreateTodo(newTodoTaskId)}
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