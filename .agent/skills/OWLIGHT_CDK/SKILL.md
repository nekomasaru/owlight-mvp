---
name: owlight-core-dev-kit
description: OWLightプロジェクトの統合開発ツールキット。SaaSダッシュボードUI、Officeファイルのテキスト抽出、RAG運用、エンゲージメントの実装ガイドを含む。
---

# OWLight Core Development Kit (CDK)

このスキルは、"OWLight Project" の開発における「デザイン」「データ」「ロジック」の標準を提供します。
**Premium (質実剛健), Fortress (堅牢), Soil (土壌)** の哲学を最新のモダンUIスタックに反映させます。

## 1. Design System (Modern SaaS & Branding)

OWLightは、**「最新SaaSの使い心地」**と**「自治体らしい信頼感とキャラクター性」**を融合させます。
また、ユーザー体験を損なわないよう、**全画面を日本語（自然なSaaS日本語）**で統一します。

### 1.1 Premium Theme (Elevated SaaS)
- **Surfaces**: 基調は `bg-[#FBFAFA]`。カードは `bg-white` + `shadow-premium`。
- **Glassmorphism**: ナビゲーションやオーバーレイには `bg-white/70 backdrop-blur-xl border border-white/30` を標準使用する。
- **Typography (The Hierarchy)**:
    - **Titles**: `text-taupe` (Deep), `font-medium`, `tracking-tight`。
    - **Labels**: `text-taupe-light`, `text-[10px]`, `font-bold`, `tracking-widest`, `uppercase`。
    - **Values**: 数字、重要データは `font-thin` (または `extralight`) で大きく表示し、モダンさを演出する。

### 1.2 Brand Identity & Soul
- **Terracotta Premium (#B35E3F)**: 単なるオレンジではなく、深みのあるテラコッタ。主要なボタンやアクセントに使用。
- **Sage Soul (#8DA677)**: 穏やかなセージグリーン。成長や知識の象徴に使用。
- **Micro-interactions**: 
    - Hover時に `translate-y-[-2px]` と `shadow-lg` を組み合わせ、「浮遊感」を出す。
    - 遷移には `duration-500 ease-in-out` を多用し、ゆったりとした高級感を演出する。

---

## 2. Knowledge Ops & Office Support (Fortress)

### 2.1 File Extraction Pattern
Gemini APIがサポートしていない形式（Word/Excel）は、サーバーサイドでテキスト抽出を行い `text/plain` としてアップロードします。
- **Word (.docx)**: `mammoth` ライブラリを使用して `extractRawText` を実行。
- **Excel (.xlsx)**: `xlsx` ライブラリを使用して `sheet_to_csv` で各シートを文字列化。

### 2.2 API Call Pattern (Dynamic Prompts)
`generateContent` 実行時は、ハードコードされたプロンプトではなく、**Firestore (`settings/system_prompt`) から取得した動的プロンプト**を使用します。
- **systemInstruction**: 
    - Firestoreから最新の指示を取得。取得失敗時はデフォルトの「Mr.OWL」プロンプトを使用。
    - ファイル参照状況（activeFiles）に応じて、「資料を優先してください」等のコンテキストを動的に付与。
- **Contents**:
    - **User Part (Reference)**: 最新の activeFiles から構築した `fileData` を先頭に配置。
    - **User/Model History**: 過去の会話履歴。

### 2.3 Prompt Admin
システムプロンプトの調整は `/admin/prompts` 画面から行います。ソースコードの変更なしでAIの性格やルールを即座に更新可能です。

---

## 3. Engagement System (Soil)

### 3.1 Motivation Logic
- **フクロウの進化**: ユーザーの利用回数や貢献度（アップロード等）に基づき、卵から成鳥へとレベルアップする。
- **Feedback (感謝の循環)**: AIの回答に対するリアクション等。

---

## 4. Components Structure
`lucide-react` をアイコンセットとして標準採用し、可能な限りTailwindのJITクラスで柔軟に構築します。
