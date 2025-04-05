import { Task } from '@/features/tasks/types/task';
import { parseDate, calculateCalendarDateTime } from '@/utils/dateUtils';

// プロジェクトメンバーIDは、ProjectMember.idと完全に一致する必要があります
// JSONから読み込んだデータと一致させるために、projectMembers.jsonの値をそのまま使用します
const PROJECT_MEMBER_IDS = {
  // プロジェクト1（ECサイト構築）のメンバー
  'taro_proj1': 'pm-1-taro',    // プロジェクト1の太郎
  'gonzo_proj1': 'pm-1-gonzo',  // プロジェクト1のゴンゾウ
  'jiro_proj1': 'pm-1-jiro',    // プロジェクト1の次郎
  'saburo_proj1': 'pm-1-saburo', // プロジェクト1の三郎
  'hanako_proj1': 'pm-1-hanako',  // プロジェクト1の花子

  // プロジェクト2（海外への販路拡大）のメンバー
  'taro_proj2': 'pm-2-taro',    // プロジェクト2の太郎
  'gonzo_proj2': 'pm-2-gonzo',  // プロジェクト2のゴンゾウ
  'jiro_proj2': 'pm-2-jiro',    // プロジェクト2の次郎

  // プロジェクト3（コーポレートサイト保守運用）のメンバー
  'taro_proj3': 'pm-3-taro',    // プロジェクト3の太郎
  'saburo_proj3': 'pm-3-saburo' // プロジェクト3の三郎
};

