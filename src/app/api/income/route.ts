import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const incomes = await prisma.monthlyIncome.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(incomes)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { amount, type } = await req.json()

  if (!amount || isNaN(parseFloat(amount)))
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 })

  const parsed = parseFloat(amount)
  if (parsed <= 0)
    return NextResponse.json({ error: "Valor deve ser maior que zero" }, { status: 400 })

  const income = await prisma.monthlyIncome.create({
    data: {
      amount: parsed,
      type: type || "DEPOSITAR",
      userId: session.user.id,
    },
  })

  return NextResponse.json(income)
}