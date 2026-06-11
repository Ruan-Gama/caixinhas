"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

type Theme = "dark" | "pink" | "light" | "midnight"

type Bill = {
    id: string
    name: string
    amount: number
    icon: string
    color: string
    description: string | null
    resetDay: number
    endsAt: string | null
    paid: number
    remaining: number
    percent: number
    completed: boolean
}

type Income = {
    id: string
    amount: number
    type: string
    createdAt: string
}

function fmt(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const BILL_ICONS = ["📄", "🏠", "💡", "💧", "📱", "🌐", "🚗", "🎬", "🎵", "🍔", "💊", "🐾", "📺", "🏋️", "🎓"]

const THEMES: Record<Theme, {
    label: string; emoji: string
    bg: string; surface: string; border: string
    text: string; textMuted: string; textFaint: string; divider: string
    btnPrimary: string; btnPrimaryHover: string
    btnSecondary: string; btnSecondaryHover: string
    input: string; inputBorder: string; inputFocus: string
    accentText: string; progressBg: string; headerBorder: string
    navActive: string; navInactive: string
}> = {
    dark: {
        label: "Escuro", emoji: "🌙",
        bg: "bg-gray-950", surface: "bg-gray-900", border: "border-gray-800",
        text: "text-white", textMuted: "text-gray-400", textFaint: "text-gray-600", divider: "divide-gray-800",
        btnPrimary: "bg-indigo-600", btnPrimaryHover: "hover:bg-indigo-500",
        btnSecondary: "bg-gray-800", btnSecondaryHover: "hover:bg-gray-700",
        input: "bg-gray-800", inputBorder: "border-gray-700", inputFocus: "focus:border-indigo-500",
        accentText: "text-indigo-400", progressBg: "bg-indigo-500", headerBorder: "border-gray-800",
        navActive: "bg-gray-800 text-white", navInactive: "text-gray-400 hover:text-white",
    },
    pink: {
        label: "Rosa", emoji: "🌸",
        bg: "bg-pink-950", surface: "bg-pink-900/60", border: "border-pink-800/60",
        text: "text-white", textMuted: "text-pink-200", textFaint: "text-pink-400/50", divider: "divide-pink-800/40",
        btnPrimary: "bg-pink-500", btnPrimaryHover: "hover:bg-pink-400",
        btnSecondary: "bg-pink-900", btnSecondaryHover: "hover:bg-pink-800",
        input: "bg-pink-900/80", inputBorder: "border-pink-700", inputFocus: "focus:border-pink-400",
        accentText: "text-pink-300", progressBg: "bg-pink-400", headerBorder: "border-pink-800/60",
        navActive: "bg-pink-800 text-white", navInactive: "text-pink-300 hover:text-white",
    },
    light: {
        label: "Claro", emoji: "☀️",
        bg: "bg-slate-100", surface: "bg-white", border: "border-slate-200",
        text: "text-slate-900", textMuted: "text-slate-500", textFaint: "text-slate-400", divider: "divide-slate-100",
        btnPrimary: "bg-violet-600", btnPrimaryHover: "hover:bg-violet-500",
        btnSecondary: "bg-slate-200", btnSecondaryHover: "hover:bg-slate-300",
        input: "bg-slate-50", inputBorder: "border-slate-300", inputFocus: "focus:border-violet-500",
        accentText: "text-violet-600", progressBg: "bg-violet-500", headerBorder: "border-slate-200",
        navActive: "bg-slate-200 text-slate-900", navInactive: "text-slate-500 hover:text-slate-900",
    },
    midnight: {
        label: "Meia-noite", emoji: "🌌",
        bg: "bg-slate-950", surface: "bg-slate-900", border: "border-slate-700/50",
        text: "text-slate-100", textMuted: "text-slate-400", textFaint: "text-slate-600", divider: "divide-slate-700/50",
        btnPrimary: "bg-cyan-600", btnPrimaryHover: "hover:bg-cyan-500",
        btnSecondary: "bg-slate-800", btnSecondaryHover: "hover:bg-slate-700",
        input: "bg-slate-800", inputBorder: "border-slate-600", inputFocus: "focus:border-cyan-500",
        accentText: "text-cyan-400", progressBg: "bg-cyan-500", headerBorder: "border-slate-700/50",
        navActive: "bg-slate-800 text-slate-100", navInactive: "text-slate-400 hover:text-slate-100",
    },
}

const THEME_ORDER: Theme[] = ["dark", "pink", "light", "midnight"]

export default function FinancasPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [theme, setTheme] = useState<Theme>("dark")
    const [loading, setLoading] = useState(false)

    const [bills, setBills] = useState<Bill[]>([])
    const [incomes, setIncomes] = useState<Income[]>([])

    // Modals
    const [showIncome, setShowIncome] = useState(false)
    const [showBill, setShowBill] = useState(false)
    const [showPay, setShowPay] = useState(false)
    const [editingBill, setEditingBill] = useState<Bill | null>(null)
    const [payingBill, setPayingBill] = useState<Bill | null>(null)

    // Income form
    const [incomeValue, setIncomeValue] = useState("")
    const [incomeType, setIncomeType] = useState<"DEPOSITAR" | "RETIRAR">("DEPOSITAR")

    // Bill form
    const [billName, setBillName] = useState("")
    const [billAmount, setBillAmount] = useState("")
    const [billIcon, setBillIcon] = useState("📄")
    const [billColor, setBillColor] = useState("#6366f1")
    const [billDesc, setBillDesc] = useState("")
    const [billResetDay, setBillResetDay] = useState("1")
    const [billEndsAt, setBillEndsAt] = useState("")

    // Pay form
    const [payAmount, setPayAmount] = useState("")
    const [discountFromSalary, setDiscountFromSalary] = useState(true)

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
            fetchBills()
            fetchIncomes()
        }
    }, [status])

    async function fetchBills() {
        const res = await fetch("/api/bills")
        const json = await res.json()
        setBills(json)
    }

    async function fetchIncomes() {
        const res = await fetch("/api/income")
        const json = await res.json()
        setIncomes(json)
    }

    // Salário atual = soma de todos os movimentos
    const salarioAtual = incomes.reduce((acc, i) => {
        return i.type === "DEPOSITAR" ? acc + Number(i.amount) : acc - Number(i.amount)
    }, 0)

    const totalContas = bills.reduce((acc, b) => acc + Number(b.amount), 0)
    const totalPago = bills.reduce((acc, b) => acc + Number(b.paid), 0)
    const sobra = salarioAtual - totalContas

    function openNewBill() {
        setEditingBill(null)
        setBillName("")
        setBillAmount("")
        setBillIcon("📄")
        setBillColor("#6366f1")
        setBillDesc("")
        setBillResetDay("1")
        setBillEndsAt("")
        setShowBill(true)
    }

    function openEditBill(bill: Bill, e: React.MouseEvent) {
        e.stopPropagation()
        setEditingBill(bill)
        setBillName(bill.name)
        setBillAmount(String(bill.amount))
        setBillIcon(bill.icon)
        setBillColor(bill.color)
        setBillDesc(bill.description || "")
        setBillResetDay(String(bill.resetDay))
        setBillEndsAt(bill.endsAt ? bill.endsAt.split("T")[0] : "")
        setShowBill(true)
    }

    function openPay(bill: Bill) {
        setPayingBill(bill)
        setPayAmount(String(bill.remaining > 0 ? bill.remaining : bill.amount))
        setDiscountFromSalary(true)
        setShowPay(true)
    }

    async function handleIncome(e: React.FormEvent) {
        e.preventDefault()
        const parsed = parseFloat(incomeValue.replace(",", "."))
        if (isNaN(parsed) || parsed <= 0) { alert("Digite um valor válido maior que zero."); return }
        setLoading(true)
        const res = await fetch("/api/income", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: parsed, type: incomeType }),
        })
        const json = await res.json()
        if (!res.ok) { alert(json.error); setLoading(false); return }
        await fetchIncomes()
        setIncomeValue("")
        setShowIncome(false)
        setLoading(false)
    }

    async function handleBill(e: React.FormEvent) {
        e.preventDefault()
        const parsed = parseFloat(billAmount.replace(",", "."))
        if (isNaN(parsed) || parsed <= 0) { alert("Digite um valor válido."); return }
        const day = parseInt(billResetDay)
        if (isNaN(day) || day < 1 || day > 28) { alert("Dia deve ser entre 1 e 28."); return }
        setLoading(true)

        const body = {
            name: billName,
            amount: parsed,
            icon: billIcon,
            color: billColor,
            description: billDesc || null,
            resetDay: day,
            endsAt: billEndsAt || null,
        }

        if (editingBill) {
            await fetch(`/api/bills/${editingBill.id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
        } else {
            await fetch("/api/bills", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
        }

        await fetchBills()
        await fetchIncomes()
        setShowBill(false)
        setLoading(false)
    }

    async function handleDeleteBill(id: string, e: React.MouseEvent) {
        e.stopPropagation()
        if (!confirm("Excluir esta conta? Todo o histórico será perdido.")) return
        setLoading(true)
        await fetch(`/api/bills/${id}`, { method: "DELETE" })
        await fetchBills()
        await fetchIncomes()
        setLoading(false)
    }

    async function handlePay(e: React.FormEvent) {
        e.preventDefault()

        if (!payingBill) return

        const parsed = parseFloat(payAmount.replace(",", "."))

        if (isNaN(parsed) || parsed <= 0) {
            alert("Digite um valor válido.")
            return
        }

        if (parsed > payingBill.remaining) {
            alert(`O valor não pode ser maior que o restante da conta (${fmt(payingBill.remaining)}).`)
            return
        }

        setLoading(true)

        if (discountFromSalary && parsed > salarioAtual) {
            alert(`Saldo insuficiente. Disponível: ${fmt(salarioAtual)}`)
            setLoading(false)
            return
        }

        const res = await fetch(`/api/bills/${payingBill.id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount: parsed,
                discountFromSalary,
            }),
        })

        const json = await res.json()

        if (!res.ok) {
            alert(json.error)
            setLoading(false)
            return
        }

        await fetchBills()
        await fetchIncomes()

        setPayAmount("")
        setDiscountFromSalary(true)
        setShowPay(false)
        setPayingBill(null)

        setLoading(false)
    }

    if (status === "loading") {
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
            <header className={`border-b ${t.headerBorder} px-4 py-4`}>
                <div className="flex items-center justify-between mb-3">
                    <h1 className="text-xl font-bold">🪙 Caixinhas</h1>
                    <div className="flex items-center gap-2">
                        <span className={`${t.textMuted} text-xs hidden sm:block`}>{session?.user?.name || session?.user?.email}</span>
                        <button
                            onClick={cycleTheme}
                            className={`text-xs border ${t.border} rounded-lg px-3 py-1.5 transition-colors ${t.textMuted}`}
                        >
                            {THEMES[theme].emoji} {THEMES[theme].label}
                        </button>
                        <button
                            onClick={() => signOut()}
                            className={`text-xs ${t.textMuted} border ${t.border} rounded-lg px-3 py-1.5`}
                        >
                            Sair
                        </button>
                    </div>
                </div>
                {/* Nav */}
                <nav className="flex gap-1">
                    <Link href="/dashboard" className={`text-sm px-4 py-1.5 rounded-lg transition-colors ${t.navInactive}`}>
                        💰 Patrimônio
                    </Link>
                    <Link href="/financas" className={`text-sm px-4 py-1.5 rounded-lg transition-colors ${t.navActive}`}>
                        📅 Finanças do Mês
                    </Link>
                </nav>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">

                {/* Cards resumo */}
                <div className="grid grid-cols-2 gap-3">
                    <div className={`${t.surface} rounded-2xl p-4 border ${t.border} col-span-2`}>
                        <p className={`${t.textMuted} text-xs mb-1`}>Salário do mês</p>
                        <p className="text-2xl font-bold">{fmt(salarioAtual)}</p>
                    </div>
                    <div className={`${t.surface} rounded-2xl p-4 border ${t.border}`}>
                        <p className={`${t.textMuted} text-xs mb-1`}>Total em contas</p>
                        <p className={`text-xl font-bold text-rose-400`}>{fmt(totalContas)}</p>
                    </div>
                    <div className={`${t.surface} rounded-2xl p-4 border ${t.border}`}>
                        <p className={`${t.textMuted} text-xs mb-1`}>Sobra no mês</p>
                        <p className={`text-xl font-bold ${sobra >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmt(sobra)}</p>
                    </div>
                    <div className={`${t.surface} rounded-2xl p-4 border ${t.border} col-span-2`}>
                        <p className={`${t.textMuted} text-xs mb-1`}>Pago até agora</p>
                        <p className={`text-xl font-bold ${t.accentText}`}>
                            {fmt(totalPago)}
                            <span className={`${t.textMuted} text-sm font-normal`}> / {fmt(totalContas)}</span>
                        </p>
                        {totalContas > 0 && (
                            <div className={`${t.input} rounded-full h-2 mt-2`}>
                                <div className={`${t.progressBg} h-2 rounded-full transition-all`}
                                    style={{ width: `${Math.min((totalPago / totalContas) * 100, 100)}%` }} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Ações */}
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setShowIncome(true)} className={`${t.btnPrimary} ${t.btnPrimaryHover} px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white`}>
                        💵 Atualizar salário
                    </button>
                    <button onClick={openNewBill} className={`${t.btnSecondary} ${t.btnSecondaryHover} px-4 py-2 rounded-lg text-sm font-medium transition-colors`}>
                        ➕ Nova conta
                    </button>
                </div>

                {/* Lista de contas */}
                <div>
                    <h2 className={`text-xs font-semibold ${t.textMuted} uppercase tracking-wider mb-3`}>Suas contas</h2>
                    {bills.length === 0 ? (
                        <div className={`${t.surface} rounded-2xl p-10 border ${t.border} text-center`}>
                            <p className="text-4xl mb-3">📋</p>
                            <p className={t.textMuted}>Nenhuma conta cadastrada.</p>
                            <p className={`${t.textFaint} text-sm mt-1`}>Adicione suas contas fixas para acompanhar o mês!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {bills.map((bill) => (
                                <div key={bill.id} className={`${t.surface} rounded-2xl p-4 border ${t.border} ${bill.completed ? "opacity-80" : ""}`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-2xl">{bill.icon}</span>
                                            <div>
                                                <p className="font-semibold text-sm flex items-center gap-1.5">
                                                    {bill.name}
                                                    {bill.completed && <span className="text-emerald-400 text-xs">✓ Pago</span>}
                                                </p>
                                                <p className={`text-xs ${t.textFaint}`}>Renova dia {bill.resetDay}</p>
                                                {bill.description && <p className={`text-xs ${t.textFaint}`}>{bill.description}</p>}
                                            </div>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <button onClick={(e) => openEditBill(bill, e)} className={`${t.textFaint} p-1`}>✏️</button>
                                            <button onClick={(e) => handleDeleteBill(bill.id, e)} className={`${t.textFaint} hover:text-red-400 p-1`}>🗑️</button>
                                        </div>
                                    </div>

                                    <p className="text-xl font-bold mb-1">{fmt(bill.amount)}</p>

                                    {/* Barra de progresso */}
                                    <div className="mb-3">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className={t.textFaint}>Pago: {fmt(bill.paid)}</span>
                                            <span className={t.textFaint}>{bill.percent.toFixed(0)}%</span>
                                        </div>
                                        <div className={`${t.input} rounded-full h-2`}>
                                            <div className="h-2 rounded-full transition-all"
                                                style={{ width: `${bill.percent}%`, backgroundColor: bill.color }} />
                                        </div>
                                        {!bill.completed && (
                                            <p className={`text-xs ${t.textFaint} mt-1`}>Falta: {fmt(bill.remaining)}</p>
                                        )}
                                    </div>

                                    {!bill.completed && (
                                        <button
                                            onClick={() => openPay(bill)}
                                            className={`w-full ${t.btnPrimary} ${t.btnPrimaryHover} py-2 rounded-lg text-sm font-medium transition-colors text-white`}
                                        >
                                            💳 Registrar pagamento
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Modal: Salário */}
            {/* Modal: Salário */}
            {showIncome && (
                <div className={modalBase}>
                    <div className={modalBox}>
                        <h3 className="text-lg font-semibold mb-1">
                            Atualizar salário
                        </h3>

                        <p className={`text-xs ${t.textMuted} mb-4`}>
                            Saldo atual: <span className="font-semibold">{fmt(salarioAtual)}</span>
                        </p>

                        <form onSubmit={handleIncome} className="space-y-4">
                            <div>
                                <label className={`block text-sm ${t.textMuted} mb-2`}>
                                    Tipo
                                </label>

                                <div className="grid grid-cols-2 gap-2">
                                    {(["DEPOSITAR", "RETIRAR"] as const).map((tp) => (
                                        <button
                                            key={tp}
                                            type="button"
                                            onClick={() => setIncomeType(tp)}
                                            className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${incomeType === tp
                                                    ? `${t.btnPrimary} text-white`
                                                    : `${t.btnSecondary} ${t.btnSecondaryHover}`
                                                }`}
                                        >
                                            {tp === "DEPOSITAR"
                                                ? "➕ Depositar"
                                                : "➖ Retirar"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className={`block text-sm ${t.textMuted} mb-1`}>
                                    Valor (R$)
                                </label>

                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={incomeValue}
                                    onChange={(e) => setIncomeValue(e.target.value)}
                                    className={inputClass}
                                    placeholder="Ex: 150,00"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowIncome(false)}
                                    className={`flex-1 ${t.btnSecondary} ${t.btnSecondaryHover} py-3 rounded-lg text-sm transition-colors`}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`flex-1 ${t.btnPrimary} ${t.btnPrimaryHover} py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 text-white`}
                                >
                                    {loading
                                        ? "Salvando..."
                                        : incomeType === "DEPOSITAR"
                                            ? "Depositar"
                                            : "Retirar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Conta */}
            {showBill && (
                <div className={modalBase}>
                    <div className={`${modalBox} max-h-[90vh] overflow-y-auto`}>
                        <h3 className="text-lg font-semibold mb-4">{editingBill ? "Editar conta" : "Nova conta"}</h3>
                        <form onSubmit={handleBill} className="space-y-4">
                            <div>
                                <label className={`block text-sm ${t.textMuted} mb-1`}>Nome</label>
                                <input type="text" value={billName} onChange={(e) => setBillName(e.target.value)}
                                    className={inputClass} placeholder="Ex: Aluguel, Internet..." required />
                            </div>
                            <div>
                                <label className={`block text-sm ${t.textMuted} mb-2`}>Ícone</label>
                                <div className="flex flex-wrap gap-2">
                                    {BILL_ICONS.map((emoji) => (
                                        <button key={emoji} type="button" onClick={() => setBillIcon(emoji)}
                                            className={`text-xl p-2 rounded-lg transition-colors ${billIcon === emoji ? t.btnPrimary : t.btnSecondary}`}>
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className={`block text-sm ${t.textMuted} mb-1`}>Valor (R$)</label>
                                    <input type="text" inputMode="decimal" value={billAmount}
                                        onChange={(e) => setBillAmount(e.target.value)}
                                        className={inputClass} placeholder="Ex: 150,00" required />
                                </div>
                                <div className="flex-1">
                                    <label className={`block text-sm ${t.textMuted} mb-1`}>Dia de renovação</label>
                                    <input type="number" min={1} max={28} value={billResetDay}
                                        onChange={(e) => setBillResetDay(e.target.value)}
                                        className={inputClass} placeholder="Ex: 10" required />
                                </div>
                            </div>
                            <div>
                                <label className={`block text-sm ${t.textMuted} mb-1`}>Cor da barra</label>
                                <input type="color" value={billColor} onChange={(e) => setBillColor(e.target.value)}
                                    className={`w-full ${t.input} border ${t.inputBorder} rounded-lg px-2 py-2 h-12 cursor-pointer`} />
                            </div>
                            <div>
                                <label className={`block text-sm ${t.textMuted} mb-1`}>Descrição (opcional)</label>
                                <input type="text" value={billDesc} onChange={(e) => setBillDesc(e.target.value)}
                                    className={inputClass} placeholder="Ex: Conta de luz" />
                            </div>
                            <div>
                                <label className={`block text-sm ${t.textMuted} mb-1`}>Encerra em (opcional)</label>
                                <input type="date" value={billEndsAt} onChange={(e) => setBillEndsAt(e.target.value)}
                                    className={inputClass} />
                                <p className={`text-xs ${t.textFaint} mt-1`}>Deixe vazio para conta sem prazo de encerramento</p>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowBill(false)} className={`flex-1 ${t.btnSecondary} ${t.btnSecondaryHover} py-3 rounded-lg text-sm transition-colors`}>Cancelar</button>
                                <button type="submit" disabled={loading} className={`flex-1 ${t.btnPrimary} ${t.btnPrimaryHover} py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 text-white`}>
                                    {loading ? "Salvando..." : editingBill ? "Salvar" : "Criar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Pagamento */}
            {showPay && payingBill && (
                <div className={modalBase}>
                    <div className={modalBox}>
                        <h3 className="text-lg font-semibold mb-1">
                            Registrar pagamento
                        </h3>

                        <p className={`text-xs ${t.textMuted} mb-4`}>
                            {payingBill.icon} {payingBill.name} · Falta {fmt(payingBill.remaining)}
                        </p>

                        <form onSubmit={handlePay} className="space-y-4">

                            <div>
                                <label className={`block text-sm ${t.textMuted} mb-1`}>
                                    Valor pago (R$)
                                </label>

                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                    className={inputClass}
                                    placeholder="Ex: 150,00"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={discountFromSalary}
                                        onChange={(e) =>
                                            setDiscountFromSalary(e.target.checked)
                                        }
                                    />
                                    Descontar automaticamente do salário do mês
                                </label>

                                {discountFromSalary && (
                                    <p className={`text-xs ${t.textMuted} mt-2`}>
                                        Salário disponível: {fmt(salarioAtual)}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPay(false)
                                        setPayingBill(null)
                                    }}
                                    className={`flex-1 ${t.btnSecondary} ${t.btnSecondaryHover} py-3 rounded-lg text-sm transition-colors`}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`flex-1 ${t.btnPrimary} ${t.btnPrimaryHover} py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 text-white`}
                                >
                                    {loading ? "Salvando..." : "Confirmar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}