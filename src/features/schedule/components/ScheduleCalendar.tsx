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
    // 全タスクのTODOを日付でグループ化
    const todosByDate = new Map<string, TodoWithMeta[]>()
    const today = format(new Date(), 'yyyy-MM-dd')
    const todayDate = startOfDay(new Date())
    
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
    
    // すべてのTODOを一度に処理し、適切な日付に配置
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
        let dateKey: string = format(todo.startDate, 'yyyy-MM-dd')
        
        // 該当日付のリストがなければ作成
        if (!todosByDate.has(dateKey)) {
          todosByDate.set(dateKey, [])
        }
        
        // 表示用の見積もり時間を調整（最大8時間とする）
        const displayEstimatedHours = Math.min(todo.estimatedHours, BUSINESS_HOURS.MAX_HOURS)
        
        // TODOを追加
        todosByDate.get(dateKey)?.push({
          todo: {
            ...todo,
            startTime: todo.calendarStartDateTime ? todo.calendarStartDateTime.getHours() : BUSINESS_HOURS.START_HOUR, // 着手予定日の時間または9時をデフォルト設定
            // 見積もり工数は最大8時間に制限
            estimatedHours: displayEstimatedHours,
            originalEstimatedHours: todo.estimatedHours, // 元の見積もり時間を保持
            dueDate: task.dueDate, // 表示用にタスクの期日を追加
          },
          taskId: task.id,
          taskTitle: task.title,
          priority: 0, // 優先度はデフォルト値を使用
          isNextTodo: false // NEXTTODOフラグの初期値
        })
      })
    })

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
        // 各タスクの期日を取得するため、元のタスクを検索
        const taskA = tasks.find(t => t.id === a.taskId);
        const taskB = tasks.find(t => t.id === b.taskId);
        const aDueDate = taskA?.dueDate || new Date();
        const bDueDate = taskB?.dueDate || new Date();
        // 型チェックを追加（Date型であることを確認）
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
        // タスクの期日を使用
        const aDueDate = a.todo.dueDate || new Date();
        const bDueDate = b.todo.dueDate || new Date();
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

    // 今日以外の日付の場合のスケジュール調整（カレンダー開始時間があればその時間を尊重）
    todosByDate.forEach((todos, dateKey) => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const isTodayDate = dateKey === todayStr;
      
      if (!isTodayDate) {
        todos.forEach((todoWithMeta) => {
          const { todo } = todoWithMeta;
          // 既に開始時間が設定されている場合はそれを使用
          if (todo.calendarStartDateTime) {
            const plannedHour = todo.calendarStartDateTime.getHours();
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