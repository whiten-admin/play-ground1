import usersData from '@/features/tasks/users/users.json';
import projectMembersData from '@/features/projects/data/projectMembers.json';
import { ProjectMember } from '@/features/projects/types/projectMember';
import { BUSINESS_HOURS } from './constants/constants';

// 型の定義
export interface UserData {
  id: string;
  password: string;
  name: string;
  role: string;
}

// データの読み込み
const users: UserData[] = usersData as UserData[];

// メンバーの稼働時間設定をlocalStorageに保存するキー
const MEMBER_WORKABLE_HOURS_KEY = 'memberWorkableHours';
const PROJECT_MEMBERS_KEY = 'projectMembers';

// ローカルストレージからプロジェクトメンバー情報を取得または初期化
function getProjectMembersFromStorage(): ProjectMember[] {
  if (typeof window === 'undefined') {
    return projectMembersData as ProjectMember[];
  }

  const storedData = localStorage.getItem(PROJECT_MEMBERS_KEY);
  if (storedData) {
    try {
      return JSON.parse(storedData);
    } catch (e) {
      console.error('プロジェクトメンバーデータの解析に失敗しました', e);
      return projectMembersData as ProjectMember[];
    }
  }
  
  // 初期データをストレージに保存
  const initialData = projectMembersData as ProjectMember[];
  localStorage.setItem(PROJECT_MEMBERS_KEY, JSON.stringify(initialData));
  return initialData;
}

// メンバー情報を遅延読み込み（関数呼び出し時に最新の情報を取得）
function getAllProjectMembers(): ProjectMember[] {
  return getProjectMembersFromStorage();
}

// localStorageから稼働時間設定を取得
function getMemberWorkableHoursFromStorage(): Record<string, number> {
  const storedData = localStorage.getItem(MEMBER_WORKABLE_HOURS_KEY);
  return storedData ? JSON.parse(storedData) : {};
}

// localStorageに稼働時間設定を保存
function saveMemberWorkableHoursToStorage(settings: Record<string, number>): void {
  localStorage.setItem(MEMBER_WORKABLE_HOURS_KEY, JSON.stringify(settings));
}

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
  
  const members = getAllProjectMembers();
  const member = members.find(m => m.id === projectMemberId);
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
  const allMembers = getProjectMembersFromStorage();
  return allMembers.filter(member => member.projectId === projectId);
}

/**
 * 特定のプロジェクトに所属するユーザー情報を取得する
 */
export function getProjectUsers(projectId: string): UserData[] {
  const members = getProjectMembers(projectId);
  const userIds = members.map(member => member.userId);
  
  return users.filter(user => userIds.includes(user.id));
}

/**
 * プロジェクトメンバーを追加または更新する
 */
export function saveProjectMember(member: ProjectMember): void {
  if (typeof window === 'undefined') return;
  
  const members = getProjectMembersFromStorage();
  const existingIndex = members.findIndex(m => m.id === member.id);
  
  if (existingIndex >= 0) {
    // 既存のメンバーを更新
    members[existingIndex] = member;
  } else {
    // 新しいメンバーを追加
    members.push(member);
  }
  
  localStorage.setItem(PROJECT_MEMBERS_KEY, JSON.stringify(members));
}

/**
 * プロジェクトメンバーを削除する
 */
export function removeProjectMember(memberId: string): void {
  if (typeof window === 'undefined') return;
  
  const members = getProjectMembersFromStorage();
  const filteredMembers = members.filter(m => m.id !== memberId);
  
  localStorage.setItem(PROJECT_MEMBERS_KEY, JSON.stringify(filteredMembers));
}

/**
 * プロジェクトメンバーの1日あたりの稼働可能時間を取得する
 * @param memberId プロジェクトメンバーID
 * @returns 稼働可能時間（時間単位）。設定されていない場合はデフォルト値を返す
 */
export function getMemberWorkableHours(memberId: string): number {
  if (typeof window === 'undefined') return BUSINESS_HOURS.MAX_HOURS;
  
  const settings = getMemberWorkableHoursFromStorage();
  return settings[memberId] || BUSINESS_HOURS.MAX_HOURS;
}

/**
 * プロジェクトメンバーの1日あたりの稼働可能時間を設定する
 * @param memberId プロジェクトメンバーID
 * @param hours 稼働可能時間（時間単位）
 */
export function setMemberWorkableHours(memberId: string, hours: number): void {
  if (typeof window === 'undefined') return;
  
  const settings = getMemberWorkableHoursFromStorage();
  settings[memberId] = hours;
  saveMemberWorkableHoursToStorage(settings);
}

/**
 * すべてのプロジェクトメンバーの稼働可能時間設定を取得する
 * @returns メンバーIDをキー、稼働可能時間を値とするオブジェクト
 */
export function getAllMemberWorkableHours(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  
  return getMemberWorkableHoursFromStorage();
} 