import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const bucketId = searchParams.get("bucketId")

  const transactions = await prisma.transaction.findMany({
    where: {
      bucket: { userId: session.user.id },
      ...(bucketId ? { bucketId } : {}),
    },
    include: { bucket: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(transactions)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { bucketId, type, amount, description, affectMoney = true } = await req.json()

  if (!bucketId || !type || !amount)
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })

  const bucket = await prisma.bucket.findUnique({ where: { id: bucketId } })
  if (!bucket || bucket.userId !== session.user.id)
    return NextResponse.json({ error: "Caixinha não encontrada" }, { status: 404 })

  // Valida se aporte não ultrapassa o patrimônio
  if (affectMoney && (type === "APORTE" || type === "RETIRADA")) {
    const snapshot = await prisma.wealthSnapshot.findFirst({
      where: { userId: session.user.id },
      orderBy: { snapshotDate: "desc" },
    })

    if (snapshot) {
      const allBuckets = await prisma.bucket.findMany({
        where: { userId: session.user.id },
        include: { transactions: true },
      })

      const totalAlocado = allBuckets.reduce((acc, b) => {
        return acc + b.transactions.reduce((sum, t) => {
          if (t.type === "APORTE" || t.type === "RENDIMENTO") return sum + Number(t.amount)
          if (t.type === "RETIRADA") return sum - Number(t.amount)
          return sum
        }, 0)
      }, 0)

      const patrimonio = Number(snapshot.totalBalance)

      if (totalAlocado + amount > patrimonio) {
        return NextResponse.json(
          { error: `Aporte ultrapassa o patrimônio disponível. Disponível: R$ ${(patrimonio - totalAlocado).toFixed(2)}` },
          { status: 400 }
        )
      }
    }
  }

  // Valida se retirada não deixa caixinha negativa
  if (type === "RETIRADA") {
    const transactions = await prisma.transaction.findMany({
      where: { bucketId },
    })

    const saldoAtual = transactions.reduce((acc, t) => {
      if (t.type === "APORTE" || t.type === "RENDIMENTO") return acc + Number(t.amount)
      if (t.type === "RETIRADA") return acc - Number(t.amount)
      return acc
    }, 0)

    if (amount > saldoAtual) {
      return NextResponse.json(
        { error: `Saldo insuficiente. Saldo atual: R$ ${saldoAtual.toFixed(2)}` },
        { status: 400 }
      )
    }
  }

  const transaction = await prisma.transaction.create({
    data: {
      bucketId,
      type,
      amount: parseFloat(amount),
      description: description || null,
    },
  })

  return NextResponse.json(transaction)
}