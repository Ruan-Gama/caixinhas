import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const buckets = await prisma.bucket.findMany({
    where: { userId: session.user.id },
    include: { transactions: true },
    orderBy: { createdAt: "asc" },
  })

  const bucketsWithBalance = buckets.map((bucket) => {
    const balance = bucket.transactions.reduce((acc, t) => {
      if (t.type === "APORTE" || t.type === "RENDIMENTO") return acc + Number(t.amount)
      if (t.type === "RETIRADA") return acc - Number(t.amount)
      return acc
    }, 0)
    return { ...bucket, balance }
  })

  return NextResponse.json(bucketsWithBalance)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { name, goalAmount, goalDate, color, icon, description } = await req.json()

  if (!name) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })

  const bucket = await prisma.bucket.create({
    data: {
      name,
      goalAmount: goalAmount || null,
      goalDate: goalDate ? new Date(goalDate) : null,
      color: color || "#6366f1",
      icon: icon || "💰",
      description: description || null,
      userId: session.user.id,
    },
  })

  return NextResponse.json(bucket)
}