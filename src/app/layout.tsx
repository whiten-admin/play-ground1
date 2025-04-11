import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'react-resizable/css/styles.css';
import '@/utils/chartConfig';
import { TaskProvider } from '@/features/tasks/contexts/TaskContext';
import { ProjectProvider } from '@/features/projects/contexts/ProjectContext';
import { FloatingTools } from '@/components/ui/FloatingTools';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'devDash',
  description: 'プロジェクト管理システム',
  icons: {
    icon: '/favicon.ico',
  },
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
            {children}
            <FloatingTools />
          </TaskProvider>
        </ProjectProvider>
      </body>
    </html>
  );
}
