import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'react-resizable/css/styles.css';
import { TaskProvider } from '@/contexts/TaskContext';
import { FilterProvider } from '@/contexts/FilterContext';
import { ProjectProvider } from '@/contexts/ProjectContext';

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
        <ProjectProvider>
          <TaskProvider>
            <FilterProvider>
              {children}
            </FilterProvider>
          </TaskProvider>
        </ProjectProvider>
      </body>
    </html>
  );
}
