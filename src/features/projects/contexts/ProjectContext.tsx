'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Project } from '@/features/projects/types/project'
import { ProjectMember, ProjectMemberRole } from '@/features/projects/types/projectMember'
import { User } from '@/features/tasks/types/user'
import projectsData from '@/features/projects/data/projects.json'
import projectMembersData from '@/features/projects/data/projectMembers.json'
import { getProjectMembers as getProjectMembersUtil, getProjectUsers as getProjectUsersUtil } from '@/utils/memberUtils'
import { useAuth } from '@/services/auth/hooks/useAuth'

interface ProjectContextType {
  projects: Project[]
  filteredProjects: Project[] // ユーザーがアサインされているプロジェクトのみ
  currentProject: Project | null
  setCurrentProject: (project: Project) => void
  switchProject: (projectId: string) => void
  updateProject: (updatedProject: Project) => void
  createProject: (newProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void
  clearAllProjects: () => void
  resetToDefaultProjects: () => void
  
  // プロジェクトメンバー管理関連
  projectMembers: ProjectMember[]
  assignUserToProject: (projectId: string, userId: string, role: ProjectMemberRole) => void
  removeUserFromProject: (projectId: string, userId: string) => void
  getProjectMembers: (projectId: string) => ProjectMember[]
  getProjectUsers: (projectId: string, userList: User[]) => User[]
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

// デフォルトプロジェクトデータ
const defaultProjects = projectsData as Project[]
// デフォルトプロジェクトメンバーデータ
const defaultProjectMembers = projectMembersData as ProjectMember[]

export function ProjectProvider({ children }: { children: ReactNode }) {
  // Auth情報を取得
  const { user } = useAuth();
  
  // JSONデータをProject型として扱う（初期値はデフォルトデータ）
  const [projects, setProjects] = useState<Project[]>(defaultProjects)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  // プロジェクトメンバーデータを管理
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>(defaultProjectMembers)
  // ユーザーがアサインされているプロジェクトのみをフィルタリング
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])

  // 初期化時にプロジェクトデータをロード
  useEffect(() => {
    console.log("デフォルトのプロジェクトデータ:", defaultProjects);
    
    const savedProjects = localStorage.getItem('projects')
    if (savedProjects) {
      try {
        const parsedProjects = JSON.parse(savedProjects);
        console.log("ローカルストレージから読み込んだプロジェクトデータ:", parsedProjects);
        setProjects(parsedProjects)
      } catch (e) {
        console.error('Failed to parse projects from localStorage', e)
        setProjects(defaultProjects) // デフォルトデータにフォールバック
      }
    } else {
      // ローカルストレージにデータがない場合はデフォルトデータを使用
      console.log("ローカルストレージにプロジェクトデータがないため、デフォルトデータを使用します");
      setProjects(defaultProjects)
    }
  }, [])

