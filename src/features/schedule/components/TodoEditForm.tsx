import React from 'react';
import { TimeEditForm } from '../styles/scheduleStyles';
import { generateTimeOptions } from '../utils/todoDisplayUtils';
import { EditingTodo } from '../hooks/useScheduleView';

interface TodoEditFormProps {
  editingTodo: EditingTodo;
  top: number;
  height: number;
  onStartTimeChange: (newStartTime: string) => void;
  onEndTimeChange: (newEndTime: string) => void;
  onCancel: () => void;
  onUpdate: () => void;
}

const TodoEditForm: React.FC<TodoEditFormProps> = ({
  editingTodo,
  top,
  height,
  onStartTimeChange,
  onEndTimeChange,
  onCancel,
  onUpdate
}) => {
  return (
    <TimeEditForm
      style={{
        position: 'absolute',
        top: `${top + height}px`,
        left: '100%',
        marginLeft: '8px',
        zIndex: 1000
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <div 
        className="text-sm font-medium mb-2 pb-2 border-b border-gray-200" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          wordBreak: 'break-word', 
          maxHeight: '60px', 
          overflowY: 'auto' 
        }}
      >
        {editingTodo.todo.text}
      </div>
      <div className="flex gap-2 items-center mb-2" onClick={(e) => e.stopPropagation()}>
        <select
          value={editingTodo.startTime}
          onChange={(e) => {
            e.stopPropagation();
            onStartTimeChange(e.target.value);
          }}
          className="text-sm p-1 border rounded"
        >
          {generateTimeOptions().map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
        <span className="text-sm">-</span>
        <select
          value={editingTodo.endTime}
          onChange={(e) => {
            e.stopPropagation();
            onEndTimeChange(e.target.value);
          }}
          className="text-sm p-1 border rounded"
        >
          {generateTimeOptions().map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="text-sm px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
        >
          キャンセル
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUpdate();
          }}
          className="text-sm px-2 py-1 bg-blue-500 text-white hover:bg-blue-600 rounded"
        >
          更新
        </button>
      </div>
    </TimeEditForm>
  );
};

export default TodoEditForm; 