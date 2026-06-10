import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { name, goalAmount, goalDate, color, icon, description } = await req.json()

  const bucket = await prisma.bucket.findUnique({ where: { id: params.id } })
  if (!bucket || bucket.userId !== session.user.id)
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  const updated = await prisma.bucket.update({
    where: { id: params.id },
    data: {
      name,
      goalAmount: goalAmount || null,
      goalDate: goalDate ? new Date(goalDate) : null,
      color,
      icon,
      description,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const bucket = await prisma.bucket.findUnique({ where: { id: params.id } })
  if (!bucket || bucket.userId !== session.user.id)
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  await prisma.bucket.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}