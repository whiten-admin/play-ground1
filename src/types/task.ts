export interface Todo {
  id: string
  text: string
  completed: boolean
  dueDate: Date
  estimatedHours: number // 見積もり工数（時間単位）
}

export interface Task {
  id: string
  title: string
  description: string
  todos: Todo[]
  isNew?: boolean
} 