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

  return NextResponse.json(snapshots)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { type, amount } = await req.json()

  if (!amount || isNaN(amount) || amount <= 0)
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 })

  const previous = await prisma.wealthSnapshot.findFirst({
    where: { userId: session.user.id },
    orderBy: { snapshotDate: "desc" },
  })

  const previousBalance = previous ? Number(previous.totalBalance) : 0

  const newBalance = type === "DEPOSITAR"
    ? previousBalance + amount
    : Math.max(previousBalance - amount, 0)

  const snapshot = await prisma.wealthSnapshot.create({
    data: {
      totalBalance: newBalance,
      snapshotDate: new Date(),
      userId: session.user.id,
    },
  })

  return NextResponse.json({ snapshot, newBalance })
}