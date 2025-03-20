export type UserRole = 'manager' | 'member';

export interface User {
  id: string;
  name: string;
  role: UserRole;
} 