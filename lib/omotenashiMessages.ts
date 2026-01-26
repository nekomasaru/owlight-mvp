/**
 * Omotenashi Messages - OWL口調のメッセージ定数
 * エラーや警告を「叱る」ではなく「守る」トーンで表現
 */

export const OMOTENASHI_MESSAGES = {
    // エラー系（不整合・問題発見）
    ERROR: {
        VALIDATION_FAILED: {
            title: 'ちょっと待ってください',
            message: 'OWLが入力内容に気になる点を見つけました。後で困らないよう、今ここで確認しましょう。'
        },
        NETWORK_ERROR: {
            title: '通信が途切れました',
            message: 'サーバーとの接続が一時的に不安定です。少し待ってから、もう一度お試しください。'
        },
        SAVE_FAILED: {
            title: '保存できませんでした',
            message: '大切なデータを守るため、もう一度保存を試みてください。問題が続く場合はお知らせください。'
        },
        UNKNOWN: {
            title: '予期しないことが起きました',
            message: 'OWLも困惑しています。ページを更新するか、少し時間を置いてお試しください。'
        }
    },

    // 警告系（確認が必要）
    WARNING: {
        UNSAVED_CHANGES: {
            title: '変更が保存されていません',
            message: 'このまま離れると、入力した内容が失われます。保存してから移動しますか？'
        },
        INCOMPLETE_DATA: {
            title: '入力が不完全です',
            message: 'いくつかの項目が空欄です。すべて入力すると、より良い結果が得られます。'
        },
        PERMISSION_REQUIRED: {
            title: '確認が必要です',
            message: 'この操作には承認が必要です。担当者に確認をお願いしてください。'
        }
    },

    // 成功系（ポジティブフィードバック）
    SUCCESS: {
        KNOWLEDGE_SAVED: {
            title: '知恵が記録されました',
            message: 'あなたの知見が組織の財産になりました。ありがとうございます！'
        },
        PROFILE_UPDATED: {
            title: '更新完了',
            message: '変更が正しく保存されました。'
        },
        MESSAGE_SENT: {
            title: '送信しました',
            message: 'メッセージが相手に届きました。'
        }
    },

    // 情報系（ヒント・ガイダンス）
    INFO: {
        FIRST_TIME: {
            title: 'ようこそ！',
            message: '初めての方へ：まずは左のメニューから「ナレッジを探す」を試してみてください。'
        },
        TIP: {
            title: 'ヒント',
            message: ''
        },
        LOADING: {
            title: '読み込み中...',
            message: 'OWLが情報を集めています。少々お待ちください。'
        }
    }
} as const;

// メッセージタイプ
export type OmotenashiMessageType = 'error' | 'warning' | 'success' | 'info';

// ヘルパー関数
export function getOmotenashiMessage(
    type: OmotenashiMessageType,
    key: string
): { title: string; message: string } {
    const category = OMOTENASHI_MESSAGES[type.toUpperCase() as keyof typeof OMOTENASHI_MESSAGES];
    if (category && key in category) {
        return category[key as keyof typeof category];
    }
    return OMOTENASHI_MESSAGES.ERROR.UNKNOWN;
}
