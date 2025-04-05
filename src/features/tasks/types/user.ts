export type UserRole = 'admin' | 'manager' | 'member';

export interface User {
  id: string;
  name: string;
  role: UserRole;
} 