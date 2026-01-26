"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Users,
    Shield,
    Zap,
    RefreshCcw,
    ArrowLeft,
    Pencil,
    Check,
    X,
    Trash2,
    Database,
    Briefcase,
    Brain,
    Activity,
    Clock,
    Heart
} from 'lucide-react';
import UserSwitcher from '@/components/UserSwitcher';
import { User, UserRole } from '@/types';
import { PERSONAS } from '@/contexts/UserContext';
import { useToast } from '@/contexts/ToastContext';

// --- Reusable Components (Consistent with other Admin pages) ---

const Button = ({ children, variant = "primary", className = "", ...props }: any) => {
    const baseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 shadow-sm active:scale-95";
    const variants = {
        primary: "bg-terracotta text-white hover:bg-terracotta/90",
        secondary: "bg-white dark:bg-card text-taupe dark:text-foreground border border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-terracotta",
        ghost: "hover:bg-slate-100 dark:hover:bg-slate-800 text-taupe-light hover:text-terracotta transition-colors shadow-none",
        outline: "border border-slate-200 dark:border-border bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-taupe dark:text-foreground shadow-none",
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

const Badge = ({ children, variant = "default" }: { children: React.ReactNode, variant?: "default" | "success" | "warning" | "outline" }) => {
    const variants = {
        default: "bg-slate-100 text-slate-600",
        success: "bg-sage/10 text-sage border border-sage/20",
        warning: "bg-amber-50 text-amber-600 border border-amber-200",
        outline: "border border-slate-200 text-slate-500"
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${variants[variant]}`}>
            {children}
        </span>
    );
};

export default function UserAdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<User>>({});
    const { showSuccess, showError } = useToast();

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            if (data.users) {
                // Map from DomainUser to User type
                const mappedUsers = data.users.map((u: any) => ({
                    id: u.id,
                    name: u.name,
                    role: u.role,
                    department: u.department,
                    mentorMode: u.mentorMode,
                    points: u.points,
                    thanksCount: u.thanksCount,
                    timeSaved: u.timeSaved
                }));
                setUsers(mappedUsers);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSeedUsers = async () => {
        if (!confirm("初期ユーザーデータ（Suzuki, Sato, Tanaka）をSupabaseに上書きしますか？既存の変更が失われる可能性があります。")) return;

        setIsLoading(true);
        try {
            // Use PERSONAS to seed
            for (const key of Object.keys(PERSONAS) as UserRole[]) {
                const user = PERSONAS[key];
                await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(user)
                });
            }
            showSuccess("初期化成功", "ユーザーデータをリセットしました。");
            fetchUsers(); // Refresh list
        } catch (error) {
            console.error("Error seeding users:", error);
            showError("初期化失敗", "データの投入に失敗しました。");
        } finally {
            setIsLoading(false);
        }
    };

    const startEdit = (user: User) => {
        setEditingId(user.id);
        setEditForm({ ...user });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async () => {
        if (!editingId || !editForm) return;

        try {
            await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingId, ...editForm })
            });

            setUsers(prev => prev.map(u => u.id === editingId ? { ...u, ...editForm } as User : u));
            setEditingId(null);
            setEditForm({});
            showSuccess("更新完了", "ユーザー情報を更新しました。");
        } catch (error) {
            console.error("Error updating user:", error);
            showError("更新エラー", "ユーザー情報の更新に失敗しました。");
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm("このユーザーを削除しますか？")) return;
        try {
            await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
            setUsers(prev => prev.filter(u => u.id !== id));
            showSuccess("削除完了", "ユーザーを削除しました。");
        } catch (error) {
            console.error("Error deleting user:", error);
            showError("削除エラー", "ユーザーの削除に失敗しました。");
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
            {/* Header */}
            {/* Header Removed */}

            <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
                {/* Hero */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-taupe tracking-tight mb-1 font-display">ユーザー管理</h1>
                        <p className="text-taupe-light text-sm font-medium">ペルソナ設定およびロール権限を管理します。</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleSeedUsers} disabled={isLoading}>
                            <Database size={14} className="mr-2" />
                            データ初期化 (Seed)
                        </Button>
                    </div>
                </div>

                {/* User List */}
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted text-muted-foreground uppercase font-bold text-[10px] tracking-wider border-b border-slate-100/50">
                                <tr>
                                    <th className="px-6 py-3">User / ID</th>
                                    <th className="px-6 py-3">Role & Dept</th>
                                    <th className="px-6 py-3 text-center">OWL Points</th>
                                    <th className="px-6 py-3 text-center">Time Saved</th>
                                    <th className="px-6 py-3 text-center">Thanks</th>
                                    <th className="px-6 py-3 text-center">Mentor Mode</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.length === 0 && !isLoading ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                                            ユーザーが見つかりません。"データ初期化" ボタンを押してデータを投入してください。
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-foreground">{user.name}</div>
                                                <div className="text-xs text-slate-400 font-mono">{user.id}</div>
                                            </td>

                                            <td className="px-6 py-4">
                                                {editingId === user.id ? (
                                                    <div className="flex flex-col gap-2">
                                                        <select
                                                            className="text-xs border rounded p-1"
                                                            value={editForm.role}
                                                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                                                        >
                                                            <option value="new_hire">New Hire</option>
                                                            <option value="veteran">Veteran</option>
                                                            <option value="manager">Manager</option>
                                                        </select>
                                                        <input
                                                            className="text-xs border rounded p-1"
                                                            value={editForm.department}
                                                            onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                                            placeholder="Department"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={
                                                                user.role === 'manager' ? 'warning' :
                                                                    user.role === 'veteran' ? 'success' : 'default'
                                                            }>
                                                                {user.role}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center text-xs text-slate-500">
                                                            <Briefcase size={12} className="mr-1" />
                                                            {user.department}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Score */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-mono font-bold text-taupe">{user.points || 0}</span>
                                                    <div className="flex items-center gap-0.5 text-[9px] text-terracotta/60 font-black tracking-tighter uppercase">
                                                        <Zap size={8} fill="currentColor" />
                                                        OWL Points
                                                    </div>
                                                </div>
                                            </td>



                                            {/* Time Saved */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-mono font-bold text-sage">{user.timeSaved || 0}m</span>
                                                    <div className="flex items-center gap-0.5 text-[8px] text-slate-400 font-bold uppercase tracking-tight">
                                                        <Clock size={8} />
                                                        Saved
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Thanks */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-mono font-bold text-terracotta">{user.thanksCount || 0}</span>
                                                    <div className="flex items-center gap-0.5 text-[8px] text-slate-400 font-bold uppercase tracking-tight">
                                                        <Heart size={8} />
                                                        Thanks
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                {editingId === user.id ? (
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 text-terracotta rounded border-slate-300 focus:ring-terracotta"
                                                        checked={editForm.mentorMode}
                                                        onChange={(e) => setEditForm({ ...editForm, mentorMode: e.target.checked })}
                                                    />
                                                ) : (
                                                    user.mentorMode ? (
                                                        <span className="inline-flex items-center justify-center p-1 bg-sage/10 text-sage rounded-full" title="Active">
                                                            <Brain size={16} />
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                {editingId === user.id ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            className="flex items-center justify-center h-8 w-8 rounded-full text-slate-400 hover:text-sage hover:bg-slate-100 transition-colors"
                                                            onClick={saveEdit}
                                                            title="Save"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button
                                                            className="flex items-center justify-center h-8 w-8 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors"
                                                            onClick={cancelEdit}
                                                            title="Cancel"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            className="flex items-center justify-center h-8 w-8 rounded-full text-slate-400 hover:text-terracotta hover:bg-slate-100 transition-colors"
                                                            onClick={() => startEdit(user)}
                                                            title="Edit"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            className="flex items-center justify-center h-8 w-8 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors"
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </main>
        </div>
    );
}
