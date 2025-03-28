'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Project } from '@/types/project'
import projectsData from '@/data/projects.json'

interface ProjectContextType {
  projects: Project[]
  currentProject: Project | null
  setCurrentProject: (project: Project) => void
  switchProject: (projectId: string) => void
  updateProject: (updatedProject: Project) => void
  createProject: (newProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void
  clearAllProjects: () => void
  resetToDefaultProjects: () => void
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

// デフォルトプロジェクトデータ
const defaultProjects = projectsData as Project[]

export function ProjectProvider({ children }: { children: ReactNode }) {
  // JSONデータをProject型として扱う
  const [projects, setProjects] = useState<Project[]>(defaultProjects)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)

  // プロジェクトが空の場合の処理
  useEffect(() => {
    if (projects.length === 0) {
      // デフォルトプロジェクトを復元するか新しいプロジェクトを作成する
      // 自動作成はせず、ユーザーの操作を待つ
      setCurrentProject(null)
      localStorage.removeItem('currentProjectId')
    }
  }, [projects])

  // 初期化時に最初のプロジェクトを選択
  useEffect(() => {
    if (projects.length > 0 && !currentProject) {
      // ローカルストレージから前回選択したプロジェクトIDを取得
      const savedProjectId = localStorage.getItem('currentProjectId')
      const initialProject = savedProjectId 
        ? projects.find(p => p.id === savedProjectId) || projects[0]
        : projects[0]
        
      setCurrentProject(initialProject)
    }
  }, [projects, currentProject])

  // プロジェクト切り替え
  const switchProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      setCurrentProject(project)
      // 選択したプロジェクトIDをローカルストレージに保存
      localStorage.setItem('currentProjectId', projectId)
    }
  }

  // プロジェクト更新
  const updateProject = (updatedProject: Project) => {
    setProjects(prev => 
      prev.map(project => 
        project.id === updatedProject.id ? updatedProject : project
      )
    )
    
    // 現在のプロジェクトが更新された場合、currentProjectも更新
    if (currentProject?.id === updatedProject.id) {
      setCurrentProject(updatedProject)
    }
  }

  // プロジェクト作成
  const createProject = (newProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const generatedId = `project-${Date.now()}`
    
    const project: Project = {
      id: generatedId,
      ...newProject,
      createdAt: now,
      updatedAt: now
    }
    
    setProjects(prev => [...prev, project])
    setCurrentProject(project)
    localStorage.setItem('currentProjectId', generatedId)
  }

  // すべてのプロジェクトをクリア
  const clearAllProjects = () => {
    setProjects([])
    setCurrentProject(null)
    localStorage.removeItem('currentProjectId')
  }
  
  // デフォルトプロジェクトデータにリセット
  const resetToDefaultProjects = () => {
    setProjects(defaultProjects)
    if (defaultProjects.length > 0) {
      setCurrentProject(defaultProjects[0])
      localStorage.setItem('currentProjectId', defaultProjects[0].id)
    }
  }

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        setCurrentProject,
        switchProject,
        updateProject,
        createProject,
        clearAllProjects,
        resetToDefaultProjects
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjectContext() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider')
  }
  return context
} 