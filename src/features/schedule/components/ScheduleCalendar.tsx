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
import { filterTodosForDisplay } from '../utils/scheduleTodoUtils'
import { getAllUsers } from '@/features/tasks/utils/userUtils'

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
  const [newTodoStartTime, setNewTodoStartTime] = useState<string>('09:00')
  const [newTodoEndTime, setNewTodoEndTime] = useState<string>('10:00')
  const [newTodoAssigneeId, setNewTodoAssigneeId] = useState<string>('')
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
      
      // 共通化したユーティリティ関数を使用してスケジュールを計算
      const schedule = filterTodosForDisplay(tasks, selectedUserIds, showUnassigned);
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

  // 15分単位の時間オプションを生成する関数
  const generateTimeOptions = () => {
    const options: string[] = [];
    for (let hour = BUSINESS_HOURS.START_HOUR; hour <= BUSINESS_HOURS.END_HOUR; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        options.push(
          `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        );
      }
    }
    return options;
  };

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

  // カレンダー部分のクリックイベントハンドラー
  const handleCalendarClick = (e: React.MouseEvent<HTMLDivElement>, day: Date, hour: number) => {
    // クリックした日付と時間を取得（引数から直接受け取る）
    const clickedDate = new Date(day);
    
    // 営業時間外の場合は営業開始時間に設定
    let clickedHour = hour;
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
    // クリックした時間を開始時間として設定
    setNewTodoStartTime(`${clickedHour.toString().padStart(2, '0')}:00`);
    // 終了時間は開始時間の1時間後（ただし、営業時間内に収まるように調整）
    const endHour = Math.min(clickedHour + 1, BUSINESS_HOURS.END_HOUR);
    setNewTodoEndTime(`${endHour.toString().padStart(2, '0')}:00`);
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

    // 開始時間と終了時間を設定
    const [startHour, startMinute] = newTodoStartTime.split(':').map(Number);
    const [endHour, endMinute] = newTodoEndTime.split(':').map(Number);

    const calendarStartDateTime = new Date(newTodoDate);
    calendarStartDateTime.setHours(startHour, startMinute, 0, 0);
    
    const calendarEndDateTime = new Date(newTodoDate);
    calendarEndDateTime.setHours(endHour, endMinute, 0, 0);

    // 見積もり工数を計算（時間単位）
    const estimatedHours = 
      (endHour + endMinute / 60) - (startHour + startMinute / 60);

    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: newTodoText.trim(),
      completed: false,
      startDate: new Date(newTodoDate),
      calendarStartDateTime,
      calendarEndDateTime,
      estimatedHours,
      actualHours: 0,
      assigneeId: newTodoAssigneeId
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
      setNewTodoEstimatedHours(0.5);
      setNewTodoStartTime('09:00');
      setNewTodoEndTime('10:00');
      setNewTodoAssigneeId('');
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
            onTodoUpdate={onTodoUpdate}
            onCalendarClick={(e: React.MouseEvent<HTMLDivElement>, day: Date, hour: number) => handleCalendarClick(e, day, hour)}
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
                setNewTodoStartTime('09:00');
                setNewTodoEndTime('10:00');
                setNewTodoAssigneeId('');
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
                  {newTodoDate ? format(newTodoDate, 'yyyy年M月d日 (E)', { locale: ja }) : ''}
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開始時間
                  </label>
                  <select
                    value={newTodoStartTime}
                    onChange={(e) => {
                      setNewTodoStartTime(e.target.value);
                      // 開始時間が終了時間より後の場合、終了時間を調整
                      if (e.target.value >= newTodoEndTime) {
                        const [hour, minute] = e.target.value.split(':').map(Number);
                        const newEndHour = hour + 1;
                        if (newEndHour <= BUSINESS_HOURS.END_HOUR) {
                          setNewTodoEndTime(
                            `${newEndHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                          );
                        }
                      }
                    }}
                    className="w-full p-2 border rounded-md"
                  >
                    {generateTimeOptions().map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    終了時間
                  </label>
                  <select
                    value={newTodoEndTime}
                    onChange={(e) => {
                      setNewTodoEndTime(e.target.value);
                      // 終了時間が開始時間より前の場合、開始時間を調整
                      if (e.target.value <= newTodoStartTime) {
                        const [hour, minute] = e.target.value.split(':').map(Number);
                        const newStartHour = Math.max(BUSINESS_HOURS.START_HOUR, hour - 1);
                        setNewTodoStartTime(
                          `${newStartHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                        );
                      }
                    }}
                    className="w-full p-2 border rounded-md"
                  >
                    {generateTimeOptions().map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
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
                  担当者
                </label>
                <select
                  value={newTodoAssigneeId}
                  onChange={(e) => setNewTodoAssigneeId(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">担当者を選択</option>
                  {getAllUsers().map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
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
                  setNewTodoStartTime('09:00');
                  setNewTodoEndTime('10:00');
                  setNewTodoAssigneeId('');
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