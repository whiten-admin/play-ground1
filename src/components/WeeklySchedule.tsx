'use client'

import React, { useState, useEffect } from 'react'
import { format, addDays, startOfWeek, isSameDay, addHours, isBefore, isToday, parse, startOfMonth, endOfMonth, getDaysInMonth, getDay, addMonths } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Task } from '@/types/task'
import { IoCalendarOutline, IoGrid, IoList, IoChevronBack, IoChevronForward, IoCalendarClearOutline, IoCalendarNumberOutline } from 'react-icons/io5'
import dynamic from 'next/dynamic'

const DndContext = dynamic(
  () => import('./WeeklyScheduleDnd').then(mod => mod.default),
  { ssr: false }
)

interface WeeklyScheduleProps {
  tasks: Task[]
  onTaskSelect: (taskId: string, todoId?: string) => void
  onTodoUpdate: (todoId: string, taskId: string, newDate: Date) => void
}

interface TodoWithMeta {
  todo: {
    id: string
    text: string
    completed: boolean
    dueDate: Date
    estimatedHours: number
    startTime?: number
  }
  taskId: string
  taskTitle: string
}

// ビューモードの型定義
type ViewMode = 'day' | 'week' | 'month'

// ビューモードボタンの型定義
interface ViewModeButton {
  id: ViewMode
  icon: JSX.Element
  label: string
}

export default function WeeklySchedule({ tasks, onTaskSelect, onTodoUpdate }: WeeklyScheduleProps) {
  const [isClient, setIsClient] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showWeekend, setShowWeekend] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [viewModeButtons, setViewModeButtons] = useState<ViewModeButton[]>([
    { id: 'day', icon: <IoCalendarClearOutline className="w-5 h-5" />, label: '日' },
    { id: 'week', icon: <IoCalendarOutline className="w-5 h-5" />, label: '週' },
    { id: 'month', icon: <IoCalendarNumberOutline className="w-5 h-5" />, label: '月' }
  ])

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

  // 時間帯の設定（9:00-18:00）
  const timeSlots = Array.from({ length: 10 }, (_, i) => i + 9)

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

    tasks.forEach(task => {
      task.todos.forEach(todo => {
        const dateKey = format(todo.dueDate, 'yyyy-MM-dd')
        if (!todosByDate.has(dateKey)) {
          todosByDate.set(dateKey, [])
        }
        todosByDate.get(dateKey)?.push({
          todo: {
            ...todo,
            startTime: 9 // デフォルト値を設定
          },
          taskId: task.id,
          taskTitle: task.title
        })
      })
    })

    // 各日付のTODOを時間で並べ替え
    todosByDate.forEach((todos, dateKey) => {
      todos.sort((a, b) => {
        if (isBefore(a.todo.dueDate, b.todo.dueDate)) return -1
        if (isBefore(b.todo.dueDate, a.todo.dueDate)) return 1
        return 0
      })

      // TODOに時間を割り当て
      let currentTime = 9 // 9:00から開始
      todos.forEach(({ todo }) => {
        // 既に過去の時間の場合、現在時刻に更新
        const now = new Date()
        if (currentTime < now.getHours()) {
          currentTime = now.getHours()
        }

        // 終了時間が18時を超えないように調整
        if (currentTime + todo.estimatedHours > 18) {
          currentTime = 18 - todo.estimatedHours
        }

        todo.startTime = currentTime
        currentTime += todo.estimatedHours
      })
    })

    return todosByDate
  }

  const todoSchedule = scheduleTodos()

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
              isToday(currentDate) ? 'bg-blue-50' : ''
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
                className="h-16 border-b border-gray-100"
              />
            ))}

            {/* TODOの表示 */}
            {todayTodos.map(({ todo, taskId, taskTitle }) => {
              const hourHeight = 64; // 1時間の高さ（px）
              const top = (todo.startTime || 9) * hourHeight - 9 * hourHeight;
              const height = todo.estimatedHours * hourHeight;

              return (
                <div
                  key={todo.id}
                  className="absolute left-0 right-0 mx-1 p-1 rounded overflow-hidden border-l-4 border-blue-500 bg-blue-50 text-xs"
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                  }}
                  onClick={() => onTaskSelect(taskId, todo.id)}
                >
                  <div className="font-medium truncate">{todo.text}</div>
                  <div className="text-gray-500 truncate">{taskTitle}</div>
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
                  isToday(day) ? 'bg-blue-50' : 
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 
                  isSunday ? 'text-red-500' : 
                  isSaturday ? 'text-blue-500' : ''
                }`}
              >
                <div className="text-right text-xs mb-1">
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayTodos.slice(0, 3).map(({ todo, taskId }) => (
                    <div
                      key={todo.id}
                      className="text-xs p-1 bg-blue-100 rounded truncate cursor-pointer"
                      onClick={() => onTaskSelect(taskId, todo.id)}
                    >
                      {todo.text}
                    </div>
                  ))}
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
                    isToday(day) ? 'bg-blue-50' : ''
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
              onTaskSelect={onTaskSelect}
              onTodoUpdate={onTodoUpdate}
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
                      isToday(day) ? 'bg-blue-50' : 
                      !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 
                      isSunday ? 'text-red-500' : 
                      isSaturday ? 'text-blue-500' : ''
                    }`}
                  >
                    <div className="text-right text-xs mb-1">
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayTodos.slice(0, 3).map(({ todo, taskId }) => (
                        <div
                          key={todo.id}
                          className="text-xs p-1 bg-blue-100 rounded truncate cursor-pointer"
                          onClick={() => onTaskSelect(taskId, todo.id)}
                        >
                          {todo.text}
                        </div>
                      ))}
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