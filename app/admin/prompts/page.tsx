'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader2, Save, ArrowLeft, RotateCcw } from 'lucide-react';

export default function PromptAdminPage() {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Default fallback prompt (same as current hardcoded one)
    const defaultPrompt = `あなたはOWLightの賢者「Mr.OWL」です。自治体職員のパートナーとして、丁寧かつ温かい「恩送り（Pay it Forward）」の精神で回答してください。

以下のガイドラインを厳守してください：
1. **構造化と視覚化**: 情報を整理し、必ず以下の**Markdown見出しまたは太字**の構成で回答してください：
   - **結論**: 質問に対する端的な答え。
   - **理由・背景**: 資料などに基づいた根拠。
   - **詳細解説**: **Markdown形式の表（\`| \`で区切る）**、**箇条書き**、**見出し（###）**を積極的に活用し、一目で内容が理解できるようにしてください。
     - **重要**: 表（Table）を作成する際は、必ず前後に**空行**を入れ、ヘッダーの直下に「|---|---|」のような区切り行を記述してください。
     - **禁止**: HTMLタグや改行タグは使用せず、必ずMarkdown構文のみを使用してください。
   - **補足・アドバイス**: 運用上の注意点や、次に繋がる知恵の共有。
2. **労いと共感**: 回答の冒頭では職員の多忙さを労う言葉を添えてください。
3. **伴走者のトーン**: 親しみやすい日本語（「ですね」「ですよ」）を使い、適度に絵文字（🦉, ✨, 📝）を交えてください。
4. **知恵の価値付け**: 「この疑問はきっと他の職員さんの助けにもなりますね」といった言葉を添えてください。
5. **事実に基づいた誠実さ**: 添付資料を最優先し、ない場合は代替案を提案してください。
6. **恩送りの結び**: 最後は前向きな言葉で締めくくってください。`;

    useEffect(() => {
        fetchPrompt();
    }, []);

    const fetchPrompt = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/prompts');
            const data = await res.json();
            if (data.content) {
                setPrompt(data.content);
            } else {
                setPrompt(defaultPrompt); // Use default if no remote prompt found
            }
        } catch (error) {
            console.error('Error fetching prompt:', error);
            setMessage({ text: 'プロンプトの取得に失敗しました。', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/prompts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: prompt }),
            });

            if (!res.ok) throw new Error('Failed to save');

            setMessage({ text: 'プロンプトを保存しました！', type: 'success' });
            // Clear success message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error saving prompt:', error);
            setMessage({ text: '保存に失敗しました。', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (confirm('デフォルトのプロンプトに戻しますか？保存するまで変更は確定しません。')) {
            setPrompt(defaultPrompt);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="animate-spin text-terracotta" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-6">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" className="text-slate-500">
                                <ArrowLeft className="mr-2" size={16} />
                                戻る
                            </Button>
                        </Link>
                        <h1 className="text-2xl font-bold text-taupe">システムプロンプト設定</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleReset} disabled={saving}>
                            <RotateCcw className="mr-2" size={16} />
                            リセット
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-terracotta hover:bg-terracotta/90 text-white"
                        >
                            {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                            保存する
                        </Button>
                    </div>
                </div>

                {/* Status Message */}
                {message && (
                    <div className={`p-4 rounded-lg font-bold text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                {/* Editor */}
                <Card className="p-6 border-slate-200 shadow-sm bg-white">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        AIへの指示（System Instruction）
                    </label>
                    <p className="text-xs text-slate-400 mb-4">
                        AIの性格、回答ルール、Markdownの形式などを定義します。変更は次回のチャットから反映されます。
                    </p>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full h-[600px] p-4 font-mono text-sm leading-relaxed border border-slate-200 rounded-lg focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta outline-none resize-none bg-slate-50"
                        spellCheck={false}
                    />
                </Card>

            </div>
        </div>
    );
}
