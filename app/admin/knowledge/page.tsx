'use client';

import React, { useState, useEffect } from 'react';
import {
    Database,
    Search,
    RefreshCcw,
    Trash2,
    Edit,
    Tag,
    Eye,
    ThumbsUp,
    CheckCircle2,
    HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import KnowledgeClipModal from '@/components/KnowledgeClipModal';

import { useToast } from '@/contexts/ToastContext';

// --- Reusable Components ---
const Button = ({ children, variant = "primary", className = "", ...props }: any) => {
    const baseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 shadow-sm active:scale-95";
    const variants = {
        primary: "bg-terracotta text-white hover:bg-terracotta/90",
        secondary: "bg-white dark:bg-card text-taupe dark:text-foreground border border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-terracotta",
        ghost: "hover:bg-slate-100 dark:hover:bg-slate-800 text-taupe-light hover:text-terracotta transition-colors shadow-none",
        destructive: "bg-white dark:bg-card text-red-500 border border-slate-200 dark:border-border hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 shadow-none"
    };
    return (
        <button className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>
            {children}
        </button>
    );
};

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`rounded-xl bg-card text-foreground shadow-sm ${className}`}>
        {children}
    </div>
);

// --- Page ---

export default function KnowledgeAdminPage() {
    const [knowledges, setKnowledges] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const { showSuccess, showError } = useToast();

    const fetchKnowledge = async () => {
        setIsLoading(true);
        try {
            // Fetch from DB via API (limit 100 for MVP)
            const res = await fetch('/api/knowledge?limit=100');
            const data = await res.json();
            if (data.knowledge) {
                setKnowledges(data.knowledge);
            }
        } catch (error) {
            console.error('Error fetching knowledge:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchKnowledge();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('このナレッジを削除しますか？')) return;
        try {
            await fetch(`/api/knowledge?id=${id}`, { method: 'DELETE' });
            setKnowledges(prev => prev.filter(k => k.id !== id));
        } catch (error) {
            console.error('Delete error:', error);
            showError('削除できませんでした', 'OWLが困惑しています。もう一度お試しください。');
        }
    };

    const handleEditSubmit = async (data: any) => {
        if (!editingItem) return;
        try {
            await fetch('/api/knowledge', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingItem.id,
                    content: data.memo,
                    tags: [data.tag],
                    title: data.tag // Update title as well? Or keep logic
                })
            });
            showSuccess('知恵が更新されました', 'OWLが記録を修正しました。ありがとうございます！');
            setEditingItem(null);
            fetchKnowledge();
        } catch (error) {
            console.error(error);
            showError('保存できませんでした', '大切なデータを守るため、もう一度試してみてください。');
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
            <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-taupe tracking-tight mb-1 font-display">ナレッジ管理</h1>
                        <p className="text-taupe-light text-sm font-medium">データベースに保存されたナレッジを管理します。</p>
                    </div>
                    <Button variant="outline" className="h-8 px-3" onClick={fetchKnowledge} disabled={isLoading}>
                        <RefreshCcw className={`w-3.5 h-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                        <span className="text-xs">更新</span>
                    </Button>
                </div>

                {/* List */}
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted text-muted-foreground uppercase font-bold text-[10px] tracking-wider border-b border-slate-100/50">
                                <tr>
                                    <th className="px-6 py-4">Title / ID</th>
                                    <th className="px-6 py-4">Source & Tags</th>
                                    <th className="px-6 py-4">Metrics</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {knowledges.length === 0 && !isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            ナレッジが見つかりません。
                                        </td>
                                    </tr>
                                ) : (
                                    knowledges.map((k) => (
                                        <tr key={k.id} className="hover:bg-muted/50 transition-colors group">
                                            <td className="px-6 py-4 max-w-xs">
                                                <div className="font-bold text-foreground truncate" title={k.title}>{k.title || '（無題）'}</div>
                                                <div className="text-[10px] text-slate-300 font-mono truncate">{k.id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs text-slate-500 font-medium">
                                                        {k.sourceType === 'user_submission' ? 'User Submit' : 'System'}
                                                    </span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {k.tags && k.tags.map((t: string, i: number) => (
                                                            <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-muted text-muted-foreground">
                                                                <Tag size={8} className="mr-1" />
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                                    <div className="flex items-center gap-1" title="Helpful">
                                                        <ThumbsUp size={12} /> {k.helpfulnessCount || 0}
                                                    </div>
                                                    <div className="flex items-center gap-1" title="Views">
                                                        <Eye size={12} /> 0
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${k.approvalStatus === 'approved' ? 'bg-sage/10 text-sage' : 'bg-amber-50 text-amber-600'}`}>
                                                    {k.approvalStatus === 'approved' ? <CheckCircle2 size={10} className="mr-1" /> : <HelpCircle size={10} className="mr-1" />}
                                                    {k.approvalStatus || 'draft'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingItem(k)}>
                                                        <Edit size={14} />
                                                    </Button>
                                                    <Button variant="destructive" className="h-8 w-8 p-0" onClick={() => handleDelete(k.id)}>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </main>

            {/* Edit Modal */}
            {editingItem && (
                <KnowledgeClipModal
                    isOpen={!!editingItem}
                    onClose={() => setEditingItem(null)}
                    onSubmit={handleEditSubmit}
                    initialData={{
                        memo: editingItem.content,
                        tag: editingItem.tags?.[0] || editingItem.title || '',
                        author: 'admin'
                    }}
                />
            )}
        </div>
    );
}
