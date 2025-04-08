export interface AITaskSuggestion {
  id: string;
  title: string;
  description: string;
  reason: string;
  todos?: AITodoSuggestion[];
  totalEstimatedHours?: number;
  showTodos?: boolean;
}

export interface AITodoSuggestion {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
} 