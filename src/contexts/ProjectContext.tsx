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
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: ReactNode }) {
  // JSONデータをProject型として扱う
  const [projects, setProjects] = useState<Project[]>(projectsData as Project[])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)

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

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        setCurrentProject,
        switchProject,
        updateProject
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