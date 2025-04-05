export type ProjectMemberRole = 'manager' | 'member';

// スキルレベルの型定義
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// スキル情報の型定義
export interface Skill {
  name: string;
  level: SkillLevel;
  years?: number; // 経験年数
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  assignedAt: string;
  skills?: Skill[]; // スキル情報
  skillDescription?: string; // スキルに関する詳細説明
  skillSheetFile?: string; // スキルシートファイル名
  workableHours?: number; // 1日あたりの稼働可能時間（設定しない場合はデフォルト値を使用）
}

// プロジェクトメンバーとユーザー情報を組み合わせたデータ型
export interface ProjectMemberWithUser {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  assignedAt: string;
  skills?: Skill[];
  skillDescription?: string;
  skillSheetFile?: string;
  workableHours?: number; // 1日あたりの稼働可能時間
  user: {
    id: string;
    name: string;
    role: string;
  };
} 