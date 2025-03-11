export interface Project {
  id: string
  title: string
  code?: string
  description?: string
  purpose?: string
  startDate?: string
  endDate?: string
  methodology?: 'waterfall' | 'agile' | 'hybrid'
  phase?: 'planning' | 'requirements' | 'design' | 'development' | 'testing' | 'deployment' | 'maintenance'
  scale?: number
  budget?: number
  client?: string
  projectManager?: string
  risks?: string
  createdAt: string
  updatedAt: string
} 