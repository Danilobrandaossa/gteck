// Sistema de autenticação simples
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
  organizationId: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Dados mock para demonstração (temporário até banco estar funcionando)
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@cms.local',
    name: 'Administrador',
    role: 'admin',
    organizationId: '1'
  },
  {
    id: '2',
    email: 'admin@cms.com',
    name: 'Usuário Admin',
    role: 'admin',
    organizationId: '1'
  },
  {
    id: '3',
    email: 'editor@cms.com',
    name: 'Editor',
    role: 'editor',
    organizationId: '1'
  },
  {
    id: '4',
    email: 'contato@danilobrandao.com.br',
    name: 'Danilo Brandão',
    role: 'admin',
    organizationId: '1'
  }
]

export class AuthService {
  private static instance: AuthService
  private currentUser: User | null = null

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    // Validação básica
    if (!email || !password) {
      return { success: false, error: 'Email e senha são obrigatórios' }
    }

    // Primeiro, tentar API de login real
// @ts-ignore
    let _apiSuccess = false
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success && data.user) {
        // Converter para formato User
        const user: User = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          organizationId: data.user.organizationId
        }

        this.currentUser = user
        
        // Salvar no localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('cms_user', JSON.stringify(user))
        }

        return { success: true, user }
      }
    } catch (error) {
      // API não disponível, usar fallback
      console.warn('[Auth] API não disponível, usando fallback mock')
    }

    // Fallback: usar mockUsers temporariamente
    const user = mockUsers.find(u => u.email === email)
    
    if (!user) {
      return { success: false, error: 'Usuário não encontrado' }
    }

    // Validação de senha para usuários mock (case-sensitive)
    let validPassword = false
    
    // Mapeamento de senhas por email (fallback apenas - não deve ser usado se API funcionar)
    const passwordMap: Record<string, string> = {
      'admin@cms.local': 'password',
      'contato@danilobrandao.com.br': 'Zy598859D@n',
      'admin@cms.com': '123456',
      'editor@cms.com': '123456'
    }

    const expectedPassword = passwordMap[email]
    
    if (expectedPassword && password === expectedPassword) {
      validPassword = true
    }

    if (!validPassword) {
      console.log('[Auth] Senha incorreta para:', email, 'Esperado:', expectedPassword, 'Recebido:', password)
      return { success: false, error: 'Senha incorreta' }
    }

    this.currentUser = user
    
    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('cms_user', JSON.stringify(user))
    }

    return { success: true, user }
  }

  async logout(): Promise<void> {
    this.currentUser = null
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cms_user')
    }
  }

  getCurrentUser(): User | null {
    // Tentar recuperar do localStorage primeiro (pode estar atualizado)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cms_user')
      if (stored) {
        try {
          const parsedUser = JSON.parse(stored)
          this.currentUser = parsedUser
          return this.currentUser
        } catch (error) {
          console.error('Erro ao recuperar usuário do localStorage:', error)
          // Limpar localStorage corrompido
          localStorage.removeItem('cms_user')
        }
      }
    }

    // Se não encontrou no localStorage, retornar currentUser (pode estar null)
    return this.currentUser
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser()
    return user?.role === role
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser()
    return user ? roles.includes(user.role) : false
  }
}

export const authService = AuthService.getInstance()