  // プロジェクトが変更されたらローカルストレージに保存
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('projects', JSON.stringify(projects))
    }
  }, [projects])

  // ユーザーがアサインされているプロジェクトのみをフィルタリング
  useEffect(() => {
    if (user && user.id) {
      console.log("現在のユーザーID:", user.id);
      console.log("全プロジェクト:", projects);
      console.log("全プロジェクトメンバー:", projectMembers);
      
      // 現在のユーザーIDがアサインされているプロジェクトメンバーを取得
      const userProjectMembers = projectMembers.filter(
        member => member.userId === user.id
      );
      console.log("ユーザーのプロジェクトメンバーデータ:", userProjectMembers);
      
      // ユーザーがアサインされているプロジェクトIDのリスト
      const userProjectIds = userProjectMembers.map(member => member.projectId);
      console.log("ユーザーがアサインされているプロジェクトID:", userProjectIds);
      console.log("プロジェクトIDの型チェック:", userProjectIds.map(id => typeof id));
      
      // ユーザーがアサインされているプロジェクトのみをフィルタリング
      const filtered = projects.filter(project => {
        console.log(`プロジェクト ${project.id} のチェック:`, {
          projectId: project.id,
          projectIdType: typeof project.id,
          isIncluded: userProjectIds.includes(project.id)
        });
        return userProjectIds.includes(project.id);
      });
      console.log("フィルタリング後のプロジェクト:", filtered);
      
      setFilteredProjects(filtered);
    } else {
      // ユーザーがログインしていない場合は空の配列にする
      setFilteredProjects([]);
    }
  }, [projects, projectMembers, user]);

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
    if (filteredProjects.length > 0 && !currentProject) {
      // ローカルストレージから前回選択したプロジェクトIDを取得
      const savedProjectId = localStorage.getItem('currentProjectId')
      
      // 保存されているプロジェクトIDがフィルタリング後のプロジェクトに含まれているか確認
      const initialProject = savedProjectId && filteredProjects.find(p => p.id === savedProjectId)
        ? filteredProjects.find(p => p.id === savedProjectId)
        : filteredProjects[0]
        
      setCurrentProject(initialProject || null)
    } else if (filteredProjects.length === 0) {
      // ユーザーがアサインされているプロジェクトがない場合
      setCurrentProject(null)
    }
  }, [filteredProjects, currentProject])

  // 初期化時にプロジェクトメンバーデータをロード
  useEffect(() => {
    console.log("デフォルトのプロジェクトメンバーデータ:", defaultProjectMembers);
    
    const savedProjectMembers = localStorage.getItem('projectMembers')
    if (savedProjectMembers) {
      try {
        const parsedMembers = JSON.parse(savedProjectMembers);
        console.log("ローカルストレージから読み込んだプロジェクトメンバーデータ:", parsedMembers);
        setProjectMembers(parsedMembers)
      } catch (e) {
        console.error('Failed to parse project members from localStorage', e)
        setProjectMembers(defaultProjectMembers) // デフォルトデータにフォールバック
      }
    } else {
      // ローカルストレージにデータがない場合はデフォルトデータを使用
      console.log("ローカルストレージにデータがないため、デフォルトのプロジェクトメンバーデータを使用します");
      setProjectMembers(defaultProjectMembers)
    }
    
    // プロジェクトデータの確認 (メソッド内に定義されていない場合のための確認)
    const savedProjects = localStorage.getItem('projects');
    if (savedProjects) {
      try {
        const parsedProjects = JSON.parse(savedProjects);
        console.log("ローカルストレージから読み込んだプロジェクトデータ:", parsedProjects);
      } catch (e) {
        console.error('Failed to parse projects from localStorage', e);
      }
    }
  }, [])

  // プロジェクトメンバーデータが変更されたらローカルストレージに保存
  useEffect(() => {
    if (projectMembers.length > 0) {
      localStorage.setItem('projectMembers', JSON.stringify(projectMembers))
    }
  }, [projectMembers])

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
    
    // プロジェクト作成者を自動的にマネージャーとして追加
    if (user && user.id) {
      const newMember: ProjectMember = {
        id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        projectId: generatedId,
        userId: user.id,
        role: 'manager',
        assignedAt: now
      }
      
      setProjectMembers(prev => [...prev, newMember])
    }
    
    setCurrentProject(project)
    localStorage.setItem('currentProjectId', generatedId)
  }

  // すべてのプロジェクトをクリア
  const clearAllProjects = () => {
    setProjects([])
    setCurrentProject(null)
    localStorage.removeItem('currentProjectId')
    
    // プロジェクトメンバーもクリア
    setProjectMembers([])
    localStorage.removeItem('projectMembers')
  }
  
  // デフォルトプロジェクトデータにリセット
  const resetToDefaultProjects = () => {
    console.log("リセット前のプロジェクト:", projects);
    console.log("リセット前のプロジェクトメンバー:", projectMembers);
    
    // ローカルストレージからデータを削除
    localStorage.removeItem('projects');
    localStorage.removeItem('projectMembers');
    localStorage.removeItem('currentProjectId');
    
    // stateをデフォルトに設定
    setProjects(defaultProjects);
    setProjectMembers(defaultProjectMembers);
    
    console.log("リセット後に設定されるデフォルトプロジェクト:", defaultProjects);
    console.log("リセット後に設定されるデフォルトプロジェクトメンバー:", defaultProjectMembers);
    
    if (defaultProjects.length > 0) {
      setCurrentProject(defaultProjects[0]);
    }
  }

  // ユーザーをプロジェクトに割り当てる
  const assignUserToProject = (projectId: string, userId: string, role: ProjectMemberRole) => {
    // すでに同じプロジェクトにアサインされているか確認
    const existingAssignment = projectMembers.find(
      member => member.projectId === projectId && member.userId === userId
    )
    
    if (existingAssignment) {
      // 既存のアサインメントがあれば、ロールだけ更新
      setProjectMembers(prev => 
        prev.map(member => 
          member.projectId === projectId && member.userId === userId
            ? { ...member, role }
            : member
        )
      )
    } else {
      // 新規アサインメント
      const newMember: ProjectMember = {
        id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        projectId,
        userId,
        role,
        assignedAt: new Date().toISOString()
      }
      
      setProjectMembers(prev => [...prev, newMember])
      
      // プロジェクトのmembersフィールドも更新
      const project = projects.find(p => p.id === projectId)
      if (project) {
        const updatedMembers = project.members ? [...project.members, userId] : [userId]
        updateProject({
          ...project,
          members: updatedMembers
        })
      }
    }
  }
  
  // ユーザーをプロジェクトから削除
  const removeUserFromProject = (projectId: string, userId: string) => {
    // メンバーシップから削除
    setProjectMembers(prev => 
      prev.filter(member => !(member.projectId === projectId && member.userId === userId))
    )
    
    // プロジェクトのmembersフィールドからも削除
    const project = projects.find(p => p.id === projectId)
    if (project && project.members) {
      updateProject({
        ...project,
        members: project.members.filter(id => id !== userId)
      })
    }
  }
  
  // プロジェクトに所属するメンバーを取得
  const getProjectMembers = (projectId: string): ProjectMember[] => {
    return getProjectMembersUtil(projectId);
  }
  
  // プロジェクトに所属するユーザーを取得（User情報を含む）
  const getProjectUsers = (projectId: string, userList: User[]): User[] => {
    const projectUsers = getProjectUsersUtil(projectId);
    // UserData型をUser型に変換
    return projectUsers.map(pu => ({
      id: pu.id,
      name: pu.name,
      role: pu.role
    })) as User[];
  }

  return (
    <ProjectContext.Provider
      value={{
        projects,
        filteredProjects,
        currentProject,
        setCurrentProject,
        switchProject,
        updateProject,
        createProject,
        clearAllProjects,
        resetToDefaultProjects,
        projectMembers,
        assignUserToProject,
        removeUserFromProject,
        getProjectMembers,
        getProjectUsers
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export const useProjectContext = () => {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProjectContext must be used within a ProjectProvider')
  }
  return context
} 