import React from 'react';
import { TodoWithMeta } from '../types/schedule';
import { TodoContainer } from '../styles/scheduleStyles';
import TodoItemComponent from './TodoItemComponent';
import { EditingTodo } from '../hooks/useScheduleView';

interface TodoGroupProps {
  todoGroups: TodoWithMeta[][];
  selectedTodoId?: string | null;
  quarterHeight: number;
  editingTodo: EditingTodo | null;
  onTodoClick: (todo: TodoWithMeta) => void;
  onStartTimeChange: (newStartTime: string) => void;
  onEndTimeChange: (newEndTime: string) => void;
  onCancelEdit: () => void;
  onUpdateTime: () => void;
}

const TodoGroup: React.FC<TodoGroupProps> = ({
  todoGroups,
  selectedTodoId,
  quarterHeight,
  editingTodo,
  onTodoClick,
  onStartTimeChange,
  onEndTimeChange,
  onCancelEdit,
  onUpdateTime
}) => {
  return (
    <TodoContainer>
      {todoGroups.map((group, groupIndex) => (
        <div
          key={groupIndex}
          style={{
            flex: 1,
            position: 'relative',
            height: '100%',
            minWidth: `${100 / todoGroups.length}%`,
            maxWidth: `${100 / todoGroups.length}%`,
          }}
        >
          {group.map(todoWithMeta => (
            <TodoItemComponent
              key={todoWithMeta.todo.id}
              todoWithMeta={todoWithMeta}
              selectedTodoId={selectedTodoId}
              quarterHeight={quarterHeight}
              editingTodo={editingTodo}
              onTodoClick={onTodoClick}
              onStartTimeChange={onStartTimeChange}
              onEndTimeChange={onEndTimeChange}
              onCancelEdit={onCancelEdit}
              onUpdateTime={onUpdateTime}
            />
          ))}
        </div>
      ))}
    </TodoContainer>
  );
};

export default TodoGroup; 