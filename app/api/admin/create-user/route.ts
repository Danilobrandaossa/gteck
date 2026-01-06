/**
 * Rota temporária para criar usuário admin
 * ATENÇÃO: Remover após criar o usuário por segurança
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Desabilitar middleware para esta rota
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('[Create User API] Recebendo requisição...')
    const body = await request.json()
    console.log('[Create User API] Body recebido:', { email: body.email, hasPassword: !!body.password, name: body.name })
    
    const { email, password, name } = body

    if (!email || !password) {
      console.log('[Create User API] Campos obrigatórios faltando')
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('[Create User API] Verificando usuário existente...')

    // Verificar se o usuário já existe
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    // Buscar ou criar organização padrão
    let organization = await db.organization.findFirst({
      where: { slug: 'default-org' }
    })

    if (!organization) {
      organization = await db.organization.create({
        data: {
          name: 'Organização Padrão',
          slug: 'default-org',
          description: 'Organização padrão',
          settings: JSON.stringify({
            theme: 'default',
            features: ['pages', 'media', 'templates', 'ai']
          })
        }
      })
    }

    // Fazer hash da senha
    console.log('[Create User API] Gerando hash da senha...')
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log('[Create User API] Hash gerado com sucesso')

    if (existingUser) {
      // Atualizar usuário existente
      const updatedUser = await db.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          name: name || existingUser.name,
          isActive: true
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        user: {
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role
        }
      })
    }

    // Criar novo usuário
    const user = await db.user.create({
      data: {
        email,
        name: name || 'Usuário',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        organizationId: organization.id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('[Create User API] Erro completo:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return NextResponse.json(
      {
        error: 'Erro ao criar usuário',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        errorType: error instanceof Error ? error.constructor.name : typeof error
      },
      { status: 500 }
    )
  }
}

