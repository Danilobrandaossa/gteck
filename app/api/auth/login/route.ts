/**
 * API de Login - Autenticação real com banco de dados
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('[Login API] Tentando login:', { email })

    // Buscar usuário no banco de dados
    const user = await db.user.findUnique({
      where: { email },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!user) {
      console.log('[Login API] Usuário não encontrado:', email)
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      console.log('[Login API] Usuário inativo:', email)
      return NextResponse.json(
        { success: false, error: 'Usuário inativo' },
        { status: 401 }
      )
    }

    // Verificar senha
    if (!user.password) {
      return NextResponse.json(
        { success: false, error: 'Usuário sem senha configurada' },
        { status: 401 }
      )
    }
    const passwordMatch = await bcrypt.compare(password, user.password)
    
    if (!passwordMatch) {
      console.log('[Login API] Senha incorreta para:', email)
      return NextResponse.json(
        { success: false, error: 'Senha incorreta' },
        { status: 401 }
      )
    }

    console.log('[Login API] Login bem-sucedido:', email)

    // Retornar dados do usuário (sem senha)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        organization: user.organization
      }
    })
  } catch (error) {
    console.error('[Login API] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}



