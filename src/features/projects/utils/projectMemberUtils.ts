import { ProjectMember } from '@/features/projects/types/projectMember';
import { getAllUsers } from '@/features/tasks/utils/userUtils';

/**
 * ユーザーIDからプロジェクトメンバーを取得する
 */
export function getProjectMemberByUserId(projectId: string, userId: string, projectMembers: ProjectMember[]): ProjectMember | undefined {
  return projectMembers.find(
    member => member.projectId === projectId && member.userId === userId
  );
}

/**
 * プロジェクトメンバーIDからプロジェクトメンバーを取得する
 */
export function getProjectMemberById(projectMemberId: string, projectMembers: ProjectMember[]): ProjectMember | undefined {
  return projectMembers.find(member => member.id === projectMemberId);
}

/**
 * プロジェクトメンバーIDからユーザー名を取得する
 */
export function getProjectMemberName(projectMemberId: string, projectMembers: ProjectMember[]): string {
  const member = getProjectMemberById(projectMemberId, projectMembers);
  if (!member) return '未アサイン';
  
  const users = getAllUsers();
  const user = users.find(user => user.id === member.userId);
  return user ? user.name : '不明なユーザー';
}

/**
 * 複数のプロジェクトメンバーIDからユーザー名のリストを取得する
 */
export function getProjectMemberNames(projectMemberIds: string[], projectMembers: ProjectMember[]): string {
  if (!projectMemberIds || projectMemberIds.length === 0) return '未アサイン';
  
  return projectMemberIds
    .map(id => getProjectMemberName(id, projectMembers))
    .join(', ');
}

/**
 * 現在のユーザーのプロジェクトメンバーIDを取得する
 * @param projectId プロジェクトID
 * @param userId ユーザーID
 * @param projectMembers プロジェクトメンバーのリスト
 * @returns プロジェクトメンバーID（見つからない場合は空文字）
 */
export function getCurrentUserProjectMemberId(projectId: string, userId: string, projectMembers: ProjectMember[]): string {
  const member = getProjectMemberByUserId(projectId, userId, projectMembers);
  return member ? member.id : '';
} 