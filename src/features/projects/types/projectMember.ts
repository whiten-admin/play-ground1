export type ProjectMemberRole = 'manager' | 'member';

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  assignedAt: string;
}

// プロジェクトメンバーとユーザー情報を組み合わせたデータ型
export interface ProjectMemberWithUser {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  assignedAt: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
} 