// Validador de Credenciais WordPress
export interface CredentialTestResult {
  success: boolean
  error?: string
  details: {
    url: boolean
    username: boolean
    password: boolean
    connection: boolean
    permissions: boolean
  }
  suggestions: string[]
}

export class WordPressCredentialsValidator {
  // Testar credenciais completas
  static async validateCredentials(
    baseUrl: string,
    username: string,
    password: string
  ): Promise<CredentialTestResult> {
    const result: CredentialTestResult = {
      success: false,
      details: {
        url: false,
        username: false,
        password: false,
        connection: false,
        permissions: false
      },
      suggestions: []
    }

    try {
      // 1. Validar URL
      if (!baseUrl || !baseUrl.startsWith('http')) {
        result.suggestions.push('URL deve começar com http:// ou https://')
        return result
      }
      result.details.url = true

      // 2. Validar username
      if (!username || username.trim().length === 0) {
        result.suggestions.push('Username não pode estar vazio')
        return result
      }
      result.details.username = true

      // 3. Validar password
      if (!password || password.trim().length === 0) {
        result.suggestions.push('Password não pode estar vazio')
        return result
      }
      result.details.password = true

      // 4. Testar conexão básica
      const connectionTest = await this.testBasicConnection(baseUrl)
      if (!connectionTest.success) {
        result.suggestions.push('Site WordPress não está acessível')
        return result
      }
      result.details.connection = true

      // 5. Testar autenticação
      const authTest = await this.testAuthentication(baseUrl, username, password)
      if (!authTest.success) {
        result.suggestions.push('Credenciais inválidas ou usuário sem permissão')
        return result
      }
      result.details.permissions = true

      result.success = true
      return result

    } catch (error) {
      result.suggestions.push(`Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      return result
    }
  }

  // Testar conexão básica (sem autenticação)
  private static async testBasicConnection(baseUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/wordpress/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `${baseUrl}/wp-json/wp/v2/`,
          method: 'GET'
        })
      })

      if (response.ok) {
        const data = await response.json()
        return { success: data.success }
      } else {
        return { success: false, error: `HTTP ${response.status}` }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro de conexão' }
    }
  }

  // Testar autenticação
  private static async testAuthentication(
    baseUrl: string,
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/wordpress/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `${baseUrl}/wp-json/wp/v2/users/me`,
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(`${username}:${password}`)}`
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return { success: true }
        } else {
          return { success: false, error: 'Resposta inválida do servidor' }
        }
      } else {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro de autenticação' }
    }
  }

  // Gerar sugestões de correção
  static generateSuggestions(result: CredentialTestResult): string[] {
    const suggestions: string[] = []

    if (!result.details.url) {
      suggestions.push('Verifique se a URL do WordPress está correta (ex: https://meusite.com)')
    }

    if (!result.details.username) {
      suggestions.push('Verifique se o username está correto')
    }

    if (!result.details.password) {
      suggestions.push('Verifique se a senha de aplicação está correta')
    }

    if (!result.details.connection) {
      suggestions.push('Verifique se o site WordPress está online e acessível')
    }

    if (!result.details.permissions) {
      suggestions.push('Verifique se o usuário tem permissões de administrador')
      suggestions.push('Verifique se a senha de aplicação foi criada corretamente')
    }

    return suggestions
  }
}









