"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type Theme = "dark" | "pink" | "light" | "midnight"

type Bucket = {
    id: string
    name: string
    icon: string
    color: string
    balance: number
    goalAmount: number | null
    description: string | null
}

type Transaction = {
    id: string
    type: string
    amount: number
    description: string | null
    createdAt: string
    bucket: { name: string; icon: string }
}

type DashboardData = {
    patrimonioAtual: number
    totalAlocado: number
    naoAlocado: number
    metasAtingidas: number
    metasTotal: number
    totalMetas: number
    buckets: Bucket[]
}

function fmt(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "2-digit",
        hour: "2-digit", minute: "2-digit"
    })
}

const ICONS = ["💰", "🏖️", "🏠", "🚗", "📚", "🏥", "💍", "✈️", "🎮", "👶", "🐱", "💼", "🎯", "🛒", "⚡"]

const TX_LABEL: Record<string, string> = {
    APORTE: "Aporte",
    RETIRADA: "Retirada",
    RENDIMENTO: "Rendimento",
    TRANSFERENCIA: "Transferência",
}

const THEMES: Record<Theme, {
    label: string
    emoji: string
    bg: string
    surface: string
    border: string
    text: string
    textMuted: string
    textFaint: string
    divider: string
    btnPrimary: string
    btnPrimaryHover: string
    btnSecondary: string
    btnSecondaryHover: string
    input: string
    inputBorder: string
    inputFocus: string
    accentText: string
    progressBg: string
    headerBorder: string
}> = {
    dark: {
        label: "Escuro", emoji: "🌙",
        bg: "bg-gray-950",
        surface: "bg-gray-900",
        border: "border-gray-800",
        text: "text-white",
        textMuted: "text-gray-400",
        textFaint: "text-gray-600",
        divider: "divide-gray-800",
        btnPrimary: "bg-indigo-600",
        btnPrimaryHover: "hover:bg-indigo-500",
        btnSecondary: "bg-gray-800",
        btnSecondaryHover: "hover:bg-gray-700",
        input: "bg-gray-800",
        inputBorder: "border-gray-700",
        inputFocus: "focus:border-indigo-500",
        accentText: "text-indigo-400",
        progressBg: "bg-indigo-500",
        headerBorder: "border-gray-800",
    },
    pink: {
        label: "Rosa", emoji: "🌸",
        bg: "bg-pink-950",
        surface: "bg-pink-900/60",
        border: "border-pink-800/60",
        text: "text-white",
        textMuted: "text-pink-200",
        textFaint: "text-pink-400/50",
        divider: "divide-pink-800/40",
        btnPrimary: "bg-pink-500",
        btnPrimaryHover: "hover:bg-pink-400",
        btnSecondary: "bg-pink-900",
        btnSecondaryHover: "hover:bg-pink-800",
        input: "bg-pink-900/80",
        inputBorder: "border-pink-700",
        inputFocus: "focus:border-pink-400",
        accentText: "text-pink-300",
        progressBg: "bg-pink-400",
        headerBorder: "border-pink-800/60",
    },
    light: {
        label: "Claro", emoji: "☀️",
        bg: "bg-slate-100",
        surface: "bg-white",
        border: "border-slate-200",
        text: "text-slate-900",
        textMuted: "text-slate-500",
        textFaint: "text-slate-400",
        divider: "divide-slate-100",
        btnPrimary: "bg-violet-600",
        btnPrimaryHover: "hover:bg-violet-500",
        btnSecondary: "bg-slate-200",
        btnSecondaryHover: "hover:bg-slate-300",
        input: "bg-slate-50",
        inputBorder: "border-slate-300",
        inputFocus: "focus:border-violet-500",
        accentText: "text-violet-600",
        progressBg: "bg-violet-500",
        headerBorder: "border-slate-200",
    },
    midnight: {
        label: "Meia-noite", emoji: "🌌",
        bg: "bg-slate-950",
        surface: "bg-slate-900",
        border: "border-slate-700/50",
        text: "text-slate-100",
        textMuted: "text-slate-400",
        textFaint: "text-slate-600",
        divider: "divide-slate-700/50",
        btnPrimary: "bg-cyan-600",
        btnPrimaryHover: "hover:bg-cyan-500",
        btnSecondary: "bg-slate-800",
        btnSecondaryHover: "hover:bg-slate-700",
        input: "bg-slate-800",
        inputBorder: "border-slate-600",
        inputFocus: "focus:border-cyan-500",
        accentText: "text-cyan-400",
        progressBg: "bg-cyan-500",
        headerBorder: "border-slate-700/50",
    },
}

