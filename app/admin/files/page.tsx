'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import UserSwitcher from '@/components/UserSwitcher'; // Added
import {
    FileText,
    Trash2,
    UploadCloud,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowLeft,
    Search,
    RefreshCcw,
    FileCode,
    FileSpreadsheet,
    FileJson,
    File as FileIcon
} from 'lucide-react';

// --- Simple Components (Consistent with Chat Page) ---

const Button = ({ children, variant = "primary", className = "", ...props }: any) => {
    const baseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 shadow-sm active:scale-95";
    const variants = {
        primary: "bg-terracotta text-white hover:bg-terracotta/90",
        secondary: "bg-white text-taupe border border-slate-200 hover:bg-slate-50 hover:text-terracotta",
        ghost: "hover:bg-slate-100 text-taupe-light hover:text-terracotta transition-colors shadow-none",
        outline: "border border-slate-200 bg-transparent hover:bg-slate-100 text-taupe shadow-none",
        destructive: "bg-white text-red-500 border border-slate-200 hover:bg-red-50 hover:border-red-200 shadow-none"
    };
    return (
        <button className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>
            {children}
        </button>
    );
};

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`rounded-xl border border-slate-200 bg-white text-taupe shadow-sm ${className}`}>
        {children}
    </div>
);

interface GoogleFile {
    name: string;
    displayName: string;
    mimeType: string;
    sizeBytes: string;
    createTime: string;
    state: string;
    uri: string;
}

export default function FileAdminPage() {
    const [files, setFiles] = useState<GoogleFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/files');
            const data = await res.json();
            if (data.files) setFiles(data.files);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0]);
    };

    const handleUpload = async (file: File) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetch('/api/files', { method: 'POST', body: formData });
            if (!res.ok) throw new Error("Upload failed");
            await fetchFiles();
        } catch (error) {
            alert("アップロードに失敗しました");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (name: string) => {
        if (!confirm("本当にこのファイルを削除しますか？")) return;
        try {
            const res = await fetch(`/api/files?name=${name}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Delete failed");
            setFiles(prev => prev.filter(f => f.name !== name));
        } catch (error) {
            alert("削除に失敗しました");
        }
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.includes('pdf')) return <FileText className="text-red-500" size={20} />;
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="text-green-600" size={20} />;
        if (mimeType.includes('word') || mimeType.includes('officedocument')) return <FileIcon className="text-blue-600" size={20} />;
        if (mimeType.includes('json')) return <FileJson className="text-amber-500" size={20} />;
        if (mimeType.includes('markdown') || mimeType.includes('text')) return <FileCode className="text-slate-500" size={20} />;
        return <FileIcon className="text-slate-400" size={20} />;
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

            {/* Header (Consistent with Chat) */}
            <header className="sticky top-0 z-10 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 h-14 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full border border-terracotta overflow-hidden shadow-sm">
                        <img src="/Mr.OWL.jpg" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="font-bold text-taupe text-lg tracking-tight">OWLight</span>
                        <span className="text-taupe-light text-[10px] font-bold uppercase tracking-wider border border-slate-200 rounded px-1.5 py-0.5">Admin</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <UserSwitcher />
                    <Link href="/">
                        <Button variant="ghost" className="h-8 text-xs font-semibold">
                            <ArrowLeft size={14} className="mr-2" />
                            チャットに戻る
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col gap-8">

                {/* Page Hero */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-taupe tracking-tight mb-1 font-display">ファイル管理</h1>
                        <p className="text-taupe-light text-sm font-medium">RAG（検索拡張生成）で使用されるナレッジベースを管理します。</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left: Uploader (SaaS Card Style) */}
                    <div className="lg:col-span-1">
                        <Card className="p-6 sticky top-24">
                            <h3 className="text-sm font-bold text-taupe uppercase tracking-wider mb-4 flex items-center">
                                <UploadCloud size={16} className="mr-2 text-terracotta" />
                                クイックアップロード
                            </h3>
                            <div
                                className={`
                                    relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                                    ${dragActive ? 'border-terracotta bg-terracotta/5' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'}
                                    ${isUploading ? 'opacity-50' : ''}
                                `}
                                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                            >
                                <div className="flex flex-col items-center">
                                    <div className={`p-3 rounded-full mb-4 ${dragActive ? 'bg-terracotta/10' : 'bg-white shadow-sm'}`}>
                                        <UploadCloud size={24} className={dragActive ? 'text-terracotta' : 'text-slate-400'} />
                                    </div>
                                    <p className="text-sm font-bold text-taupe mb-1">
                                        {isUploading ? "アップロード中..." : "ここにファイルをドロップ"}
                                    </p>
                                    <p className="text-xs text-taupe-light mb-4 text-center">
                                        PDF, Word, Excel, Markdown
                                    </p>

                                    {!isUploading && (
                                        <label className="w-full">
                                            <Button variant="secondary" className="w-full text-xs">
                                                ファイルを選択
                                            </Button>
                                            <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} accept=".md,.txt,.pdf,.docx,.xlsx" />
                                        </label>
                                    )}
                                </div>
                            </div>
                            <div className="mt-6 flex flex-col gap-2">
                                <div className="flex items-center text-[10px] text-taupe-light font-medium bg-slate-50 p-2 rounded-lg">
                                    <AlertCircle size={12} className="mr-2 text-amber-500" />
                                    Files are processed for AI automatically.
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right: List (Modern Data Grid Style) */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="relative flex-1 max-w-xs">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="ファイルをフィルタ..."
                                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-terracotta/10 focus:border-terracotta transition-all"
                                />
                            </div>
                            <Button variant="outline" className="h-8 w-8 p-0" onClick={fetchFiles} disabled={isLoading}>
                                <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} />
                            </Button>
                        </div>

                        <Card className="overflow-hidden">
                            {isLoading && files.length === 0 ? (
                                <div className="p-20 text-center text-slate-300">
                                    <div className="animate-spin h-6 w-6 border-2 border-slate-200 border-t-terracotta rounded-full mx-auto mb-4"></div>
                                    <p className="text-xs font-medium">読み込み中...</p>
                                </div>
                            ) : files.length === 0 ? (
                                <div className="p-20 text-center text-slate-300 flex flex-col items-center">
                                    <div className="p-4 bg-slate-50 rounded-full mb-4">
                                        <FileIcon size={32} strokeWidth={1} />
                                    </div>
                                    <p className="text-xs font-medium">ファイルが見つかりません。</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {files.map((file) => (
                                        <div key={file.name} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                    {getFileIcon(file.mimeType)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-bold text-taupe truncate max-w-[200px] sm:max-w-xs" title={file.displayName}>
                                                        {file.displayName}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-0.5 text-[10px] font-bold tracking-tight uppercase">
                                                        <span className={`flex items-center gap-1 ${file.state === 'ACTIVE' ? 'text-sage' : 'text-amber-500'}`}>
                                                            {file.state === 'ACTIVE' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                                            {file.state === 'ACTIVE' ? '利用可能' : '処理中'}
                                                        </span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="text-slate-400">{(parseInt(file.sizeBytes) / 1024).toFixed(1)} KB</span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="text-slate-400">{new Date(file.createTime).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                variant="destructive"
                                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleDelete(file.name)}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                        <div className="px-2">
                            <p className="text-[10px] text-slate-400 font-medium italic">
                                * Active files are automatically indexed for AI support and searched during chat.
                            </p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
