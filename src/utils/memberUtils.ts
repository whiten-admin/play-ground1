import usersData from '@/features/tasks/users/users.json';
import projectMembersData from '@/features/projects/data/projectMembers.json';
import { ProjectMember } from '@/features/projects/types/projectMember';

// 型の定義
export interface UserData {
  id: string;
  password: string;
  name: string;
  role: string;
}

// データの読み込み
const users: UserData[] = usersData as UserData[];
const projectMembers: ProjectMember[] = projectMembersData as ProjectMember[];

/**
 * ユーザーIDからユーザー情報を取得する
 */
export function getUserById(userId: string | undefined): UserData | null {
  if (!userId) return null;
  
  const user = users.find(u => u.id === userId);
  return user || null;
}

/**
 * ユーザーIDから名前を取得する
 */
export function getUserNameById(userId: string | undefined): string {
  if (!userId) return '未アサイン';
  
  const user = getUserById(userId);
  return user ? user.name : '不明なユーザー';
}

/**
 * 全ユーザーのリストを取得する
 */
export function getAllUsers(): UserData[] {
  return users;
}

/**
 * プロジェクトメンバーIDからプロジェクトメンバーを取得する
 */
export function getProjectMemberById(projectMemberId: string | undefined): ProjectMember | null {
  if (!projectMemberId) return null;
  
  const member = projectMembers.find(m => m.id === projectMemberId);
  return member || null;
}

/**
 * プロジェクトメンバーIDからユーザー情報を取得する
 */
export function getUserByProjectMemberId(projectMemberId: string | undefined): UserData | null {
  if (!projectMemberId) return null;
  
  const member = getProjectMemberById(projectMemberId);
  if (!member) return null;
  
  return getUserById(member.userId);
}

/**
 * プロジェクトメンバーIDからユーザー名を取得する
 */
export function getProjectMemberName(projectMemberId: string | undefined): string {
  if (!projectMemberId) return '未アサイン';
  
  const user = getUserByProjectMemberId(projectMemberId);
  return user ? user.name : '未アサイン';
}

/**
 * 特定のプロジェクトのメンバーを取得する
 */
export function getProjectMembers(projectId: string): ProjectMember[] {
  return projectMembers.filter(member => member.projectId === projectId);
}

/**
 * 特定のプロジェクトに所属するユーザー情報を取得する
 */
export function getProjectUsers(projectId: string): UserData[] {
  const members = getProjectMembers(projectId);
  const userIds = members.map(member => member.userId);
  
  return users.filter(user => userIds.includes(user.id));
} 