import styled from '@emotion/styled';

export interface StyledTodoItemProps {
  top: number;
  height: number;
  isSelected: boolean;
  isCompleted: boolean;
  isNextTodo: boolean;
  priority: number;
  isDragging?: boolean;
  isResizing?: boolean;
  isMovingToNewDay?: boolean;
}

export const TodoItem = styled.div<StyledTodoItemProps>`
  position: absolute;
  left: 0;
  right: 0;
  top: ${(props: StyledTodoItemProps) => props.top}px;
  height: ${(props: StyledTodoItemProps) => props.height}px;
  padding: 3px 4px;
  border-radius: 4px;
  cursor: ${(props: StyledTodoItemProps) => props.isDragging ? 'move' : 'pointer'};
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  background-color: ${(props: StyledTodoItemProps) =>
    props.isCompleted
      ? '#e0e0e0'
      : props.isNextTodo
      ? '#e3f2fd'
      : props.priority === 2
      ? '#fff3e0'
      : props.priority === 1
      ? '#f3e5f5'
      : '#f5f5f5'};
  border: ${(props: StyledTodoItemProps) =>
    props.isSelected
      ? '2px solid #1976d2'
      : props.isMovingToNewDay
      ? '2px dashed #4caf50'
      : props.isResizing
      ? '2px dashed #ff9800'
      : props.isCompleted
      ? '1px solid #9e9e9e'
      : props.isNextTodo
      ? '1px solid #2196f3'
      : props.priority === 2
      ? '1px solid #ff9800'
      : props.priority === 1
      ? '1px solid #9c27b0'
      : '1px solid #bdbdbd'};
  opacity: ${(props: StyledTodoItemProps) => (props.isCompleted ? 0.7 : 1)};
  z-index: ${(props: StyledTodoItemProps) => 
    (props.isSelected || props.isDragging || props.isResizing ? 2 : 1)};
  pointer-events: auto;
  box-sizing: border-box;
  margin: 0 1px;
  box-shadow: ${(props: StyledTodoItemProps) => 
    (props.isDragging || props.isResizing) ? '0 3px 8px rgba(0, 0, 0, 0.2)' : 'none'};
  transition: ${(props: StyledTodoItemProps) => 
    (props.isResizing || props.isDragging ? 'none' : 'height 0.1s ease, box-shadow 0.1s ease')};
  touch-action: none;
  
  &:hover {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .detail-icon {
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }
  
  &:hover .detail-icon {
    opacity: 1;
  }
`;

export const TodoContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  gap: 0;
  height: 100%;
  pointer-events: none;
  width: 100%;
`;

export const TimeEditForm = styled.div`
  position: absolute;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  width: calc(100% - 8px);
  pointer-events: auto;
  animation: fadeIn 0.2s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  &::before {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    background: white;
    border-left: 1px solid #e0e0e0;
    border-top: 1px solid #e0e0e0;
    left: 20px;
  }
  
  &.below-todo::before {
    top: -6px;
    transform: rotate(45deg);
  }
  
  &.above-todo::before {
    bottom: -6px;
    transform: rotate(-135deg);
  }
  
  select {
    flex: 1;
    min-width: 0;
  }
  
  @media (max-width: 600px) {
    padding: 6px;
    font-size: 0.85rem;
    
    select {
      padding: 2px;
    }
    
    button {
      padding: 2px 4px;
      font-size: 0.8rem;
    }
  }
`;

export const ResizeHandle = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6px;
  background-color: transparent;
  cursor: ns-resize;
  border-radius: 0 0 4px 4px;
  &::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 2px;
    transform: translateX(-50%);
    width: 20px;
    height: 2px;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 1px;
  }
  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
    &::after {
      background-color: rgba(0, 0, 0, 0.3);
    }
  }
  &:active {
    background-color: rgba(0, 0, 0, 0.2);
    &::after {
      background-color: rgba(0, 0, 0, 0.5);
    }
  }
`;