// シードデータ
export const seedTasks: Task[] = [
  {
    id: 'task-1',
    title: '要件定義',
    description: 'ECサイトの要件を定義し、主要な機能と非機能要件を明確化します。ステークホルダーとの合意を得ることが目標です。',
    dueDate: parseDate('2025-03-05'),
    completedDateTime: undefined,
    projectId: '1', // プロジェクトA
    todos: [
      {
        id: 'todo-1-1',
        text: '競合サイトの調査',
        completed: false,
        startDate: parseDate('2025-03-03'),
        ...calculateCalendarDateTime(parseDate('2025-03-03'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj1 // 太郎が担当
      },
      {
        id: 'todo-1-2',
        text: '機能要件のリストアップ',
        completed: false,
        startDate: parseDate('2025-03-04'),
        ...calculateCalendarDateTime(parseDate('2025-03-04'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj1 // ゴンゾウが担当
      },
      {
        id: 'todo-1-3',
        text: '非機能要件の定義',
        completed: false,
        startDate: parseDate('2025-03-03'),
        ...calculateCalendarDateTime(parseDate('2025-03-03'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj1 // 太郎が担当
      },
      {
        id: 'todo-1-4',
        text: 'ステークホルダーとの要件レビュー会議',
        completed: false,
        startDate: parseDate('2025-03-04'),
        ...calculateCalendarDateTime(parseDate('2025-03-04'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj1 // 太郎が担当
      }
    ]
  },
  {
    id: 'task-2',
    title: 'データベース設計',
    description: 'ECサイトで必要なデータベーススキーマを設計します。商品、ユーザー、注文など主要なエンティティの関連を定義します。',
    dueDate: parseDate('2025-03-10'),
    completedDateTime: undefined,
    projectId: '1', // プロジェクトA
    todos: [
      {
        id: 'todo-2-1',
        text: 'エンティティの洗い出し',
        completed: false,
        startDate: parseDate('2025-03-06'),
        ...calculateCalendarDateTime(parseDate('2025-03-06'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1 // 次郎が担当
      },
      {
        id: 'todo-2-2',
        text: 'ER図の作成',
        completed: false,
        startDate: parseDate('2025-03-07'),
        ...calculateCalendarDateTime(parseDate('2025-03-07'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj1 // 三郎が担当
      },
      {
        id: 'todo-2-3',
        text: 'テーブル定義書の作成',
        completed: false,
        startDate: parseDate('2025-03-07'),
        ...calculateCalendarDateTime(parseDate('2025-03-07'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1 // 次郎が担当
      },
      {
        id: 'todo-2-4',
        text: 'データベース設計のレビュー',
        completed: false,
        startDate: parseDate('2025-03-10'),
        ...calculateCalendarDateTime(parseDate('2025-03-10'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj1 // マネージャーが担当
      }
    ]
  },
  {
    id: 'task-3',
    title: 'フロントエンド設計',
    description: 'ECサイトのフロントエンド設計を行います。UI/UXデザインと画面遷移を検討します。',
    dueDate: parseDate('2025-03-15'),
    completedDateTime: undefined,
    projectId: '1', // プロジェクトA
    todos: [
      {
        id: 'todo-3-1',
        text: 'デザインコンセプトの検討',
        completed: false,
        startDate: parseDate('2025-03-11'),
        ...calculateCalendarDateTime(parseDate('2025-03-11'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1 // 花子が担当
      },
      {
        id: 'todo-3-2',
        text: 'ワイヤーフレーム作成',
        completed: false,
        startDate: parseDate('2025-03-12'),
        ...calculateCalendarDateTime(parseDate('2025-03-12'), 5),
        completedDateTime: undefined,
        estimatedHours: 5,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1 // 花子が担当
      },
      {
        id: 'todo-3-3',
        text: 'UIコンポーネント設計',
        completed: false,
        startDate: parseDate('2025-03-13'),
        ...calculateCalendarDateTime(parseDate('2025-03-13'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1 // 花子が担当
      },
      {
        id: 'todo-3-4',
        text: 'デザインレビュー会議',
        completed: false,
        startDate: parseDate('2025-03-15'),
        ...calculateCalendarDateTime(parseDate('2025-03-15'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj1 // マネージャーと担当者
      }
    ]
  },
  {
    id: 'task-4',
    title: 'フロントエンド開発：商品一覧・詳細',
    description: '商品一覧ページと商品詳細ページのフロントエンド実装を行います。React.jsを使用して開発します。',
    dueDate: parseDate('2025-03-24'),
    completedDateTime: undefined,
    projectId: '1', // プロジェクトA
    todos: [
      {
        id: 'todo-4-1',
        text: 'コンポーネント設計',
        completed: false,
        startDate: parseDate('2025-03-18'),
        ...calculateCalendarDateTime(parseDate('2025-03-18'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: '' // 未アサイン
      },
      {
        id: 'todo-4-2',
        text: '商品一覧ページの実装',
        completed: false,
        startDate: parseDate('2025-03-20'),
        ...calculateCalendarDateTime(parseDate('2025-03-20'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: '' // 未アサイン
      },
      {
        id: 'todo-4-3',
        text: '商品詳細ページの実装',
        completed: false,
        startDate: parseDate('2025-03-21'),
        ...calculateCalendarDateTime(parseDate('2025-03-21'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: '' // 未アサイン
      },
      {
        id: 'todo-4-4',
        text: 'レスポンシブデザインの実装',
        completed: false,
        startDate: parseDate('2025-03-24'),
        ...calculateCalendarDateTime(parseDate('2025-03-24'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: '' // 未アサイン
      }
    ]
  },
  {
    id: 'task-5',
    title: 'フロントエンド開発：カート・注文',
    description: 'ショッピングカートと注文処理のフロントエンド実装を行います。状態管理にはReduxを使用します。',
    dueDate: parseDate('2025-03-31'),
    completedDateTime: undefined,
    projectId: '1', // プロジェクトA
    todos: [
      {
        id: 'todo-5-1',
        text: 'カート状態設計',
        completed: false,
        startDate: parseDate('2025-03-25'),
        ...calculateCalendarDateTime(parseDate('2025-03-25'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1 // 次郎が担当
      },
      {
        id: 'todo-5-2',
        text: 'カートページの実装',
        completed: false,
        startDate: parseDate('2025-03-27'),
        ...calculateCalendarDateTime(parseDate('2025-03-27'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1 // 次郎が担当
      },
      {
        id: 'todo-5-3',
        text: '注文フォームの実装',
        completed: false,
        startDate: parseDate('2025-03-28'),
        ...calculateCalendarDateTime(parseDate('2025-03-28'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.hanako_proj1 // 花子が担当
      },
      {
        id: 'todo-5-4',
        text: '注文処理の状態管理実装',
        completed: false,
        startDate: parseDate('2025-03-31'),
        ...calculateCalendarDateTime(parseDate('2025-03-31'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj1 // 次郎が担当
      }
    ]
  },
  {
    id: 'task-b1',
    title: '海外市場調査',
    description: '進出候補国の市場規模、競合状況、規制環境などを調査します。',
    dueDate: parseDate('2025-04-15'),
    completedDateTime: undefined,
    projectId: '2', // プロジェクトB
    todos: [
      {
        id: 'todo-b1-1',
        text: '市場規模の調査',
        completed: false,
        startDate: parseDate('2025-04-03'),
        ...calculateCalendarDateTime(parseDate('2025-04-03'), 4),
        completedDateTime: undefined,
        estimatedHours: 4,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.gonzo_proj2 // ゴンゾウが担当
      },
      {
        id: 'todo-b1-2',
        text: '競合分析',
        completed: false,
        startDate: parseDate('2025-04-05'),
        ...calculateCalendarDateTime(parseDate('2025-04-05'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.jiro_proj2 // 次郎が担当
      }
    ]
  },
  {
    id: 'task-c1',
    title: 'セキュリティ監査',
    description: 'コーポレートサイトのセキュリティ監査を実施し、脆弱性があれば対策を行います。',
    dueDate: parseDate('2025-05-20'),
    completedDateTime: undefined,
    projectId: '3', // プロジェクトC
    todos: [
      {
        id: 'todo-c1-1',
        text: '脆弱性診断ツールによるスキャン',
        completed: false,
        startDate: parseDate('2025-05-16'),
        ...calculateCalendarDateTime(parseDate('2025-05-16'), 2),
        completedDateTime: undefined,
        estimatedHours: 2,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.saburo_proj3 // 三郎が担当
      },
      {
        id: 'todo-c1-2',
        text: '認証機能のレビュー',
        completed: false,
        startDate: parseDate('2025-05-17'),
        ...calculateCalendarDateTime(parseDate('2025-05-17'), 3),
        completedDateTime: undefined,
        estimatedHours: 3,
        actualHours: 0,
        assigneeId: PROJECT_MEMBER_IDS.taro_proj3 // 太郎が担当
      }
    ]
  }
]; 