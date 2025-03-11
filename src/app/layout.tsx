import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TaskProvider } from '@/contexts/TaskContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'プロジェクト管理',
  description: 'プロジェクト管理システム',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <TaskProvider>{children}</TaskProvider>
      </body>
    </html>
  );
}
