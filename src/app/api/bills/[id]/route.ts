import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { name, amount, icon, color, description, resetDay, endsAt } = await req.json()

  if (!name || !amount || !resetDay)
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })

  if (resetDay < 1 || resetDay > 28)
    return NextResponse.json({ error: "Dia deve ser entre 1 e 28" }, { status: 400 })

  const bill = await prisma.bill.update({
    where: { id: params.id, userId: session.user.id },
    data: {
      name,
      amount: parseFloat(amount),
      icon: icon || "📄",
      color: color || "#6366f1",
      description: description || null,
      resetDay,
      endsAt: endsAt ? new Date(endsAt) : null,
    },
  })

  return NextResponse.json(bill)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  await prisma.bill.delete({
    where: { id: params.id, userId: session.user.id },
  })

  return NextResponse.json({ ok: true })
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { amount, discountFromSalary } = await req.json()

  if (!amount || isNaN(parseFloat(amount)))
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 })

  const bill = await prisma.bill.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  })

  if (!bill)
    return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 })

  const parsedAmount = parseFloat(amount)

  // Verifica se há saldo suficiente
  if (discountFromSalary) {
    const incomes = await prisma.monthlyIncome.findMany({
      where: {
        userId: session.user.id,
      },
    })

    const salarioAtual = incomes.reduce((acc, income) => {
      return income.type === "DEPOSITAR"
        ? acc + Number(income.amount)
        : acc - Number(income.amount)
    }, 0)

    if (parsedAmount > salarioAtual) {
      return NextResponse.json(
        {
          error: `Saldo insuficiente. Disponível: R$ ${salarioAtual.toFixed(2)}`,
        },
        { status: 400 }
      )
    }
  }

  const payment = await prisma.billPayment.create({
    data: {
      billId: params.id,
      amount: parsedAmount,
    },
  })

  if (discountFromSalary) {
    await prisma.monthlyIncome.create({
      data: {
        amount: parsedAmount,
        type: "RETIRAR",
        userId: session.user.id,
      },
    })
  }

  return NextResponse.json(payment)
}