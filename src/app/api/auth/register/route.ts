import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 400 }
      )
    }

    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { email, password: hashed, name },
    })

    return NextResponse.json({ id: user.id, email: user.email })
  } catch {
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    )
  }
}