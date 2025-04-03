import React, { useEffect, useRef, useState } from 'react';
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
  const formRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({
    top: top + height,
    isTopPositioned: false
  });

  // フォームの位置を計算する関数
  const calculatePosition = () => {
    if (!formRef.current) return;

    const formElement = formRef.current;
    const formRect = formElement.getBoundingClientRect();
    const parentRect = formElement.parentElement?.getBoundingClientRect() || { bottom: 0, top: 0 };
    const windowHeight = window.innerHeight;
    
    // 初期位置はTODOアイテムの下
    let newTop = top + height;
    let isTopPositioned = false;
    
    // 14:00以降のTODOかチェック（時間で判断する場合）
    const [startHour] = editingTodo.startTime.split(':').map(Number);
    if (startHour >= 14) {
      // 14:00以降は上に表示
      isTopPositioned = true;
    }
    
    // フォームが下はみ出し検出
    if (parentRect.top + newTop + formRect.height > windowHeight) {
      // 下に収まらない場合は上に表示
      isTopPositioned = true;
    }
    
    // 位置を更新
    if (isTopPositioned) {
      newTop = Math.max(0, top - formRect.height); // 上に表示する場合、より上方向に表示（20pxに増加）
    } else {
      newTop = top + height + 8;
    }

    setPosition({
      top: newTop,
      isTopPositioned
    });
  };

  // マウント時とリサイズ時に位置を計算
  useEffect(() => {
    // 初回レンダリング後に位置を計算（レンダリング完了後に実行）
    const timer = setTimeout(() => {
      calculatePosition();
    }, 0);

    // ウィンドウリサイズ時にも位置を再計算
    const handleResize = () => calculatePosition();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [top, height, editingTodo.todo.id, editingTodo.startTime]); // startTimeが変わった時にも再計算

  // 位置に応じたクラス名を計算
  const getFormClassName = () => {
    // isTopPositionedは「TODOの上にフォームを表示するか」という意味
    return position.isTopPositioned ? 'todo-edit-form above-todo' : 'todo-edit-form below-todo';
  };

  return (
    <TimeEditForm
      ref={formRef}
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: '4px', // 常に左側に表示
        right: '4px',
        zIndex: 1000
      }}
      className={getFormClassName()}
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