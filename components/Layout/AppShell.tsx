'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { useChatSessions } from '@/hooks/useChatRealtime';
import {
    MessageSquare,
    Search,
    PieChart,
    FolderOpen,
    Users,
    Settings,
    Bell,
    LogOut,
    Menu,
    X,
    Database,
    RotateCcw,
    PanelLeft,
    Sparkles,
    ChevronDown,
    ChevronRight,
    Plus,
    Clock,
    MessageSquarePlus,
    Moon,
    Sun,
    User,
    TrendingUp
} from 'lucide-react';
import VitalityGauge from '@/components/ui/VitalityGauge';
import UserSwitcher from '@/components/UserSwitcher';
import KnowledgeRequestModal from '@/components/KnowledgeRequestModal';

import { useToast } from '@/contexts/ToastContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { user, updateUserOption, toggleFocusMode, toggleTheme } = useUser();
    const { showSuccess } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(user.sidebarCollapsed ?? false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Sync state if user object changes (e.g. after initial fetch)
    useEffect(() => {
        if (user.sidebarCollapsed !== undefined) {
            setIsSidebarCollapsed(user.sidebarCollapsed);
        }
    }, [user.sidebarCollapsed]);

    // Chat History Logic
    const { sessions, hasMore, loadMore, isFetchingMore } = useChatSessions(user.id);
    // Notifications
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const res = await fetch(`/api/notifications?userId=${user.id}`);
                const data = await res.json();
                const unread = (data.notifications || []).filter((n: any) => !n.isRead).length;
                setUnreadCount(unread);
            } catch (e) { console.error(e); }
        };
        fetchUnread();
        // Set up interval for "real-time" feel in demo
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, [user.id]);

    const [isChatOpen, setIsChatOpen] = useState(true);

    // Is Admin?
    const isAdmin = (user.role as string) === 'admin' || user.id === 'suzuki_01'; // Demo logic

    const NAV_ITEMS = [
        { label: 'エンゲージメント', icon: <PieChart size={20} />, href: '/', color: 'text-amber-600' },
        { label: 'さがす', icon: <Search size={20} />, href: '/search', color: 'text-sage' },
    ];

    const ADMIN_ITEMS = [
        { label: 'ダッシュボード', icon: <TrendingUp size={18} />, href: '/admin/dashboard' },
        { label: 'ファイル管理', icon: <FolderOpen size={18} />, href: '/admin/files' },
        { label: 'ナレッジ管理', icon: <Database size={18} />, href: '/admin/knowledge' },
        { label: 'ユーザー管理', icon: <Users size={18} />, href: '/admin/users' },
    ];

    const isActive = (path: string) => pathname === path;

    return (
        <div className="h-screen bg-background text-taupe flex overflow-hidden">
            {/* --- Left Sidebar (Desktop) --- */}
            {/* --- Left Sidebar (Desktop) --- */}
            <aside className={`hidden lg:flex flex-col bg-card/80 backdrop-blur-xl border-r border-slate-100 dark:border-stone-800 h-full fixed top-0 left-0 z-50 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
                {/* Logo Area */}
                <div className="h-16 border-b border-slate-100 dark:border-stone-800 flex items-center gap-3 px-4">
                    <button
                        onClick={() => {
                            const newState = !isSidebarCollapsed;
                            setIsSidebarCollapsed(newState);
                            updateUserOption('sidebarCollapsed', newState);
                        }}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                    {!isSidebarCollapsed && (
                        <Link href="/">
                            <div className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                                <div className="w-12 h-12 rounded-full overflow-hidden border border-border shadow-sm shrink-0">
                                    <img src="/Mr.OWL_Silhouette.png" alt="OWL" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col">
                                    <h1 className="font-bold text-base tracking-tight text-foreground">OWLight</h1>
                                </div>
                            </div>
                        </Link>
                    )}
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
                    <p className={`px-4 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-2 transition-opacity ${isSidebarCollapsed ? 'opacity-0 h-0 hidden' : 'opacity-100'}`}>Main</p>
                    {NAV_ITEMS.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <div className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${isActive(item.href) ? 'bg-muted shadow-sm' : 'hover:bg-muted/50'} ${isSidebarCollapsed ? 'justify-center' : ''}`} title={isSidebarCollapsed ? item.label : ''}>
                                <div className={`${isActive(item.href) ? item.color : 'text-muted-foreground group-hover:text-foreground'} transition-colors shrink-0`}>
                                    {item.icon}
                                </div>
                                {!isSidebarCollapsed && (
                                    <>
                                        <span className={`text-sm font-bold truncate ${isActive(item.href) ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                            {item.label}
                                        </span>
                                        {isActive(item.href) && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />}
                                    </>
                                )}
                            </div>
                        </Link>
                    ))}

                    {/* Knowledge Registration Button */}
                    <div className={isSidebarCollapsed ? 'px-2' : 'px-3'}>
                        <button
                            onClick={() => setIsGlobalModalOpen(true)}
                            className={`mt-2 p-2.5 rounded-xl border border-dashed border-terracotta/30 flex items-center gap-3 text-terracotta hover:bg-terracotta/5 transition-colors group w-full ${isSidebarCollapsed ? 'justify-center mx-0 px-0' : ''}`}
                            title="ナレッジ登録"
                        >
                            <div className="relative shrink-0 w-5 h-6 flex items-center justify-center">
                                <Database size={20} className="text-terracotta group-hover:scale-110 transition-transform" />
                                <div className="absolute -top-1 -right-1 bg-terracotta text-white text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center border-2 border-white shadow-sm">
                                    <Plus size={10} />
                                </div>
                            </div>
                            {!isSidebarCollapsed && <span className="font-bold text-xs truncate">ナレッジ登録</span>}
                        </button>
                    </div>

                    {/* Chat Section */}
                    <div className="pt-4">
                        {!isSidebarCollapsed ? (
                            <button
                                onClick={() => setIsChatOpen(!isChatOpen)}
                                className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold text-taupe-light/50 uppercase tracking-widest hover:text-taupe transition-colors group mb-1"
                            >
                                <span className="flex items-center gap-2">
                                    チャット
                                </span>
                                {isChatOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                        ) : (
                            <div className="h-4" /> // Spacer
                        )}

                        {(isChatOpen || isSidebarCollapsed) && (
                            <div className="space-y-1">
                                <Link href="/chat">
                                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group hover:bg-slate-50 ${pathname === '/chat' && !searchParams.get('id') ? 'bg-slate-50 text-terracotta' : ''} ${isSidebarCollapsed ? 'justify-center' : ''}`} title="新規チャット">
                                        <div className="relative shrink-0 w-5 h-6 flex items-center justify-center">
                                            <MessageSquare size={20} className="text-terracotta/80 group-hover:text-terracotta transition-colors group-hover:scale-110" />
                                            <div className="absolute -top-1 -right-1 bg-terracotta text-white text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center border-2 border-white shadow-sm">
                                                <Plus size={10} />
                                            </div>
                                        </div>
                                        {!isSidebarCollapsed && <span className="text-xs font-bold text-taupe-light group-hover:text-taupe truncate">新規チャット</span>}
                                    </div>
                                </Link>

                                {!isSidebarCollapsed && sessions.map(session => (
                                    <Link key={session.id} href={`/chat?id=${session.id}`}>
                                        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 group hover:bg-slate-50 ${pathname === '/chat' && searchParams.get('id') === session.id ? 'bg-slate-50' : ''}`}>
                                            <MessageSquare size={14} className="text-taupe-light/50 group-hover:text-terracotta transition-colors flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-taupe truncate">{session.title}</p>
                                                <p className="text-[9px] text-taupe-light/50">
                                                    {new Date(session.updatedAt || Date.now()).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}

                                {/* Load More */}
                                {!isSidebarCollapsed && hasMore && (
                                    <div className="px-4 py-2">
                                        <button
                                            onClick={loadMore}
                                            disabled={isFetchingMore}
                                            className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-bold text-taupe-light/60 hover:text-terracotta border border-dashed border-slate-200 rounded-lg hover:border-terracotta/30 transition-all disabled:opacity-50"
                                        >
                                            {isFetchingMore ? (
                                                <>
                                                    <RotateCcw size={12} className="animate-spin" />
                                                    読み込み中...
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown size={12} />
                                                    さらに読み込む
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {isAdmin && (
                        <>
                            <div className="my-6 border-t border-slate-100 mx-4" />
                            {!isSidebarCollapsed && <p className="px-4 text-[10px] font-bold text-taupe-light/40 uppercase tracking-widest mb-2">管理ツール</p>}
                            {ADMIN_ITEMS.map((item) => (
                                <Link key={item.href} href={item.href}>
                                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive(item.href) ? 'bg-slate-100' : 'hover:bg-slate-50'} ${isSidebarCollapsed ? 'justify-center' : ''}`} title={item.label}>
                                        <div className="text-slate-400 group-hover:text-slate-600 shrink-0">
                                            {item.icon}
                                        </div>
                                        {!isSidebarCollapsed && (
                                            <span className={`text-sm font-medium truncate ${isActive(item.href) ? 'text-taupe font-bold' : 'text-taupe-light group-hover:text-taupe'}`}>
                                                {item.label}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                            {/* Dev: Reset Morning Ritual */}
                            <button
                                onClick={() => {
                                    router.push('./?ritual=reset');
                                }}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group hover:bg-slate-50 w-full text-left ${isSidebarCollapsed ? 'justify-center' : ''}`}
                                title="儀式をリセット"
                            >
                                <div className="text-slate-400 group-hover:text-terracotta shrink-0">
                                    <RotateCcw size={16} />
                                </div>
                                {!isSidebarCollapsed && (
                                    <span className="text-sm font-medium text-taupe-light group-hover:text-taupe truncate">
                                        儀式をリセット
                                    </span>
                                )}
                            </button>
                        </>
                    )}
                </nav>

                {/* Footer User Profile REMOVED as per request */}
            </aside>

            {/* --- Main Content Area --- */}
            <div className={`flex-1 flex flex-col h-full relative transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>

                {/* Mobile Header */}
                <header className="lg:hidden h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-40">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-taupe-light">
                        <Menu size={20} />
                    </button>
                    <span className="font-bold text-taupe">OWLight</span>
                    <div className="w-8" /> {/* Spacer */}
                </header>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="w-64 bg-white h-full shadow-2xl p-4 flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <span className="font-bold text-lg">Menu</span>
                                <button onClick={() => setIsMobileMenuOpen(false)}><X size={20} /></button>
                            </div>
                            {/* Same nav items as desktop... simplified for brevity */}
                            <nav className="space-y-4">
                                {NAV_ITEMS.map(item => (
                                    <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                                        <div className="flex items-center gap-3 text-sm font-bold text-taupe py-2">
                                            {item.icon} {item.label}
                                        </div>
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </div>
                )}

                {/* --- Top Bar (Desktop) --- */}
                <header className="hidden lg:flex h-16 items-center justify-between px-8 bg-card/50 backdrop-blur-sm border-b border-slate-100 dark:border-stone-800 sticky top-0 z-30 gap-6">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium flex-1 min-w-0">
                        <PanelLeft size={14} className="shrink-0" />
                        <span className="shrink-0">/</span>
                        <span className="text-sm font-bold text-foreground truncate" title="Page Title">
                            {(() => {
                                if (pathname === '/chat' && searchParams.get('id')) {
                                    const session = sessions.find(s => s.id === searchParams.get('id'));
                                    return session ? session.title : 'Chat';
                                }
                                return NAV_ITEMS.find(n => n.href === pathname)?.label ||
                                    ADMIN_ITEMS.find(n => n.href === pathname)?.label || 'Page';
                            })()}
                        </span>
                    </div>

                    {/* Center: UserSwitcher (Softly Displayed) */}
                    <div className="opacity-60 hover:opacity-100 transition-opacity shrink-0">
                        <UserSwitcher />
                    </div>

                    {/* Right: Points & Icons (Fixed Width) */}
                    <div className="flex items-center gap-6 shrink-0">
                        {/* 1. OWL Points */}
                        <div className="flex flex-col items-end mr-2">
                            <div className="text-[10px] font-bold text-taupe-light">OWL Points</div>
                            <div className="text-lg font-black text-terracotta tracking-tighter leading-none">{user.points} <span className="text-[10px]">pts</span></div>
                        </div>

                        <div className="h-6 w-px bg-slate-200 mx-1" />

                        {/* 2. Bell (Notifications) */}
                        <Link href="/?tab=notifications">
                            <button className="relative p-2 text-slate-400 hover:text-terracotta transition-colors">
                                <Bell size={18} />
                                {!user.focusMode && unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-terracotta text-white text-[9px] font-black rounded-full border border-white flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                                {user.focusMode && unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-slate-300 rounded-full" title={`${unreadCount}件の通知（集中モード中）`} />
                                )}
                            </button>
                        </Link>

                        {/* 3. Moon (Focus Mode) */}
                        <button
                            onClick={toggleFocusMode}
                            className={`relative p-2 rounded-lg transition-all ${user.focusMode ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            title={user.focusMode ? '集中モード ON - クリックで解除' : '集中モード OFF - クリックで有効化'}
                        >
                            <Moon size={18} />
                            {user.focusMode && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                            )}
                        </button>

                        {/* 4. Person Icon (Profile Link) */}
                        <Link href="/profile">
                            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-100" title="プロファイル">
                                <User size={18} />
                            </button>
                        </Link>

                        {/* 5. Gear Icon (Settings) -> Quick Settings Popover */}
                        <div className="relative">
                            <button
                                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                className={`p-2 transition-colors rounded-full ${isSettingsOpen ? 'bg-slate-100 text-taupe' : 'text-slate-400 hover:text-taupe hover:bg-slate-100'}`}
                                title="設定"
                            >
                                <Settings size={18} />
                            </button>

                            {/* Settings Popover */}
                            {isSettingsOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)} />
                                    <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-border p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Quick Settings</h3>

                                        {/* Theme Toggle */}
                                        <div className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-2">
                                                {user.theme === 'dark' ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-500" />}
                                                <span className="text-sm font-medium text-taupe dark:text-slate-200">外観モード</span>
                                            </div>
                                            <button
                                                onClick={toggleTheme}
                                                className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 dark:bg-slate-700 transition-colors"
                                            >
                                                <span className="sr-only">Toggle Theme</span>
                                                <span
                                                    className={`${user.theme === 'dark' ? 'translate-x-6 bg-indigo-400' : 'translate-x-1 bg-white'
                                                        } inline-block h-4 w-4 transform rounded-full transition-transform duration-200 shadow-sm`}
                                                />
                                            </button>
                                        </div>

                                    </div>
                                </>
                            )}
                        </div>

                        {/* 6. Log Off */}
                        <Link href="/closing">
                            <button className="p-2 text-slate-400 hover:text-terracotta transition-colors" title="業務を終了する">
                                <LogOut size={18} />
                            </button>
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden">
                    {children}
                    <KnowledgeRequestModal
                        isOpen={isGlobalModalOpen}
                        onClose={() => setIsGlobalModalOpen(false)}
                        messages={[]}
                        onCreated={() => {
                            setIsGlobalModalOpen(false);
                            // Using a temporary solution or assume we add useToast at the top
                            // Since hooks rule apply, we need to extract this or ensure useToast is available.
                            // Actually, I need to add useToast() to the component body first.
                        }}
                    />
                </main>

            </div>
            <KnowledgeRequestModal
                isOpen={isGlobalModalOpen}
                onClose={() => setIsGlobalModalOpen(false)}
                messages={[]}
                onCreated={() => { setIsGlobalModalOpen(false); showSuccess("リクエストを受信しました", "OWLが知恵の種を受け取りました。"); }}
            />
        </div>
    );
}
