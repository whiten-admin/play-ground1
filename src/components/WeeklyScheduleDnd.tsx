'use client'

import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Task } from '@/types/task'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

interface WeeklyScheduleDndProps {
  weekDays: Date[]
  timeSlots: number[]
  tasks: Task[]
  onTaskSelect: (taskId: string) => void
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

    tasks.forEach(task => {
      task.todos.forEach(todo => {
        const dateKey = format(todo.dueDate, 'yyyy-MM-dd')
        if (!todosByDate.has(dateKey)) {
          todosByDate.set(dateKey, [])
        }
        const todoHour = todo.dueDate.getHours()
        todosByDate.get(dateKey)?.push({
          todo: {
            ...todo,
            startTime: todoHour >= 9 && todoHour <= 17 ? todoHour : 9 // 営業時間内の場合はその時間、それ以外は9時をデフォルトに
          },
          taskId: task.id,
          taskTitle: task.title
        })
      })
    })

    // 各日付のTODOを時間で並べ替え
    todosByDate.forEach((todos) => {
      todos.sort((a, b) => {
        const timeA = a.todo.startTime || 9
        const timeB = b.todo.startTime || 9
        if (timeA === timeB) {
          // 同じ時間の場合は推定時間の短い順
          return a.todo.estimatedHours - b.todo.estimatedHours
        }
        return timeA - timeB
      })
    })

    return todosByDate
  }

  // ドラッグ終了時の処理
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const { draggableId, source, destination } = result
    const [todoId, taskId] = draggableId.split('-')
    const [day, hour] = destination.droppableId.split('-')

    try {
      // 新しい日時を計算
      const newDate = new Date(day)
      newDate.setHours(parseInt(hour), 0, 0, 0)

      // 親コンポーネントに更新を通知
      onTodoUpdate(todoId, taskId, newDate)

      // ローカルの状態も更新
      setTodos(prevTodos => {
        const newTodos = new Map(prevTodos)
        const [sourceDay] = source.droppableId.split('-')
        const sourceDateKey = sourceDay
        const destinationDateKey = day

        // 移動元からTODOを削除
        const sourceTodos = newTodos.get(sourceDateKey) || []
        const todoToMove = sourceTodos.find(t => t.todo.id === todoId)
        
        if (todoToMove) {
          // 移動元から削除
          newTodos.set(
            sourceDateKey,
            sourceTodos.filter(t => t.todo.id !== todoId)
          )

          // 移動先のTODOを取得
          const destinationTodos = newTodos.get(destinationDateKey) || []
          
          // 更新されたTODOを作成
          const updatedTodo = {
            ...todoToMove,
            todo: {
              ...todoToMove.todo,
              dueDate: newDate,
              startTime: parseInt(hour)
            }
          }

          // 移動先に追加（同じ日付の場合は既存のものを削除）
          newTodos.set(
            destinationDateKey,
            [...destinationTodos.filter(t => t.todo.id !== todoId), updatedTodo]
          )
        }

        return newTodos
      })
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }

  if (!mounted) {
    return (
      <div className="relative">
        {timeSlots.map((hour) => (
          <div key={hour} className="grid grid-cols-8">
            <div className="h-16 text-xs text-right pr-2 pt-1 text-gray-500">
              {`${hour}:00`}
            </div>
            {weekDays.map((_, dayIndex) => (
              <div
                key={dayIndex}
                className="h-16 border-t border-l relative"
              />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="relative">
        {timeSlots.map((hour) => (
          <div key={hour} className="grid grid-cols-8">
            <div className="h-16 text-xs text-right pr-2 pt-1 text-gray-500">
              {`${hour}:00`}
            </div>
            {weekDays.map((day, dayIndex) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const todosForDay = todos.get(dateKey) || []
              const todosForHour = todosForDay.filter(
                ({ todo }) => (todo.startTime || 9) === hour
              )

              return (
                <Droppable
                  key={`${format(day, 'yyyy-MM-dd')}-${hour}`}
                  droppableId={`${format(day, 'yyyy-MM-dd')}-${hour}`}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`h-16 border-t border-l relative ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : ''
                      }`}
                    >
                      {todosForHour.map(({ todo, taskId, taskTitle }, index) => (
                        <Draggable
                          key={`${todo.id}-${taskId}`}
                          draggableId={`${todo.id}-${taskId}`}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={(e) => {
                                e.stopPropagation()
                                onTaskSelect(taskId)
                              }}
                              style={{
                                ...provided.draggableProps.style,
                                height: `${todo.estimatedHours * 64}px`,
                                width: 'calc(100% - 4px)',
                                position: 'absolute',
                                top: 0,
                                left: 2,
                                zIndex: snapshot.isDragging ? 100 : 1,
                              }}
                              className={`${
                                todo.completed ? 'bg-green-100' : 'bg-blue-100'
                              } ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              } rounded p-1 cursor-pointer hover:shadow-md transition-shadow overflow-hidden`}
                            >
                              <div className="text-xs font-medium truncate">{todo.text}</div>
                              <div className="text-xs text-gray-500 truncate">{taskTitle}</div>
                              <div className="text-xs text-gray-500">{todo.estimatedHours}h</div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )
            })}
          </div>
        ))}
      </div>
    </DragDropContext>
  )
} 