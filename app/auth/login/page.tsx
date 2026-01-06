'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { Logo } from '@/components/logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const { login, isLoading } = useAuth()
  const router = useRouter()

  // Carregar credenciais salvas ao montar o componente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('cms_remembered_email')
      const savedPassword = localStorage.getItem('cms_remembered_password')
      const savedRememberMe = localStorage.getItem('cms_remember_me') === 'true'

      if (savedRememberMe && savedEmail) {
        setEmail(savedEmail)
        setRememberMe(true)
        if (savedPassword) {
          setPassword(savedPassword)
        }
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const result = await login(email, password)
    
    if (result.success) {
      // Salvar credenciais se "Lembrar de mim" estiver marcado
      if (typeof window !== 'undefined') {
        if (rememberMe) {
          localStorage.setItem('cms_remembered_email', email)
          localStorage.setItem('cms_remembered_password', password)
          localStorage.setItem('cms_remember_me', 'true')
        } else {
          localStorage.removeItem('cms_remembered_email')
          localStorage.removeItem('cms_remembered_password')
          localStorage.removeItem('cms_remember_me')
        }
      }
      router.push('/dashboard')
    } else {
      setError(result.error || 'Erro no login')
    }
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      style={{ 
        minHeight: '100vh', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary-light) 100%)'
      }}
    >
      <div className="cms-card" style={{ width: '100%', maxWidth: '400px', margin: '1rem' }}>
        <div className="cms-card-content" style={{ padding: '2rem' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <Logo size="large" />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
              Bem-vindo de volta
            </h1>
            <p style={{ color: 'var(--gray-600)' }}>
              Faça login para acessar
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ 
              padding: '0.75rem', 
            backgroundColor: 'var(--error-light)', 
            border: '1px solid var(--red-300)',
              borderRadius: 'var(--radius)', 
              color: 'var(--danger)',
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ 
                  position: 'absolute', 
                  left: '0.75rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  width: '1rem', 
                  height: '1rem', 
                  color: 'var(--gray-400)' 
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '1rem',
                  height: '1rem',
                  color: 'var(--gray-400)'
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--gray-400)'
                  }}
                >
                  {showPassword ? <EyeOff style={{ width: '1rem', height: '1rem' }} /> : <Eye style={{ width: '1rem', height: '1rem' }} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-600)', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ margin: 0, cursor: 'pointer' }} 
                />
                Lembrar de mim
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="cms-btn cms-btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem',
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}