import styled from 'styled-components';

export interface StyledTodoItemProps {
  className?: string;
}

export const TodoItem = styled.div<StyledTodoItemProps>`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2px 4px;
  overflow: hidden;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  font-size: 12px;
  transition: all 0.2s ease-in-out;
  
  &:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

export const ResizeHandle = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6px;
  cursor: ns-resize;
  background-color: transparent;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
  
  &:after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: 2px;
    width: 20px;
    height: 2px;
    background-color: #cbd5e0;
    transform: translateX(-50%);
    border-radius: 1px;
  }
`; 