'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { WordPressCredentialsValidator, CredentialTestResult } from '@/lib/wordpress-credentials-validator'

interface CredentialsDiagnosticProps {
  baseUrl: string
  username: string
  password: string
  onTestComplete?: (result: CredentialTestResult) => void
}

export function CredentialsDiagnostic({ 
  baseUrl, 
  username, 
  password, 
  onTestComplete 
}: CredentialsDiagnosticProps) {
  const [isTesting, setIsTesting] = useState(false)
  const [result, setResult] = useState<CredentialTestResult | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleTest = async () => {
    if (!baseUrl || !username || !password) {
      setResult({
        success: false,
        details: {
          url: false,
          username: false,
          password: false,
          connection: false,
          permissions: false
        },
        suggestions: ['Preencha todos os campos antes de testar']
      })
      return
    }

    setIsTesting(true)
    try {
      const testResult = await WordPressCredentialsValidator.validateCredentials(
        baseUrl,
        username,
        password
      )
      setResult(testResult)
      onTestComplete?.(testResult)
    } catch (error) {
      setResult({
        success: false,
        details: {
          url: false,
          username: false,
          password: false,
          connection: false,
          permissions: false
        },
        suggestions: [`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`]
      })
    } finally {
      setIsTesting(false)
    }
  }

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    )
  }

  const getStatusText = (status: boolean) => {
    return status ? 'OK' : 'Erro'
  }

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-red-600'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Diagnóstico de Credenciais
        </h3>
        <button
          onClick={handleTest}
          disabled={isTesting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
          {isTesting ? 'Testando...' : 'Testar Credenciais'}
        </button>
      </div>

      {/* Credenciais Atuais */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL do WordPress
          </label>
          <div className="text-sm text-gray-600 font-mono bg-white p-2 rounded border">
            {baseUrl || 'Não configurado'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <div className="text-sm text-gray-600 font-mono bg-white p-2 rounded border">
            {username || 'Não configurado'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Senha de Aplicação
          </label>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600 font-mono bg-white p-2 rounded border flex-1">
              {password ? (showPassword ? password : '•'.repeat(password.length)) : 'Não configurado'}
            </div>
            {password && (
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resultado do Teste */}
      {result && (
        <div className="space-y-4">
          {/* Status Geral */}
          <div className={`p-4 rounded-lg ${
            result.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className={`font-semibold ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.success ? 'Credenciais Válidas' : 'Credenciais Inválidas'}
              </span>
            </div>
          </div>

          {/* Detalhes do Teste */}
          <div className="bg-white border rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-gray-900">Detalhes do Teste</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">URL do WordPress</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.details.url)}
                  <span className={`text-sm font-medium ${getStatusColor(result.details.url)}`}>
                    {getStatusText(result.details.url)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Username</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.details.username)}
                  <span className={`text-sm font-medium ${getStatusColor(result.details.username)}`}>
                    {getStatusText(result.details.username)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Senha de Aplicação</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.details.password)}
                  <span className={`text-sm font-medium ${getStatusColor(result.details.password)}`}>
                    {getStatusText(result.details.password)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Conexão com Site</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.details.connection)}
                  <span className={`text-sm font-medium ${getStatusColor(result.details.connection)}`}>
                    {getStatusText(result.details.connection)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Permissões de Acesso</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.details.permissions)}
                  <span className={`text-sm font-medium ${getStatusColor(result.details.permissions)}`}>
                    {getStatusText(result.details.permissions)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sugestões */}
          {result.suggestions.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-2">Sugestões de Correção</h4>
                  <ul className="space-y-1">
                    {result.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-yellow-700">
                        • {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}









