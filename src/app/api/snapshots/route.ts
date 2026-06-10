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

  const { totalBalance } = await req.json()

  const parsed = parseFloat(totalBalance)
  if (isNaN(parsed) || parsed <= 0)
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 })

  const snapshot = await prisma.wealthSnapshot.create({
    data: {
      totalBalance: parsed,
      snapshotDate: new Date(),
      userId: session.user.id,
    },
  })

  return NextResponse.json(snapshot)
}