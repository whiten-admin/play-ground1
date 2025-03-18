'use client'

import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Task } from '@/types/task'
import { BUSINESS_HOURS } from '@/utils/constants'

interface WeeklyScheduleDndProps {
  weekDays: Date[]
  timeSlots: number[]
  tasks: Task[]
  onTaskSelect: (taskId: string) => void
  onTodoUpdate?: (todoId: string, taskId: string, newDate: Date, isPlannedDate?: boolean) => void
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
    plannedEndDate?: Date
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
}: WeeklyScheduleDndProps) {
  const [mounted, setMounted] = useState(false)
  const [todos, setTodos] = useState<Map<string, TodoWithMeta[]>>(new Map())

  // tasksが変更されたときにtodosを再計算
  useEffect(() => {
    const initialTodos = scheduleTodos()
    setTodos(initialTodos)
  }, [tasks])

  // マウント状態の管理
  useEffect(() => {
    setMounted(true)
  }, [])

  // TODOをカレンダーに配置するための処理
  const scheduleTodos = () => {
    // 全タスクのTODOを日付でグループ化
    const todosByDate = new Map<string, TodoWithMeta[]>()
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    // まず、WeeklySchedule.tsxと同様のロジックですべてのTODOを適切な日付に配置
    tasks.forEach(task => {
      task.todos.forEach(todo => {
        // 該当する日付を決定
        let dateKey: string;
        let scheduleDate: Date;
        
        if (todo.plannedStartDate) {
          // 着手予定日が設定されている場合はそれを使用
          dateKey = format(todo.plannedStartDate, 'yyyy-MM-dd');
          scheduleDate = new Date(todo.plannedStartDate);
        } else {
          // 期日が今日または過去の場合は今日に配置
          const dueDate = new Date(todo.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          if (dueDate.getTime() <= todayDate.getTime()) {
            dateKey = today;
            scheduleDate = new Date(todayDate);
          } else {
            // それ以外は期日に配置
            dateKey = format(todo.dueDate, 'yyyy-MM-dd');
            scheduleDate = new Date(todo.dueDate);
          }
        }
        
        if (!todosByDate.has(dateKey)) {
          todosByDate.set(dateKey, [])
        }
        
        // デフォルトの開始時間は営業開始時間
        const defaultStartTime = BUSINESS_HOURS.START_HOUR;
        
        // 表示用の見積もり時間を調整（最大時間に制限）
        const displayEstimatedHours = Math.min(todo.estimatedHours, BUSINESS_HOURS.MAX_HOURS);
        
        // 開始時間の決定
        let startTime = defaultStartTime;
        
        // plannedStartDateが設定されている場合はその時間を使用
        if (todo.plannedStartDate) {
          const plannedHour = todo.plannedStartDate.getHours();
          // 営業時間内の場合のみその時間を使用
          if (plannedHour >= BUSINESS_HOURS.START_HOUR && plannedHour <= BUSINESS_HOURS.END_HOUR - 1) {
            startTime = plannedHour;
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
          priority: task.priority || 0,
          isNextTodo: false
        })
      })
    })

    // 各日付のTODOを時間と優先度で並べ替え
    todosByDate.forEach((todos, dateKey) => {
      // 今日の日付かどうかチェック
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const isTodayDate = dateKey === todayStr;
      
      // TODOをソート（優先度、完了状態）
      todos.sort((a, b) => {
        // 1. 完了状態でソート（未完了が上、完了が下）
        if (a.todo.completed !== b.todo.completed) {
          return a.todo.completed ? 1 : -1;
        }
        
        // 2. 期日でソート（TodayTodo.tsxと同じ並び順にする）
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
      
      // 今日のTODOの場合は営業開始時間から詰めて配置する
      if (isTodayDate) {
        let currentHour = BUSINESS_HOURS.START_HOUR;
        todos.forEach((todoWithMeta) => {
          const { todo } = todoWithMeta;
          
          // 開始時間を割り当て
          todo.startTime = currentHour;
          
          // 次のTODOの開始時間を計算（最大営業終了時間まで）
          currentHour = Math.min(BUSINESS_HOURS.END_HOUR, currentHour + todo.estimatedHours);
        });
      }
    });

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
                className="h-12 border-t border-l relative"
              >
                {todosForHour.map(({ todo, taskId, taskTitle, priority, isNextTodo }) => (
                  <div
                    key={`${todo.id}-${taskId}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onTaskSelect(taskId)
                    }}
                    style={{
                      height: `${todo.estimatedHours * 48}px`,
                      width: 'calc(100% - 2px)',
                      position: 'absolute',
                      top: 0,
                      left: 1,
                    }}
                    className={`${
                      todo.completed ? 'bg-gray-100' : 
                      (format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && 
                       isNextTodo) ? 'bg-amber-100' :
                      priority === 2 ? 'bg-red-100' : 
                      priority === 1 ? 'bg-orange-100' : 'bg-blue-100'
                    } rounded p-1 cursor-pointer hover:shadow-md transition-shadow overflow-hidden`}
                  >
                    <div className="text-xs font-medium truncate">{todo.text}</div>
                    <div className="text-xs text-gray-500 truncate">{taskTitle}</div>
                    <div className="text-xs text-gray-500">{Math.round((todo.originalEstimatedHours || todo.estimatedHours) * 10) / 10}h</div>
                    {priority === 2 && !todo.completed && (
                      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" title="高優先度" />
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
} 