const THEME_ORDER: Theme[] = ["dark", "pink", "light", "midnight"]

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [data, setData] = useState<DashboardData | null>(null)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(false)
    const [theme, setTheme] = useState<Theme>("dark")

    // Modals
    const [showSnapshot, setShowSnapshot] = useState(false)
    const [showBucket, setShowBucket] = useState(false)
    const [showTransaction, setShowTransaction] = useState(false)
    const [editingBucket, setEditingBucket] = useState<Bucket | null>(null)
    const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null)
    const [bucketTxs, setBucketTxs] = useState<Transaction[]>([])

    // Snapshot form
    const [snapshotValue, setSnapshotValue] = useState("")

    // Bucket form
    const [bucketName, setBucketName] = useState("")
    const [bucketGoal, setBucketGoal] = useState("")
    const [bucketIcon, setBucketIcon] = useState("💰")
    const [bucketColor, setBucketColor] = useState("#6366f1")
    const [bucketDesc, setBucketDesc] = useState("")

    // Transaction form
    const [txBucket, setTxBucket] = useState("")
    const [txType, setTxType] = useState("APORTE")
    const [txAmount, setTxAmount] = useState("")
    const [txDesc, setTxDesc] = useState("")

    const t = THEMES[theme]

    useEffect(() => {
        const saved = localStorage.getItem("theme") as Theme | null
        if (saved && THEMES[saved]) setTheme(saved)
    }, [])

    function cycleTheme() {
        const next = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length]
        setTheme(next)
        localStorage.setItem("theme", next)
    }

    useEffect(() => {
        if (status === "unauthenticated") router.push("/auth/login")
    }, [status, router])

    useEffect(() => {
        if (status === "authenticated") {
            fetchData()
            fetchTransactions()
        }
    }, [status])

    async function fetchData() {
        const res = await fetch("/api/dashboard")
        const json = await res.json()
        setData(json)
    }

    async function fetchTransactions() {
        const res = await fetch("/api/transactions")
        const json = await res.json()
        setTransactions(json)
    }

    async function openBucketDetail(bucket: Bucket) {
        setSelectedBucket(bucket)
        const res = await fetch(`/api/transactions?bucketId=${bucket.id}`)
        const json = await res.json()
        setBucketTxs(json)
    }

    function openEditBucket(bucket: Bucket, e: React.MouseEvent) {
        e.stopPropagation()
        setEditingBucket(bucket)
        setBucketName(bucket.name)
        setBucketGoal(bucket.goalAmount ? String(bucket.goalAmount) : "")
        setBucketIcon(bucket.icon)
        setBucketColor(bucket.color)
        setBucketDesc(bucket.description || "")
        setShowBucket(true)
    }

    function openNewBucket() {
        setEditingBucket(null)
        setBucketName("")
        setBucketGoal("")
        setBucketIcon("💰")
        setBucketColor("#6366f1")
        setBucketDesc("")
        setShowBucket(true)
    }

    async function handleSnapshot(e: React.FormEvent) {
        e.preventDefault()
        const parsed = parseFloat(snapshotValue.replace(",", "."))
        if (isNaN(parsed) || parsed <= 0) { alert("Digite um valor válido maior que zero."); return }
        setLoading(true)
        const res = await fetch("/api/snapshots", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ totalBalance: parsed }),
        })
        const json = await res.json()
        if (!res.ok) { alert(json.error); setLoading(false); return }
        await fetchData()
        setSnapshotValue("")
        setShowSnapshot(false)
        setLoading(false)
    }

    async function handleBucket(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        const body = {
            name: bucketName,
            goalAmount: bucketGoal ? parseFloat(bucketGoal.replace(",", ".")) : null,
            icon: bucketIcon,
            color: bucketColor,
            description: bucketDesc || null,
        }
        if (editingBucket) {
            await fetch(`/api/buckets/${editingBucket.id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
        } else {
            await fetch("/api/buckets", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
        }
        /*
        if (!editingBucket && bucketIcon === "🐱" && bucketName.toLowerCase().trim() === "stella") {
            await fetchData()
            setShowBucket(false)
            setLoading(false)
            router.push("/love")
            return
        }
        */
        await fetchData()
        setShowBucket(false)
        setLoading(false)
    }

    async function handleDeleteBucket(id: string, e: React.MouseEvent) {
        e.stopPropagation()
        if (!confirm("Excluir esta caixinha? Todas as transações serão perdidas.")) return
        setLoading(true)
        await fetch(`/api/buckets/${id}`, { method: "DELETE" })
        await fetchData()
        await fetchTransactions()
        setLoading(false)
    }

    async function handleTransaction(e: React.FormEvent) {
        e.preventDefault()
        const parsed = parseFloat(txAmount.replace(",", "."))
        if (isNaN(parsed) || parsed <= 0) { alert("Digite um valor válido maior que zero."); return }
        setLoading(true)
        const res = await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bucketId: txBucket, type: txType, amount: parsed, description: txDesc }),
        })
        const json = await res.json()
        if (!res.ok) { alert(json.error); setLoading(false); return }
        await fetchData()
        await fetchTransactions()
        setTxAmount("")
        setTxDesc("")
        setShowTransaction(false)
        setLoading(false)
    }

    if (status === "loading" || !data) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <p className="text-gray-400">Carregando...</p>
            </div>
        )
    }

    const modalBase = `fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50`
    const modalBox = `${t.surface} rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md border ${t.border}`
    const inputClass = `w-full ${t.input} border ${t.inputBorder} rounded-lg px-4 py-3 ${t.text} focus:outline-none ${t.inputFocus}`

    return (
        <div className={`min-h-screen ${t.bg} ${t.text}`}>
            {/* Header */}
            <header className={`border-b ${t.headerBorder} px-4 py-4 flex items-center justify-between`}>
                <h1 className="text-xl font-bold">🪙 Caixinhas</h1>
                <div className="flex items-center gap-2">
                    <span className={`${t.textMuted} text-xs hidden sm:block`}>{session?.user?.name || session?.user?.email}</span>
                    <button
                        onClick={cycleTheme}
                        className={`text-xs border ${t.border} rounded-lg px-3 py-1.5 transition-colors ${t.textMuted}`}
                        title="Trocar tema"
                    >
                        {THEMES[theme].emoji} {THEMES[theme].label}
                    </button>
                    <button
                        onClick={() => signOut()}
                        className={`text-xs ${t.textMuted} hover:${t.text} transition-colors border ${t.border} rounded-lg px-3 py-1.5`}
                    >
                        Sair
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">

                {/* Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className={`${t.surface} rounded-2xl p-4 border ${t.border} col-span-2`}>
                        <p className={`${t.textMuted} text-xs mb-1`}>Patrimônio total</p>
                        <p className="text-2xl font-bold">{fmt(data.patrimonioAtual)}</p>
                    </div>
                    <div className={`${t.surface} rounded-2xl p-4 border ${t.border}`}>
                        <p className={`${t.textMuted} text-xs mb-1`}>Alocado nas caixinhas</p>
                        <p className={`text-xl font-bold ${t.accentText}`}>{fmt(data.totalAlocado)}</p>
                    </div>
                    <div className={`${t.surface} rounded-2xl p-4 border ${t.border}`}>
                        <p className={`${t.textMuted} text-xs mb-1`}>Não alocado</p>
                        <p className="text-xl font-bold">{fmt(data.naoAlocado)}</p>
                    </div>
                    <div className={`${t.surface} rounded-2xl p-4 border ${t.border} col-span-2`}>
                        <p className={`${t.textMuted} text-xs mb-1`}>Metas atingidas</p>
                        <p className={`text-xl font-bold text-emerald-400`}>
                            {data.metasAtingidas}<span className={`${t.textMuted} text-sm font-normal`}> / {data.metasTotal}</span>
                        </p>
                    </div>
                </div>

                {/* Progresso geral */}
                {data.totalMetas > 0 && (
                    <div className={`${t.surface} rounded-2xl p-4 border ${t.border}`}>
                        <div className="flex items-center justify-between mb-2">
                            <p className={`${t.textMuted} text-xs`}>Progresso geral das metas</p>
                            <p className={`text-xs ${t.text}`}>{fmt(data.patrimonioAtual)} / {fmt(data.totalMetas)}</p>
                        </div>
                        <div className={`${t.input} rounded-full h-2.5`}>
                            <div className={`${t.progressBg} h-2.5 rounded-full transition-all`}
                                style={{ width: `${Math.min((data.patrimonioAtual / data.totalMetas) * 100, 100)}%` }} />
                        </div>
                        <p className={`text-xs ${t.textFaint} mt-1.5`}>
                            Faltam {fmt(Math.max(data.totalMetas - data.patrimonioAtual, 0))} para todas as metas
                        </p>
                    </div>
                )}

                {/* Ações */}
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setShowSnapshot(true)} className={`${t.btnPrimary} ${t.btnPrimaryHover} px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white`}>
                        📊 Atualizar patrimônio
                    </button>
                    <button onClick={openNewBucket} className={`${t.btnSecondary} ${t.btnSecondaryHover} px-4 py-2 rounded-lg text-sm font-medium transition-colors`}>
                        ➕ Nova caixinha
                    </button>
                    {data.buckets.length > 0 && (
                        <button onClick={() => setShowTransaction(true)} className={`${t.btnSecondary} ${t.btnSecondaryHover} px-4 py-2 rounded-lg text-sm font-medium transition-colors`}>
                            💸 Movimentação
                        </button>
                    )}
                </div>

                {/* Caixinhas */}
                <div>
                    <h2 className={`text-xs font-semibold ${t.textMuted} uppercase tracking-wider mb-3`}>Suas caixinhas</h2>
                    {data.buckets.length === 0 ? (
                        <div className={`${t.surface} rounded-2xl p-10 border ${t.border} text-center`}>
                            <p className="text-4xl mb-3">📦</p>
                            <p className={t.textMuted}>Nenhuma caixinha ainda.</p>
                            <p className={`${t.textFaint} text-sm mt-1`}>Crie sua primeira caixinha para começar!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {data.buckets.map((bucket) => {
                                const percent = bucket.goalAmount
                                    ? Math.min((bucket.balance / bucket.goalAmount) * 100, 100)
                                    : null
                                return (
                                    <div key={bucket.id}
                                        className={`${t.surface} rounded-2xl p-4 border ${t.border} cursor-pointer transition-colors`}
                                        onClick={() => openBucketDetail(bucket)}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-2xl">{bucket.icon}</span>
                                                <div>
                                                    <p className="font-semibold text-sm">{bucket.name}</p>
                                                    {bucket.description && <p className={`text-xs ${t.textFaint}`}>{bucket.description}</p>}
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button onClick={(e) => openEditBucket(bucket, e)} className={`${t.textFaint} hover:${t.text} p-1 transition-colors`}>✏️</button>
                                                <button onClick={(e) => handleDeleteBucket(bucket.id, e)} className={`${t.textFaint} hover:text-red-400 p-1 transition-colors`}>🗑️</button>
                                            </div>
                                        </div>
                                        <p className="text-xl font-bold mb-1">{fmt(bucket.balance)}</p>
                                        {bucket.goalAmount && (
                                            <>
                                                <p className={`text-xs ${t.textFaint} mb-1.5`}>Meta: {fmt(bucket.goalAmount)}</p>
                                                <div className={`${t.input} rounded-full h-1.5`}>
                                                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: bucket.color }} />
                                                </div>
                                                <p className={`text-xs ${t.textFaint} mt-1`}>{percent?.toFixed(1)}%</p>
                                            </>
                                        )}
                                        <p className={`text-xs ${t.textFaint} mt-2`}>Toque para ver histórico →</p>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Log de atividades */}
                {transactions.length > 0 && (
                    <div>
                        <h2 className={`text-xs font-semibold ${t.textMuted} uppercase tracking-wider mb-3`}>Atividade recente</h2>
                        <div className={`${t.surface} rounded-2xl border ${t.border} divide-y ${t.divider}`}>
                            {transactions.slice(0, 30).map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{tx.bucket.icon}</span>
                                        <div>
                                            <p className="text-sm font-medium">{TX_LABEL[tx.type]} · {tx.bucket.name}</p>
                                            {tx.description && <p className={`text-xs ${t.textMuted}`}>{tx.description}</p>}
                                            <p className={`text-xs ${t.textFaint}`}>{fmtDate(tx.createdAt)}</p>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-semibold ${tx.type === "RETIRADA" ? "text-red-400" : "text-emerald-400"}`}>
                                        {tx.type === "RETIRADA" ? "-" : "+"}{fmt(tx.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Modal: Snapshot */}
            {showSnapshot && (
                <div className={modalBase}>
                    <div className={modalBox}>
                        <h3 className="text-lg font-semibold mb-1">Atualizar patrimônio</h3>
                        <p className={`text-xs ${t.textMuted} mb-4`}>Informe o saldo total atual da sua conta no banco.</p>
                        <form onSubmit={handleSnapshot} className="space-y-4">
                            <div>
                                <label className={`block text-sm ${t.textMuted} mb-1`}>Saldo atual (R$)</label>
                                <input type="text" inputMode="decimal" value={snapshotValue}
                                    onChange={(e) => setSnapshotValue(e.target.value)}
                                    className={inputClass} placeholder="Ex: 20200,00" autoFocus required />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowSnapshot(false)} className={`flex-1 ${t.btnSecondary} ${t.btnSecondaryHover} py-3 rounded-lg text-sm transition-colors`}>Cancelar</button>
                                <button type="submit" disabled={loading} className={`flex-1 ${t.btnPrimary} ${t.btnPrimaryHover} py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 text-white`}>
                                    {loading ? "Salvando..." : "Salvar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Caixinha */}
            {showBucket && (
                <div className={modalBase}>
                    <div className={`${modalBox} max-h-[90vh] overflow-y-auto`}>
                        <h3 className="text-lg font-semibold mb-4">{editingBucket ? "Editar caixinha" : "Nova caixinha"}</h3>
                        <form onSubmit={handleBucket} className="space-y-4">
                            <div>
                                <label className={`block text-sm ${t.textMuted} mb-1`}>Nome</label>
                                <input type="text" value={bucketName} onChange={(e) => setBucketName(e.target.value)} className={inputClass} placeholder="Ex: Viagem, Emergência..." required />
                            </div>
                            <div>
                                <label className={`block text-sm ${t.textMuted} mb-2`}>Ícone</label>
                                <div className="flex flex-wrap gap-2">
                                    {ICONS.map((emoji) => (
                                        <button key={emoji} type="button" onClick={() => setBucketIcon(emoji)}
                                            className={`text-xl p-2 rounded-lg transition-colors ${bucketIcon === emoji ? t.btnPrimary : t.btnSecondary}`}>
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className={`block text-sm ${t.textMuted} mb-1`}>Cor da barra</label>
                                    <input type="color" value={bucketColor} onChange={(e) => setBucketColor(e.target.value)} className={`w-full ${t.input} border ${t.inputBorder} rounded-lg px-2 py-2 h-12 cursor-pointer`} />
                                </div>
                                <div className="flex-1">
                                    <label className={`block text-sm ${t.textMuted} mb-1`}>Meta (opcional)</label>
                                    <input type="text" inputMode="decimal" value={bucketGoal} onChange={(e) => setBucketGoal(e.target.value)} className={inputClass} placeholder="Ex: 8000" />
                                </div>
                            </div>
                            <div>
                                <label className={`block text-sm ${t.textMuted} mb-1`}>Descrição (opcional)</label>
                                <input type="text" value={bucketDesc} onChange={(e) => setBucketDesc(e.target.value)} className={inputClass} placeholder="Ex: Fundo para viagem à Europa" />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowBucket(false)} className={`flex-1 ${t.btnSecondary} ${t.btnSecondaryHover} py-3 rounded-lg text-sm transition-colors`}>Cancelar</button>
                                <button type="submit" disabled={loading} className={`flex-1 ${t.btnPrimary} ${t.btnPrimaryHover} py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 text-white`}>
                                    {loading ? "Salvando..." : editingBucket ? "Salvar" : "Criar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Movimentação */}
            {showTransaction && (
                <div className={modalBase}>
                    <div className={modalBox}>
                        <h3 className="text-lg font-semibold mb-4">Nova movimentação</h3>
                        <form onSubmit={handleTransaction} className="space-y-4">
                            <div>
                                <label className={`block text-sm ${t.textMuted} mb-1`}>Caixinha</label>
                                <select value={txBucket} onChange={(e) => setTxBucket(e.target.value)} className={inputClass} required>
                                    <option value="">Selecione...</option>
                                    {data.buckets.map((b) => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={`block text-sm ${t.textMuted} mb-2`}>Tipo</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(["APORTE", "RETIRADA"] as const).map((tp) => (
                                        <button key={tp} type="button" onClick={() => setTxType(tp)}
                                            className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${txType === tp ? `${t.btnPrimary} text-white` : `${t.btnSecondary} ${t.btnSecondaryHover}`}`}>
                                            {tp === "APORTE" ? "➕ Aporte" : "➖ Retirada"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={`block text-sm ${t.textMuted} mb-1`}>Valor (R$)</label>
                                <input type="text" inputMode="decimal" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} className={inputClass} placeholder="Ex: 500,00" required />
                            </div>
                            <div>
                                <label className={`block text-sm ${t.textMuted} mb-1`}>Descrição (opcional)</label>
                                <input type="text" value={txDesc} onChange={(e) => setTxDesc(e.target.value)} className={inputClass} placeholder="Ex: Salário de junho" />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowTransaction(false)} className={`flex-1 ${t.btnSecondary} ${t.btnSecondaryHover} py-3 rounded-lg text-sm transition-colors`}>Cancelar</button>
                                <button type="submit" disabled={loading} className={`flex-1 ${t.btnPrimary} ${t.btnPrimaryHover} py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 text-white`}>
                                    {loading ? "Salvando..." : "Salvar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Histórico da caixinha */}
            {selectedBucket && (
                <div className={modalBase}>
                    <div className={`${modalBox} max-h-[85vh] flex flex-col`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{selectedBucket.icon}</span>
                                <div>
                                    <h3 className="text-lg font-semibold">{selectedBucket.name}</h3>
                                    <p className={`text-sm ${t.textMuted}`}>{fmt(selectedBucket.balance)}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedBucket(null)} className={`${t.textMuted} hover:${t.text} text-xl`}>✕</button>
                        </div>
                        {selectedBucket.goalAmount && (
                            <div className={`mb-4 ${t.input} rounded-xl p-3`}>
                                <div className={`flex justify-between text-xs ${t.textMuted} mb-1.5`}>
                                    <span>Meta: {fmt(selectedBucket.goalAmount)}</span>
                                    <span>{Math.min((selectedBucket.balance / selectedBucket.goalAmount) * 100, 100).toFixed(1)}%</span>
                                </div>
                                <div className={`${t.btnSecondary} rounded-full h-2`}>
                                    <div className="h-2 rounded-full transition-all" style={{
                                        width: `${Math.min((selectedBucket.balance / selectedBucket.goalAmount) * 100, 100)}%`,
                                        backgroundColor: selectedBucket.color
                                    }} />
                                </div>
                            </div>
                        )}
                        <div className="overflow-y-auto flex-1">
                            {bucketTxs.length === 0 ? (
                                <p className={`${t.textMuted} text-sm text-center py-8`}>Nenhuma movimentação ainda.</p>
                            ) : (
                                <div className={`divide-y ${t.divider}`}>
                                    {bucketTxs.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between py-3">
                                            <div>
                                                <p className="text-sm font-medium">{TX_LABEL[tx.type]}</p>
                                                {tx.description && <p className={`text-xs ${t.textMuted}`}>{tx.description}</p>}
                                                <p className={`text-xs ${t.textFaint}`}>{fmtDate(tx.createdAt)}</p>
                                            </div>
                                            <span className={`text-sm font-semibold ${tx.type === "RETIRADA" ? "text-red-400" : "text-emerald-400"}`}>
                                                {tx.type === "RETIRADA" ? "-" : "+"}{fmt(tx.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}