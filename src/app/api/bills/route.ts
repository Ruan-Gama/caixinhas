import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const bills = await prisma.bill.findMany({
    where: { userId: session.user.id },
    include: { payments: true },
    orderBy: { createdAt: "asc" },
  })

  const now = new Date()

  const billsWithStatus = bills.map((bill) => {
    // Calcula início do ciclo atual baseado no resetDay
    const resetDay = bill.resetDay
    let cycleStart = new Date(now.getFullYear(), now.getMonth(), resetDay)
    if (now.getDate() < resetDay) {
      cycleStart = new Date(now.getFullYear(), now.getMonth() - 1, resetDay)
    }

    // Soma pagamentos do ciclo atual
    const paid = bill.payments
      .filter((p) => new Date(p.createdAt) >= cycleStart)
      .reduce((acc, p) => acc + Number(p.amount), 0)

    const goal = Number(bill.amount)
    const remaining = Math.max(goal - paid, 0)
    const percent = Math.min((paid / goal) * 100, 100)
    const completed = paid >= goal

    return {
      ...bill,
      paid,
      remaining,
      percent,
      completed,
      cycleStart,
    }
  })

  return NextResponse.json(billsWithStatus)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { name, amount, icon, color, description, resetDay, endsAt } = await req.json()

  if (!name || !amount || !resetDay)
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })

  if (resetDay < 1 || resetDay > 28)
    return NextResponse.json({ error: "Dia deve ser entre 1 e 28" }, { status: 400 })

  const bill = await prisma.bill.create({
    data: {
      name,
      amount: parseFloat(amount),
      icon: icon || "📄",
      color: color || "#6366f1",
      description: description || null,
      resetDay,
      endsAt: endsAt ? new Date(endsAt) : null,
      userId: session.user.id,
    },
  })

  return NextResponse.json(bill)
}