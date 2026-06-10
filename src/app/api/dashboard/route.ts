import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const snapshots = await prisma.wealthSnapshot.findMany({
    where: { userId: session.user.id },
    orderBy: { snapshotDate: "desc" },
  })

  const latestSnapshot = snapshots[0]
  const patrimonioAtual = latestSnapshot ? Number(latestSnapshot.totalBalance) : 0

  const buckets = await prisma.bucket.findMany({
    where: { userId: session.user.id },
    include: { transactions: true },
  })

  const bucketsWithBalance = buckets.map((b) => ({
    ...b,
    balance: b.transactions.reduce((acc, t) => {
      if (t.type === "APORTE" || t.type === "RENDIMENTO") return acc + Number(t.amount)
      if (t.type === "RETIRADA") return acc - Number(t.amount)
      return acc
    }, 0),
  }))

  const metasTotal = buckets.filter((b) => b.goalAmount).length
  const metasAtingidas = bucketsWithBalance.filter(
    (b) => b.goalAmount && b.balance >= Number(b.goalAmount)
  ).length
  const totalMetas = buckets.reduce((acc, b) => acc + Number(b.goalAmount || 0), 0)

  // Dinheiro alocado nas caixinhas
  const totalAlocado = bucketsWithBalance.reduce((acc, b) => acc + b.balance, 0)
  const naoAlocado = Math.max(patrimonioAtual - totalAlocado, 0)

  return NextResponse.json({
    patrimonioAtual,
    totalAlocado,
    naoAlocado,
    metasAtingidas,
    metasTotal,
    totalMetas,
    buckets: bucketsWithBalance,
  })
}