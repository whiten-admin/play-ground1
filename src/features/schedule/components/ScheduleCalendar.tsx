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
import { useProjectContext } from '@/features/projects/contexts/ProjectContext'
import { getProjectMemberName } from '@/utils/memberUtils'
import { useAuth } from '@/services/auth/hooks/useAuth'

const WeeklyScheduleDnd = dynamic(
  () => import('./WeeklyScheduleDnd').then(mod => mod.default),
  { ssr: false }
)

// ローカルストレージのキー
const STORAGE_KEY_GOOGLE_EVENTS = 'google_calendar_events';
const STORAGE_KEY_GOOGLE_INTEGRATED = 'google_calendar_integrated';

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
  const [viewModeButtons, setViewModeButtons] = useState<ViewModeButton[]>([
    { id: 'day', icon: <IoCalendarClearOutline className="w-5 h-5" />, label: '日' },
    { id: 'week', icon: <IoCalendarOutline className="w-5 h-5" />, label: '週' },
    { id: 'month', icon: <IoCalendarNumberOutline className="w-5 h-5" />, label: '月' }
  ])
  const [todoSchedule, setTodoSchedule] = useState<Map<string, TodoWithMeta[]>>(new Map())
  
  // フィルタリングコンテキストを使用
  const { selectedUserIds, showUnassigned } = useFilterContext()
  
  // プロジェクトコンテキストを使用
  const { currentProject, getProjectMembers } = useProjectContext()
  
  // Authコンテキストからユーザー情報を取得
  const { user } = useAuth();
  
  // Googleカレンダー連携関連の状態
  const [isGoogleIntegrated, setIsGoogleIntegrated] = useState(false)
  const [googleEvents, setGoogleEvents] = useState<TodoWithMeta[]>([])
  // 外部予定表示用の専用スケジュールデータ
  const [externalSchedule, setExternalSchedule] = useState<Map<string, TodoWithMeta[]>>(new Map())
  // 内部TODOと外部予定を統合したスケジュール
  const [mergedSchedule, setMergedSchedule] = useState<Map<string, TodoWithMeta[]>>(new Map())
  
  // 選択状態の変更を検知するuseEffect
  useEffect(() => {
    if (selectedTodoId) {
      console.log('ScheduleCalendar - selectedTodoId変更:', selectedTodoId)
    }
  }, [selectedTodoId])

  useEffect(() => {
    setIsClient(true)
    
    // ローカルストレージから外部予定データと連携状態を読み込む
    if (typeof window !== 'undefined') {
      // Googleカレンダー連携状態を読み込む
      const storedIntegrationState = localStorage.getItem(STORAGE_KEY_GOOGLE_INTEGRATED);
      if (storedIntegrationState === 'true') {
        console.log('ローカルストレージからGoogleカレンダー連携状態を復元: 連携済み');
        setIsGoogleIntegrated(true);
      }
      
      // 外部予定データを読み込む
      const storedEventsJson = localStorage.getItem(STORAGE_KEY_GOOGLE_EVENTS);
      if (storedEventsJson) {
        try {
          // 日付文字列をDateオブジェクトに変換するリバイバー関数を使用してJSON解析
          const parsedEvents = JSON.parse(storedEventsJson, (key, value) => {
            // 日付文字列をDateオブジェクトに変換
            if (key === 'startDate' || key === 'calendarStartDateTime' || key === 'calendarEndDateTime') {
              return new Date(value);
            }
            return value;
          });
          
          if (Array.isArray(parsedEvents) && parsedEvents.length > 0) {
            console.log('ローカルストレージから外部予定を復元:', parsedEvents.length, '件');
            setGoogleEvents(parsedEvents);
          }
        } catch (error) {
          console.error('外部予定の読み込みに失敗しました', error);
        }
      }
    }
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
  
  // todoScheduleとexternalScheduleを統合したスケジュールを生成
  useEffect(() => {
    if (isClient) {
      console.log('スケジュールマージ処理を実行', {
        todoScheduleSize: todoSchedule.size,
        externalScheduleSize: externalSchedule.size
      });
      
      // 内部TODOと外部予定を統合
      const merged = new Map<string, TodoWithMeta[]>();
      
      // 内部TODOをマージ
      Array.from(todoSchedule.entries()).forEach(([date, todos]) => {
        merged.set(date, [...todos]);
      });
      
      // 外部予定をマージ
      Array.from(externalSchedule.entries()).forEach(([date, events]) => {
        const existingTodos = merged.get(date) || [];
        merged.set(date, [...existingTodos, ...events]);
      });
      
      console.log('スケジュールマージ完了', {
        mergedScheduleSize: merged.size,
        dates: Array.from(merged.keys())
      });
      
      setMergedSchedule(merged);
    }
  }, [todoSchedule, externalSchedule, isClient]);

  // googleEventsが更新されたときにローカルストレージに保存
  useEffect(() => {
    if (isClient && googleEvents.length > 0) {
      try {
        // 外部カレンダー予定をJSON文字列に変換してローカルストレージに保存
        localStorage.setItem(STORAGE_KEY_GOOGLE_EVENTS, JSON.stringify(googleEvents));
        console.log('外部予定をローカルストレージに保存しました:', googleEvents.length, '件');
      } catch (error) {
        console.error('外部予定の保存に失敗しました', error);
      }
    }
  }, [googleEvents, isClient]);
  
  // isGoogleIntegratedの状態が変更されたときにローカルストレージに保存
  useEffect(() => {
    if (isClient) {
      // Googleカレンダー連携状態をローカルストレージに保存
      localStorage.setItem(STORAGE_KEY_GOOGLE_INTEGRATED, isGoogleIntegrated.toString());
      console.log('Googleカレンダー連携状態を保存:', isGoogleIntegrated ? '連携済み' : '未連携');
    }
  }, [isGoogleIntegrated, isClient]);

  // Googleカレンダーの予定をexternalScheduleに反映
  useEffect(() => {
    if (isClient && googleEvents.length > 0) {
      console.log('Googleカレンダー予定をスケジュールに反映します', { 
        googleEvents: googleEvents.length
      });
      
      // 外部予定専用のスケジュールMapを作成
      const newExternalSchedule = new Map<string, TodoWithMeta[]>();
      
      // Googleカレンダーのイベントを日付ごとに分類
      googleEvents.forEach(event => {
        const dateKey = format(event.todo.startDate, 'yyyy-MM-dd');
        const existingEvents = newExternalSchedule.get(dateKey) || [];
        newExternalSchedule.set(dateKey, [...existingEvents, event]);
      });
      
      console.log('外部予定スケジュールを更新しました', {
        externalEvents: googleEvents.length,
        dates: Array.from(newExternalSchedule.keys())
      });
      
      setExternalSchedule(newExternalSchedule);
    }
  }, [isClient, googleEvents]);

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
  const handleCreateTodo = () => {
    if (!newTodoText.trim() || !newTodoTaskId || !newTodoDate) {
      console.log('ScheduleCalendar - handleCreateTodo: 必要なデータが不足', {
        newTodoText: newTodoText.trim(),
        newTodoTaskId,
        newTodoDate
      });
      return;
    }

    const selectedTask = tasks.find(task => task.id === newTodoTaskId);
    if (!selectedTask) {
      console.log('ScheduleCalendar - handleCreateTodo: タスクが見つからない', { taskId: newTodoTaskId });
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

    // 現在のユーザーIDを自動的に割り当て
    const currentUserId = user?.id || '';

    // プロジェクトメンバーからユーザーIDに対応するメンバーIDを取得
    let assigneeId = '';
    if (currentUserId && currentProject) {
      const currentProjectMembers = getProjectMembers(currentProject.id);
      const projectMember = currentProjectMembers.find(member => member.userId === currentUserId);
      assigneeId = projectMember ? projectMember.id : '';
    }

    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: newTodoText.trim(),
      completed: false,
      startDate: new Date(newTodoDate),
      calendarStartDateTime,
      calendarEndDateTime,
      estimatedHours,
      actualHours: 0,
      assigneeId: assigneeId // 自動的に現在のユーザーを割り当て
    };

    console.log('ScheduleCalendar - handleCreateTodo: 新しいTODOを作成', {
      todoId: newTodo.id,
      taskId: selectedTask.id,
      date: newTodoDate,
      estimatedHours: newTodoEstimatedHours,
      todo: newTodo
    });

    // 既存のタスクに新しいTODOを追加
    const updatedTask: Task = {
      ...selectedTask,
      todos: [...selectedTask.todos, newTodo]
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
    }
  };

  // イベントをキャンセル
  const handleCancel = () => {
    setIsCreatingTodo(false);
    setNewTodoText('');
    setNewTodoTaskId(null);
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
        isGoogleIntegrated={isGoogleIntegrated}
        onGoogleIntegrationChange={() => {
          setIsGoogleIntegrated(true);
          // モック：Googleカレンダーからの予定を生成
          if (googleEvents.length === 0) {
            // 現在のユーザーIDを取得
            const currentUserId = user?.id || '';

            // プロジェクトメンバーからユーザーIDに対応するメンバーIDを取得
            let assigneeId = '';
            if (currentUserId && currentProject) {
              const currentProjectMembers = getProjectMembers(currentProject.id);
              const projectMember = currentProjectMembers.find(member => member.userId === currentUserId);
              assigneeId = projectMember ? projectMember.id : '';
            }
            
            const mockGoogleEvents: TodoWithMeta[] = [
              {
                todo: {
                  id: `google-event-1`,
                  text: 'チームMTG',
                  completed: false,
                  startDate: new Date(),
                  calendarStartDateTime: new Date(new Date().setHours(10, 0, 0, 0)),
                  calendarEndDateTime: new Date(new Date().setHours(11, 0, 0, 0)),
                  estimatedHours: 1,
                  actualHours: 0,
                  assigneeId: assigneeId // 現在のユーザーを割り当て
                },
                taskId: 'google-calendar',
                taskTitle: 'Googleカレンダー',
                isExternal: true
              },
              {
                todo: {
                  id: `google-event-2`,
                  text: 'プロジェクト打ち合わせ',
                  completed: false,
                  startDate: addDays(new Date(), 1),
                  calendarStartDateTime: new Date(addDays(new Date(), 1).setHours(14, 0, 0, 0)),
                  calendarEndDateTime: new Date(addDays(new Date(), 1).setHours(15, 30, 0, 0)),
                  estimatedHours: 1.5,
                  actualHours: 0,
                  assigneeId: assigneeId // 現在のユーザーを割り当て
                },
                taskId: 'google-calendar',
                taskTitle: 'Googleカレンダー',
                isExternal: true
              },
              {
                todo: {
                  id: `google-event-3`,
                  text: 'リリース会議',
                  completed: false,
                  startDate: addDays(new Date(), 2),
                  calendarStartDateTime: new Date(addDays(new Date(), 2).setHours(13, 0, 0, 0)),
                  calendarEndDateTime: new Date(addDays(new Date(), 2).setHours(14, 0, 0, 0)),
                  estimatedHours: 1,
                  actualHours: 0,
                  assigneeId: assigneeId // 現在のユーザーを割り当て
                },
                taskId: 'google-calendar',
                taskTitle: 'Googleカレンダー',
                isExternal: true
              }
            ];
            
            setGoogleEvents(mockGoogleEvents);
            console.log('Googleカレンダーの予定を生成しました', mockGoogleEvents);
          }
        }}
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
            todoSchedule={mergedSchedule}
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
              onCancelCreateTodo={handleCancel}
              onCreateTodo={handleCreateTodo}
              todoSchedule={mergedSchedule}
            />
          </div>
        )}
        {viewMode === 'month' && (
          <MonthView 
            currentDate={currentDate}
            showWeekend={showWeekend}
            monthCalendarDays={monthCalendarDays}
            todoSchedule={mergedSchedule}
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
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                キャンセル
              </button>
              <button
                onClick={handleCreateTodo}
                disabled={!newTodoText.trim() || !newTodoTaskId}
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