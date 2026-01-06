/**
 * Rota para listar todos os usuários do sistema
 * ATENÇÃO: Proteger esta rota em produção
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('[List Users API] Listando usuários...')
    
    const users = await db.user.findMany({
      include: {
        organization: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Remover senhas dos resultados (segurança)
    const usersWithoutPasswords = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      organization: user.organization,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Informar senha conhecida apenas para admin padrão
      knownPassword: user.email === 'admin@cms.local' ? 'password' : undefined
    }))

    return NextResponse.json({
      success: true,
      count: users.length,
      users: usersWithoutPasswords,
      summary: {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        admins: users.filter(u => u.role === 'admin').length,
        editors: users.filter(u => u.role === 'editor').length,
        viewers: users.filter(u => u.role === 'viewer').length
      }
    })
  } catch (error) {
    console.error('[List Users API] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao listar usuários',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}



