'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useProjectContext } from '@/features/projects/contexts/ProjectContext'
import { formatProjectInfo, extractProjectInfoFromFile } from '@/services/api/utils/openai'
import { extractTextFromFile } from '@/services/api/utils/fileParser'
import { Project } from '@/features/projects/types/project'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useAuth } from '@/services/auth/hooks/useAuth'
import Auth from '@/services/auth/components/Auth'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { IoPencil, IoEye, IoLogoGoogle, IoLogoDropbox, IoCloudOutline, IoPeople } from 'react-icons/io5'
import { SiNotion } from 'react-icons/si'
import { FiPlus, FiX, FiEdit2, FiTrash2, FiMail, FiUsers, FiUpload, FiFile, FiCheckCircle, FiInfo, FiTag, FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { User } from '@/features/tasks/types/user'
import { ProjectMember, ProjectMemberRole, Skill, SkillLevel } from '@/features/projects/types/projectMember'
import { getAllUsers } from '@/utils/memberUtils'
import { FloatingTools }from '@/components/ui/FloatingTools'
import EmptyProjectState from '@/features/projects/components/EmptyProjectState'

// 情報入力項目の定義
interface CompletionItem {
  name: string;
  isComplete: boolean;
}

// メンバー表示用の拡張インターフェース
interface MemberWithUser extends ProjectMember {
  user: User
  tags?: string[]
  position?: { x: number, y: number } 
}

// 招待済みユーザーの型定義
interface InvitedUser {
  id: string;
  email: string;
  role: ProjectMemberRole;
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: Date;
}

// タブの定義
type TabType = 'project-info' | 'external-reference' | 'team';

export default function ProjectInfo() {
  const { currentProject, getProjectMembers, assignUserToProject, removeUserFromProject, filteredProjects, projects } = useProjectContext()
  const { isAuthenticated, user, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('project-info')
  const [activeContentTab, setActiveContentTab] = useState<TabType>('project-info')
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')
  const [originalText, setOriginalText] = useState('')
  const [summaryText, setSummaryText] = useState('')
  const [isFormatting, setIsFormatting] = useState(false)
  const [formatError, setFormatError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [completionRate, setCompletionRate] = useState(0)
  const [completionItems, setCompletionItems] = useState<CompletionItem[]>([])
  
  // チーム管理関連の状態変数
  const [members, setMembers] = useState<MemberWithUser[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberWithUser | null>(null)
  const [selectedRole, setSelectedRole] = useState<ProjectMemberRole>('member')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [allUsers, setAllUsers] = useState<User[]>([])
  
  // 招待関連の状態
  const [addUserTab, setAddUserTab] = useState<'existing' | 'invite'>('existing')
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([])
  
  // スキル関連の状態
  const [showSkillModal, setShowSkillModal] = useState(false)
  const [memberSkills, setMemberSkills] = useState<Skill[]>([])
  const [skillDescription, setSkillDescription] = useState('')
  const [skillSheetFile, setSkillSheetFile] = useState<string | null>(null)
  const [showSkillDetailModal, setShowSkillDetailModal] = useState(false)
  const [newSkill, setNewSkill] = useState<Skill>({ name: '', level: 'intermediate' })
  const [memberTags, setMemberTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const skillFileInputRef = useRef<HTMLInputElement>(null)
  
  // チーム表示モード
  const [teamViewMode, setTeamViewMode] = useState<'list' | 'structure'>('list')
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set())
  
  // メール形式検証用の正規表現
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // プロジェクトが変更されたときに初期化
  useEffect(() => {
    if (currentProject && !isInitialized) {
      const text = generateProjectText(currentProject)
      setOriginalText(text)
      setSummaryText(text) // 初期状態では要約テキストも同じ内容に設定
      setIsInitialized(true)
      setFormatError(null)
      
      // 情報入力度を計算
      const { rate, items } = calculateCompletionRate(currentProject)
      setCompletionRate(rate)
      setCompletionItems(items)
    }
  }, [currentProject, isInitialized])

  // プロジェクト情報が変更されたらテキストを更新
  useEffect(() => {
    if (isInitialized && currentProject) {
      const text = generateProjectText(currentProject)
      setOriginalText(text)
      // 要約テキストが原文と同じ場合のみ更新（編集されている場合は更新しない）
      if (summaryText === originalText) {
        setSummaryText(text)
      }
      
      // 情報入力度を計算
      const { rate, items } = calculateCompletionRate(currentProject)
      setCompletionRate(rate)
      setCompletionItems(items)
    }
  }, [currentProject, isInitialized, originalText, summaryText])

  // ユーザーリストを初期化
  useEffect(() => {
    const users = getAllUsers().map(u => ({
      id: u.id,
      name: u.name,
      role: u.role
    } as User))
    setAllUsers(users)
  }, [])

  // プロジェクトが変更されたらメンバーリストを更新
  useEffect(() => {
    if (currentProject) {
      updateMemberList()
    }
  }, [currentProject, allUsers])
  
  // メンバーリストを更新する関数
  const updateMemberList = () => {
    if (!currentProject) return
    
    const projectMembers = getProjectMembers(currentProject.id)
    
    // メンバー情報にユーザー情報を紐付け
    const membersWithUsers = projectMembers
      .map(member => {
        const user = allUsers.find(u => u.id === member.userId)
        if (!user) return null
        const existingMember = members.find(m => m.id === member.id);
        return {
          ...member,
          user,
          // 位置情報を保持（既存のものがあれば）
          position: existingMember?.position
        } as MemberWithUser;
      })
      .filter((member): member is MemberWithUser => member !== null)
    
    setMembers(membersWithUsers)
  }

  // メンバー追加モーダルを開く
  const openAddModal = () => {
    setSelectedUserId('')
    setSelectedRole('member')
    setInviteEmail('')
    setInviteSuccess(false)
    setAddUserTab('existing')
    setShowAddModal(true)
  }
  
  // メンバー編集モーダルを開く
  const openEditModal = (member: MemberWithUser) => {
    setSelectedMember(member)
    setSelectedRole(member.role)
    setShowEditModal(true)
  }
  
  // スキル詳細モーダルを開く
  const openSkillDetailModal = (member: MemberWithUser) => {
    setSelectedMember(member)
    setMemberSkills(member.skills || [])
    setSkillDescription(member.skillDescription || '')
    setSkillSheetFile(member.skillSheetFile || null)
    setMemberTags(member.tags || [])
    setShowSkillDetailModal(true)
  }
  
  // スキル編集モーダルを開く
  const openSkillModal = (member: MemberWithUser) => {
    setSelectedMember(member)
    setMemberSkills(member.skills || [])
    setSkillDescription(member.skillDescription || '')
    setSkillSheetFile(member.skillSheetFile || null)
    setMemberTags(member.tags || [])
    setShowSkillModal(true)
  }

  // メンバーを追加
  const handleAddMember = () => {
    if (addUserTab === 'existing') {
      if (!selectedUserId || !currentProject) return
      
      assignUserToProject(currentProject.id, selectedUserId, selectedRole)
      setShowAddModal(false)
      updateMemberList()
    } else {
      handleInviteUser()
    }
  }
  
  // 外部ユーザーを招待
  const handleInviteUser = () => {
    if (!inviteEmail || !emailRegex.test(inviteEmail) || !currentProject) return
    
    setIsInviting(true)
    
    // 招待メール送信のシミュレーション
    setTimeout(() => {
      // 招待レコードを作成
      const newInvite: InvitedUser = {
        id: `invite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: inviteEmail,
        role: selectedRole,
        status: 'pending',
        invitedAt: new Date()
      }
      
      // 招待リストに追加
      setInvitedUsers(prev => [...prev, newInvite])
      
      // 状態をリセット
      setInviteSuccess(true)
      setIsInviting(false)
      
      // 3秒後にメッセージを非表示
      setTimeout(() => {
        setShowAddModal(false)
        setInviteSuccess(false)
        setInviteEmail('')
      }, 3000)
    }, 1500) // 1.5秒間の遅延でメール送信をシミュレート
  }
  
  // メンバー情報を更新
  const handleUpdateMember = () => {
    if (!selectedMember || !currentProject) return
    
    assignUserToProject(currentProject.id, selectedMember.userId, selectedRole)
    setShowEditModal(false)
    updateMemberList()
  }
  
  // メンバーを削除
  const handleRemoveMember = (userId: string) => {
    if (!currentProject) return
    
    if (confirm('このメンバーをプロジェクトから削除しますか？')) {
      removeUserFromProject(currentProject.id, userId)
      updateMemberList()
    }
  }
  
  // ロールの日本語表示
  const getRoleLabel = (role: ProjectMemberRole) => {
    switch (role) {
      case 'manager':
        return 'マネージャー'
      case 'member':
        return 'メンバー'
      default:
        return role
    }
  }
  
  // スキルレベルの日本語表示
  const getSkillLevelLabel = (level: SkillLevel) => {
    switch (level) {
      case 'beginner':
        return '初級'
      case 'intermediate':
        return '中級'
      case 'advanced':
        return '上級'
      case 'expert':
        return 'エキスパート'
      default:
        return level
    }
  }

  // プロジェクト情報の入力度を計算
  const calculateCompletionRate = (project: Project): { rate: number; items: CompletionItem[] } => {
    const items: CompletionItem[] = [
      { name: 'プロジェクト名', isComplete: !!project.title },
      { name: 'プロジェクトコード', isComplete: !!project.code },
      { name: '開始日', isComplete: !!project.startDate },
      { name: '終了日', isComplete: !!project.endDate },
      { name: '概要', isComplete: !!project.description && project.description.length > 10 },
      { name: '目的', isComplete: !!project.purpose && project.purpose.length > 10 },
      { name: '開発手法', isComplete: !!project.methodology },
      { name: '開発フェーズ', isComplete: !!project.phase },
      { name: '開発規模', isComplete: !!project.scale },
      { name: '予算', isComplete: !!project.budget },
      { name: 'クライアント', isComplete: !!project.client },
      { name: 'プロジェクトマネージャー', isComplete: !!project.projectManager },
      { name: 'リスク・課題', isComplete: !!project.risks && project.risks.length > 10 }
    ]

    const completedCount = items.filter(item => item.isComplete).length
    const rate = Math.round((completedCount / items.length) * 100)

    return { rate, items }
  }

  // フェーズのラベルを取得
  const getPhaseLabel = (phase: Project['phase']) => {
    const phaseLabels: Record<NonNullable<Project['phase']>, string> = {
      planning: '企画',
      requirements: '要件定義',
      design: '設計',
      development: '開発',
      testing: 'テスト',
      deployment: 'リリース',
      maintenance: '保守運用'
    }
    return phase ? phaseLabels[phase] : '未設定'
  }

  // 開発手法のラベルを取得
  const getMethodologyLabel = (methodology: Project['methodology']) => {
    const methodologyLabels: Record<NonNullable<Project['methodology']>, string> = {
      waterfall: 'ウォーターフォール',
      agile: 'アジャイル',
      hybrid: 'ハイブリッド'
    }
    return methodology ? methodologyLabels[methodology] : '未設定'
  }

  // テキスト表示用のプロジェクト情報を生成
  const generateProjectText = (project: Project) => {
    return `
# ${project.title || 'プロジェクト名未設定'}
${project.code ? `プロジェクトコード: ${project.code}` : ''}
期間: ${project.startDate || '未定'} 〜 ${project.endDate || '未定'}

## プロジェクト概要
${project.description || '概要情報はまだ入力されていません。'}

## 目的
${project.purpose || '目的情報はまだ入力されていません。'}

## 開発情報
- 開発手法: ${getMethodologyLabel(project.methodology)}
- 開発フェーズ: ${getPhaseLabel(project.phase)}
- 開発規模: ${project.scale ? `${project.scale}人月` : '未設定'}
- 予算: ${project.budget ? `${project.budget}万円` : '未設定'}

## ステークホルダー情報
- クライアント: ${project.client || '未設定'}
- プロジェクトマネージャー: ${project.projectManager || '未設定'}

## リスク・課題
${project.risks || 'リスク・課題情報はまだ入力されていません。'}
    `.trim()
  }

  // プロジェクト情報テキストの変更を処理
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSummaryText(e.target.value)
  }

  // ChatGPTを使用してテキストを整形
  const handleFormatText = async () => {
    if (!originalText.trim()) return

    setIsFormatting(true)
    setFormatError(null)

    try {
      const formattedText = await formatProjectInfo(originalText)
      setSummaryText(formattedText)
      setViewMode('edit')
    } catch (error) {
      setFormatError(error instanceof Error ? error.message : '整形中にエラーが発生しました')
    } finally {
      setIsFormatting(false)
    }
  }

  // ファイルアップロード処理
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    setUploadError(null)
    
    try {
      // ファイルからテキストを抽出
      const fileText = await extractTextFromFile(file)
      
      // プロジェクト情報を抽出
      const projectInfo = await extractProjectInfoFromFile(fileText, file.name)
      
      setOriginalText(fileText)
      setSummaryText(projectInfo)
      setViewMode('edit')
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'ファイル処理中にエラーが発生しました')
    } finally {
      setIsUploading(false)
      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // ユーザーデータを取得
  const userData = user ? {
    id: user.id,
    name: user.name,
    role: user.role,
  } : null;

  if (!isAuthenticated) {
    return <Auth onLogin={login} />;
  }

  // ユーザーがアサインされているプロジェクトが存在しない場合は専用画面を表示
  if (filteredProjects.length === 0) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onLogout={logout} user={user} />
          <main className="flex-1 overflow-y-auto p-4">
            <EmptyProjectState 
              onCreateProject={openAddModal} 
            />
          </main>
        </div>
      </div>
    );
  }

  // タブコンテンツをレンダリング
  const renderTabContent = () => {
    if (!currentProject) {
      return (
        <div className="p-6">
          <p className="text-gray-500">プロジェクトが選択されていません。</p>
        </div>
      );
    }

    switch (activeContentTab) {
      case 'external-reference':
        return (
          <div className="p-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    この機能は現在開発中です。外部サービスと連携することで、プロジェクト関連情報をAIが参照し、より精度の高い情報提供が可能になります。
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Google Drive 連携 */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <IoLogoGoogle className="h-8 w-8 text-blue-500 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Google Drive連携</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm">Google Driveと連携することで、プロジェクト関連のドキュメントをAIが自動参照し、最新の情報に基づいた精度の高い回答が得られます。</p>
                <ul className="list-disc pl-5 text-gray-600 mb-6 space-y-1 text-xs">
                  <li>プロジェクト関連のドキュメントをAIが自動参照</li>
                  <li>チーム内での情報共有の効率化</li>
                </ul>
                
                <button
                  type="button"
                  disabled
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-400 cursor-not-allowed"
                >
                  <IoLogoGoogle className="mr-2 h-5 w-5" />
                  連携する（準備中）
                </button>
              </div>
              
              {/* Notion連携 */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <SiNotion className="h-8 w-8 text-gray-900 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Notion連携</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm">Notionと連携することで、プロジェクトのナレッジベースとデータベースをAIが参照し、効率的な情報管理と分析が可能になります。</p>
                <ul className="list-disc pl-5 text-gray-600 mb-6 space-y-1 text-xs">
                  <li>プロジェクトのナレッジベースとの連携</li>
                  <li>データベース・ドキュメント情報の自動取得</li>
                </ul>
                
                <button
                  type="button"
                  disabled
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-400 cursor-not-allowed"
                >
                  <SiNotion className="mr-2 h-5 w-5" />
                  連携する（準備中）
                </button>
              </div>
              
              {/* Dropbox連携 */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <IoLogoDropbox className="h-8 w-8 text-blue-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Dropbox連携</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm">Dropboxと連携することで、プロジェクト関連のファイルをAIが参照し、大容量ファイルの管理と検索・分析が効率化されます。</p>
                <ul className="list-disc pl-5 text-gray-600 mb-6 space-y-1 text-xs">
                  <li>プロジェクト関連ファイルの自動インデックス化</li>
                  <li>大容量ファイルの効率的な管理と参照</li>
                </ul>
                
                <button
                  type="button"
                  disabled
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-400 cursor-not-allowed"
                >
                  <IoLogoDropbox className="mr-2 h-5 w-5" />
                  連携する（準備中）
                </button>
              </div>
            </div>

            <div className="mt-8 bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">外部情報連携のメリット</h3>
              <p className="text-blue-800 mb-4 text-sm">外部サービスと連携することで、AIは以下のような高度な支援が可能になります：</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2 text-sm">情報の自動収集・分析</h4>
                  <p className="text-gray-600 text-xs">プロジェクト関連の外部ドキュメントやファイルを自動的に収集・分析し、最新の情報に基づいた提案や回答を生成します。</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2 text-sm">コンテキスト理解の向上</h4>
                  <p className="text-gray-600 text-xs">プロジェクトの背景や詳細な情報を理解することで、より文脈に即した適切な提案や回答ができるようになります。</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2 text-sm">チーム連携の効率化</h4>
                  <p className="text-gray-600 text-xs">チーム内の情報共有や知識の集約が効率化され、メンバー間のコミュニケーションがスムーズになります。</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2 text-sm">意思決定の迅速化</h4>
                  <p className="text-gray-600 text-xs">必要な情報へのアクセスが迅速になることで、プロジェクトの意思決定スピードが向上します。</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">チーム管理</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setTeamViewMode('list')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1 ${
                    teamViewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FiUsers className="w-3.5 h-3.5" />
                  リスト表示
                </button>
                <button
                  onClick={() => setTeamViewMode('structure')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1 ${
                    teamViewMode === 'structure'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FiUsers className="w-3.5 h-3.5" />
                  構成表示
                </button>
                <button
                  onClick={openAddModal}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 flex items-center gap-1"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  メンバー追加
                </button>
              </div>
            </div>

            {teamViewMode === 'list' ? (
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        メンバー
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        役割
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        スキル情報
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {members.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                          メンバーがいません。「メンバー追加」ボタンからメンバーを追加してください。
                        </td>
                      </tr>
                    ) : (
                      members.map(member => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                  {member.user.name.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{member.user.name}</div>
                                <div className="text-sm text-gray-500">{member.user.role}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${member.role === 'manager' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                              {getRoleLabel(member.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {member.skills && member.skills.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {member.skills.slice(0, 2).map((skill, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    {skill.name}
                                  </span>
                                ))}
                                {member.skills.length > 2 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    +{member.skills.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => openSkillModal(member)}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                              >
                                スキル追加
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openSkillDetailModal(member)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <FiInfo className="h-4 w-4" />
                                <span className="sr-only">詳細</span>
                              </button>
                              <button
                                onClick={() => openEditModal(member)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <FiEdit2 className="h-4 w-4" />
                                <span className="sr-only">編集</span>
                              </button>
                              <button
                                onClick={() => handleRemoveMember(member.userId)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FiTrash2 className="h-4 w-4" />
                                <span className="sr-only">削除</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="text-center text-gray-600 py-20">
                  <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">チーム構成表示</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    チームの構造を視覚的に確認できます。
                  </p>
                </div>
              </div>
            )}

            {/* メンバー追加モーダル */}
            {showAddModal && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">メンバー追加</h3>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="border-b border-gray-200 mb-4">
                    <nav className="flex -mb-px space-x-8">
                      <button
                        onClick={() => setAddUserTab('existing')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          addUserTab === 'existing'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        既存ユーザー
                      </button>
                      <button
                        onClick={() => setAddUserTab('invite')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          addUserTab === 'invite'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        招待
                      </button>
                    </nav>
                  </div>
                  
                  {addUserTab === 'existing' ? (
                    <div>
                      <div className="mb-4">
                        <label htmlFor="user" className="block text-sm font-medium text-gray-700">ユーザー</label>
                        <select
                          id="user"
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="">ユーザーを選択</option>
                          {allUsers
                            .filter(u => !members.some(m => m.userId === u.id))
                            .map(user => (
                              <option key={user.id} value={user.id}>
                                {user.name} ({user.role})
                              </option>
                            ))}
                        </select>
                      </div>
                      
                      <div className="mb-6">
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">役割</label>
                        <select
                          id="role"
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value as ProjectMemberRole)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="member">メンバー</option>
                          <option value="manager">マネージャー</option>
                        </select>
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowAddModal(false)}
                          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          キャンセル
                        </button>
                        <button
                          type="button"
                          onClick={handleAddMember}
                          disabled={!selectedUserId}
                          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          追加
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {inviteSuccess ? (
                        <div className="rounded-md bg-green-50 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <FiCheckCircle className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-green-800">
                                招待メールを送信しました
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
                            <input
                              type="email"
                              id="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="招待するユーザーのメールアドレス"
                            />
                          </div>
                          
                          <div className="mb-6">
                            <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700">役割</label>
                            <select
                              id="invite-role"
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value as ProjectMemberRole)}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            >
                              <option value="member">メンバー</option>
                              <option value="manager">マネージャー</option>
                            </select>
                          </div>
                          
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setShowAddModal(false)}
                              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              キャンセル
                            </button>
                            <button
                              type="button"
                              onClick={handleInviteUser}
                              disabled={!inviteEmail || !emailRegex.test(inviteEmail) || isInviting}
                              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              {isInviting ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  送信中...
                                </>
                              ) : (
                                '招待メール送信'
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* メンバー編集モーダル */}
            {showEditModal && selectedMember && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">メンバー編集</h3>
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium text-gray-600">
                          {selectedMember.user.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-medium text-gray-900">{selectedMember.user.name}</h4>
                        <p className="text-sm text-gray-500">{selectedMember.user.role}</p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700">役割</label>
                      <select
                        id="edit-role"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as ProjectMemberRole)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="member">メンバー</option>
                        <option value="manager">マネージャー</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      キャンセル
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdateMember}
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      更新
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* スキル詳細モーダル */}
            {showSkillDetailModal && selectedMember && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">スキル詳細</h3>
                    <button
                      type="button"
                      onClick={() => setShowSkillDetailModal(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center mb-6">
                    <div className="flex-shrink-0 h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-gray-600">
                        {selectedMember.user.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">{selectedMember.user.name}</h4>
                      <p className="text-sm text-gray-500">{getRoleLabel(selectedMember.role)}</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">スキル一覧</h5>
                    {memberSkills.length > 0 ? (
                      <div className="space-y-2">
                        {memberSkills.map((skill, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <div>
                              <span className="text-sm font-medium text-gray-800">{skill.name}</span>
                              <span className="ml-2 text-xs text-gray-500">{getSkillLevelLabel(skill.level)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">スキル情報がありません</p>
                    )}
                  </div>
                  
                  {skillDescription && (
                    <div className="mb-6">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">スキル詳細</h5>
                      <p className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 p-3 rounded">
                        {skillDescription}
                      </p>
                    </div>
                  )}
                  
                  {memberTags && memberTags.length > 0 && (
                    <div className="mb-6">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">タグ</h5>
                      <div className="flex flex-wrap gap-1">
                        {memberTags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {skillSheetFile && (
                    <div className="mb-6">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">スキルシート</h5>
                      <div className="flex items-center bg-gray-50 p-2 rounded">
                        <FiFile className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{skillSheetFile}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => openSkillModal(selectedMember)}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSkillDetailModal(false)}
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      閉じる
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* スキル編集モーダル */}
            {showSkillModal && selectedMember && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">スキル情報編集</h3>
                    <button
                      type="button"
                      onClick={() => setShowSkillModal(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium text-gray-600">
                          {selectedMember.user.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-medium text-gray-900">{selectedMember.user.name}</h4>
                        <p className="text-sm text-gray-500">{getRoleLabel(selectedMember.role)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">スキル一覧</h5>
                    
                    <div className="space-y-2 mb-4">
                      {memberSkills.map((skill, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div>
                            <span className="text-sm font-medium text-gray-800">{skill.name}</span>
                            <span className="ml-2 text-xs text-gray-500">{getSkillLevelLabel(skill.level)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSkill(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">スキル追加</h5>
                      <div className="flex space-x-2 mb-2">
                        <input
                          type="text"
                          value={newSkill.name}
                          onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                          placeholder="スキル名"
                          className="flex-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-transparent"
                        />
                        <select
                          value={newSkill.level}
                          onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value as SkillLevel })}
                          className="block w-1/3 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="beginner">初級</option>
                          <option value="intermediate">中級</option>
                          <option value="advanced">上級</option>
                          <option value="expert">エキスパート</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={addSkill}
                        disabled={!newSkill.name}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        スキル追加
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="skill-description" className="block text-sm font-medium text-gray-700 mb-2">スキル詳細</label>
                    <textarea
                      id="skill-description"
                      rows={4}
                      value={skillDescription}
                      onChange={(e) => setSkillDescription(e.target.value)}
                      placeholder="スキルに関する詳細説明を記入してください。"
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    ></textarea>
                  </div>
                  
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">タグ</h5>
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      {memberTags.map((tag, index) => (
                        <div key={index} className="inline-flex items-center bg-gray-100 rounded px-2 py-1">
                          <span className="text-xs text-gray-800 mr-1">{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <FiX className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="新しいタグ"
                        className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        disabled={!newTag.trim()}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        追加
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">スキルシート</label>
                    <input
                      type="file"
                      ref={skillFileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xlsx"
                    />
                    
                    {skillSheetFile ? (
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center">
                          <FiFile className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">{skillSheetFile}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSkillSheetFile(null)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleFileSelect}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FiUpload className="mr-2 h-4 w-4" />
                        ファイルをアップロード
                      </button>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowSkillModal(false)}
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      キャンセル
                    </button>
                    <button
                      type="button"
                      onClick={saveSkillInfo}
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 招待済みユーザーリスト（オプション） */}
            {invitedUsers.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">招待中のユーザー</h3>
                <div className="bg-white shadow overflow-hidden rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          メールアドレス
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          役割
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ステータス
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          招待日
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invitedUsers.map(invite => (
                        <tr key={invite.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <FiMail className="h-5 w-5 text-gray-500" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{invite.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${invite.role === 'manager' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                              {getRoleLabel(invite.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${
                                invite.status === 'pending' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : invite.status === 'accepted' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                              }`}>
                              {invite.status === 'pending' ? '招待中' : invite.status === 'accepted' ? '承諾済み' : '辞退'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(invite.invitedAt).toLocaleDateString('ja-JP')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {invite.status === 'pending' && (
                              <button
                                onClick={() => {
                                  if (confirm('この招待をキャンセルしますか？')) {
                                    setInvitedUsers(prev => prev.filter(i => i.id !== invite.id))
                                  }
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                キャンセル
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="flex flex-col md:flex-row gap-6 p-6">
            {/* 左側: プロジェクト情報 */}
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700">
                  プロジェクト概要
                </h4>
                <div className='flex space-x-2'>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1 ${
                        viewMode === 'edit'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => setViewMode('edit')}
                    >
                      <IoPencil className="w-3.5 h-3.5" />
                      編集モード
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1 ${
                        viewMode === 'preview'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => setViewMode('preview')}
                    >
                      <IoEye className="w-3.5 h-3.5" />
                      プレビュー
                    </button>
                  </div>
                </div>
              </div>
              
              {viewMode === 'edit' ? (
                <div className="">
                  <textarea
                    className="w-full border border-gray-200 rounded-lg text-sm text-gray-700 font-mono p-4 focus:outline-gray-300"
                    rows={24}
                    value={summaryText}
                    onChange={handleTextChange}
                    placeholder="プロジェクト情報を入力してください（マークダウン記法が使えます）"
                  />
                </div>
              ) : (
                <div className="bg-white border border-gray-100 p-6 rounded-lg prose prose-sm max-w-none">
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                    {summaryText}
                  </ReactMarkdown>
                </div>
              )}
              
              {formatError && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-xs text-red-700">
                    <span className="font-medium">エラー:</span> {formatError}
                  </p>
                </div>
              )}
            </div>
            
            {/* 右側: 情報入力度 */}
            <div className="md:w-60 space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-4">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <h5 className="text-sm font-medium text-gray-700">情報入力度</h5>
                    <span className={`text-sm font-medium ${
                      completionRate < 50 ? 'text-red-600' : 
                      completionRate < 80 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {completionRate}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div 
                      className={`h-full rounded-full ${
                        completionRate < 50 ? 'bg-red-500' : 
                        completionRate < 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`} 
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {completionItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.isComplete ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className={`text-xs ${item.isComplete ? 'text-gray-600' : 'text-red-600 font-medium'}`}>
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const renderContent = () => {
    if (!currentProject) {
      return (
        <div className="p-2">
          <div className="bg-white rounded-xl shadow-md p-4">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">PJ情報</h1>
            <p className="text-gray-500">プロジェクトが選択されていません。</p>
          </div>
        </div>
      )
    }

    return (
      <div className="p-2">
        <div className="bg-white rounded-xl shadow-md p-4">          
          {/* タブナビゲーション */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px space-x-8">
              <button
                onClick={() => setActiveContentTab('project-info')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeContentTab === 'project-info'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                基本情報
              </button>
              <button
                onClick={() => setActiveContentTab('external-reference')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm inline-flex items-center ${
                  activeContentTab === 'external-reference'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IoCloudOutline className="mr-2" />
                外部情報参照
              </button>
              <button
                onClick={() => setActiveContentTab('team')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm inline-flex items-center ${
                  activeContentTab === 'team'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IoPeople className="mr-2" />
                チーム管理
              </button>
            </nav>
          </div>
          
          {/* タブコンテンツ */}
          {renderTabContent()}
        </div>
      </div>
    )
  }

  // スキルを追加
  const addSkill = () => {
    if (!newSkill.name.trim()) return
    
    // 重複チェック
    if (memberSkills.some(skill => skill.name.toLowerCase() === newSkill.name.toLowerCase())) {
      alert('同じ名前のスキルが既に登録されています。')
      return
    }
    
    setMemberSkills([...memberSkills, { ...newSkill }])
    setNewSkill({ name: '', level: 'intermediate' })
  }
  
  // スキルを削除
  const removeSkill = (index: number) => {
    const updatedSkills = [...memberSkills]
    updatedSkills.splice(index, 1)
    setMemberSkills(updatedSkills)
  }
  
  // タグを追加
  const addTag = () => {
    if (!newTag.trim()) return
    
    // 重複チェック
    if (memberTags.some(tag => tag.toLowerCase() === newTag.toLowerCase())) {
      alert('同じタグが既に登録されています。')
      return
    }
    
    setMemberTags([...memberTags, newTag.trim()])
    setNewTag('')
  }
  
  // タグを削除
  const removeTag = (index: number) => {
    const updatedTags = [...memberTags]
    updatedTags.splice(index, 1)
    setMemberTags(updatedTags)
  }
  
  // ファイル選択ダイアログを開く
  const handleFileSelect = () => {
    if (skillFileInputRef.current) {
      skillFileInputRef.current.click()
    }
  }
  
  // ファイル選択処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // ファイル名だけを保存
    setSkillSheetFile(file.name)
  }
  
  // スキル情報を保存
  const saveSkillInfo = () => {
    if (!selectedMember || !currentProject) return
    
    // メンバーリストを更新
    const updatedMembers = members.map(member => {
      if (member.id === selectedMember.id) {
        return {
          ...member,
          skills: memberSkills,
          skillDescription,
          skillSheetFile,
          tags: memberTags
        }
      }
      return member
    })
    
    setMembers(updatedMembers as MemberWithUser[])
    setShowSkillModal(false)
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={logout} user={userData} project={currentProject || undefined} />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
        <FloatingTools />
      </div>
    </div>
  )
} 