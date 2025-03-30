import usersData from '@/data/users.json';
import { User, UserRole } from '@/types/user';

// 型の定義
interface UserData {
  id: string;
  password: string;
  name: string;
  role: UserRole;
}

// JSONデータの型をUserData配列として型付け
const users: UserData[] = usersData as UserData[];

/**
 * ユーザーIDから名前を取得する
 */
export function getUserNameById(userId: string | undefined): string {
  if (!userId) return '未アサイン';
  
  const user = users.find(u => u.id === userId);
  return user ? user.name : '不明なユーザー';
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
 * 全ユーザーのリストを取得する
 */
export function getAllUsers(): UserData[] {
  return users;
}

/**
 * 複数のユーザーIDから名前リストを取得する
 */
export function getUserNamesByIds(userIds: string[] | undefined): string {
  if (!userIds || userIds.length === 0) return '未アサイン';
  
  const names = userIds.map(id => {
    const user = users.find(u => u.id === id);
    return user ? user.name : '不明なユーザー';
  });
  
  return names.join(', ');
} 