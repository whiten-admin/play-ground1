import React from 'react';
import { TodoWithMeta } from '../types/schedule';
import { TodoItem } from '../styles/scheduleStyles';
import { calculateTodoPosition } from '../utils/todoDisplayUtils';
import TodoEditForm from './TodoEditForm';
import { EditingTodo } from '../hooks/useScheduleView';

interface TodoItemComponentProps {
  todoWithMeta: TodoWithMeta;
  selectedTodoId?: string | null;
  quarterHeight: number;
  editingTodo: EditingTodo | null;
  onTodoClick: (todo: TodoWithMeta) => void;
  onStartTimeChange: (newStartTime: string) => void;
  onEndTimeChange: (newEndTime: string) => void;
  onCancelEdit: () => void;
  onUpdateTime: () => void;
}

const TodoItemComponent: React.FC<TodoItemComponentProps> = ({
  todoWithMeta,
  selectedTodoId,
  quarterHeight,
  editingTodo,
  onTodoClick,
  onStartTimeChange,
  onEndTimeChange,
  onCancelEdit,
  onUpdateTime
}) => {
  const { todo, isNextTodo, priority } = todoWithMeta;
  
  if (!todo.calendarStartDateTime || !todo.calendarEndDateTime) return null;
  
  const { top, height } = calculateTodoPosition(todoWithMeta, quarterHeight);
  const isEditing = editingTodo?.todo.id === todo.id;
  
  const startDateTime = new Date(todo.calendarStartDateTime);
  const endDateTime = new Date(todo.calendarEndDateTime);
  
  return (
    <React.Fragment>
      <TodoItem
        className="todo-item"
        top={top}
        height={height}
        isSelected={selectedTodoId === todo.id}
        isCompleted={todo.completed}
        isNextTodo={isNextTodo}
        priority={priority || 0}
        onClick={(e) => {
          e.stopPropagation();
          onTodoClick(todoWithMeta);
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {`${startDateTime.getHours().toString().padStart(2, '0')}:${startDateTime
            .getMinutes()
            .toString()
            .padStart(2, '0')} - ${endDateTime
            .getHours()
            .toString()
            .padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`}
        </div>
        <div style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {todo.text}
        </div>
      </TodoItem>
      
      {isEditing && editingTodo && (
        <TodoEditForm
          editingTodo={editingTodo}
          top={top}
          height={height}
          onStartTimeChange={onStartTimeChange}
          onEndTimeChange={onEndTimeChange}
          onCancel={onCancelEdit}
          onUpdate={onUpdateTime}
        />
      )}
    </React.Fragment>
  );
};

export default TodoItemComponent; 