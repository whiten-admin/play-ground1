# プロジェクト管理アプリケーション

Next.js と TypeScript を使用したモダンなプロジェクト管理ツールです。タスク管理、スケジュール管理、WBS（Work Breakdown Structure）機能を備えています。

## 主な機能

- 📋 タスク管理
  - タスクの作成、編集、削除
  - タスクの進捗管理
  - ToDo リストの管理
- 📅 スケジュール管理
  - 週間スケジュールの表示
  - タスクのスケジューリング
- 🔐 認証機能
  - ユーザー認証
  - セキュアなアクセス制御
- 📊 プロジェクト詳細
  - プロジェクトの概要表示
  - 進捗状況の可視化

## 技術スタック

- **フロントエンド**
  - Next.js 14.1.0
  - React 18.2.0
  - TypeScript 5.3.3
  - Tailwind CSS 3.4.1
  - Framer Motion（アニメーション）
  - React Icons

## 開発環境のセットアップ

1. リポジトリのクローン
```bash
git clone [リポジトリURL]
cd play-ground1
```

2. 依存パッケージのインストール
```bash
npm install
```

3. 開発サーバーの起動
```bash
npm run dev
```

4. ブラウザでアクセス
```
http://localhost:3000
```

## スクリプト

- `npm run dev`: 開発サーバーの起動
- `npm run build`: プロダクションビルドの作成
- `npm run start`: プロダクションサーバーの起動
- `npm run lint`: コードの静的解析

## プロジェクト構成

```
src/
├── app/              # ページコンポーネント
├── components/       # 再利用可能なコンポーネント
└── hooks/           # カスタムフック

```

## ライセンス

このプロジェクトは [MIT ライセンス](LICENSE) の下で公開されています。 