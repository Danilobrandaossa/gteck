// Sistema de persistência e backup para o CMS
export class PersistenceManager {
  private static instance: PersistenceManager
  private backupInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.startBackupInterval()
  }

  public static getInstance(): PersistenceManager {
    if (!PersistenceManager.instance) {
      PersistenceManager.instance = new PersistenceManager()
    }
    return PersistenceManager.instance
  }

  // Iniciar backup automático a cada 30 segundos
  private startBackupInterval() {
    if (typeof window !== 'undefined') {
      this.backupInterval = setInterval(() => {
        this.createBackup()
      }, 30000) // 30 segundos
    }
  }

  // Criar backup de todas as configurações
  public createBackup() {
    if (typeof window === 'undefined') return

    try {
      const backup = {
        timestamp: new Date().toISOString(),
        sites: localStorage.getItem('cms-sites'),
        selectedSite: localStorage.getItem('cms-selected-site'),
        apiConfigs: localStorage.getItem('cms-api-configs'),
        organizations: localStorage.getItem('cms-organizations'),
        users: localStorage.getItem('cms-users'),
        promptTemplates: localStorage.getItem('cms-prompt-templates')
      }

      localStorage.setItem('cms-backup', JSON.stringify(backup))
      console.log('✅ Backup automático criado:', new Date().toLocaleString('pt-BR'))
    } catch (error) {
      console.error('❌ Erro ao criar backup:', error)
    }
  }

  // Restaurar do backup mais recente
  public restoreFromBackup() {
    if (typeof window === 'undefined') return false

    try {
      const backupData = localStorage.getItem('cms-backup')
      if (!backupData) return false

      const backup = JSON.parse(backupData)
      
      // Restaurar cada item se existir
      if (backup.sites) localStorage.setItem('cms-sites', backup.sites)
      if (backup.selectedSite) localStorage.setItem('cms-selected-site', backup.selectedSite)
      if (backup.apiConfigs) localStorage.setItem('cms-api-configs', backup.apiConfigs)
      if (backup.organizations) localStorage.setItem('cms-organizations', backup.organizations)
      if (backup.users) localStorage.setItem('cms-users', backup.users)
      if (backup.promptTemplates) localStorage.setItem('cms-prompt-templates', backup.promptTemplates)

      console.log('✅ Dados restaurados do backup:', new Date(backup.timestamp).toLocaleString('pt-BR'))
      return true
    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error)
      return false
    }
  }

  // Verificar integridade dos dados
  public checkDataIntegrity() {
    if (typeof window === 'undefined') return false

    try {
      const requiredKeys = [
        'cms-sites',
        'cms-selected-site',
        'cms-api-configs'
      ]

      const missingKeys = requiredKeys.filter(key => !localStorage.getItem(key))
      
      if (missingKeys.length > 0) {
        console.warn('⚠️ Dados ausentes:', missingKeys)
        return false
      }

      return true
    } catch (error) {
      console.error('❌ Erro ao verificar integridade:', error)
      return false
    }
  }

  // Limpar dados corrompidos
  public clearCorruptedData() {
    if (typeof window === 'undefined') return

    try {
      const keys = [
        'cms-sites',
        'cms-selected-site', 
        'cms-api-configs',
        'cms-organizations',
        'cms-users',
        'cms-prompt-templates'
      ]

      keys.forEach(key => {
        try {
          const data = localStorage.getItem(key)
          if (data) {
            JSON.parse(data) // Testar se é JSON válido
          }
        } catch {
          console.warn(`🗑️ Removendo dados corrompidos: ${key}`)
          localStorage.removeItem(key)
        }
      })

      console.log('✅ Dados corrompidos removidos')
    } catch (error) {
      console.error('❌ Erro ao limpar dados corrompidos:', error)
    }
  }

  // Exportar todas as configurações
  public exportConfigurations() {
    if (typeof window === 'undefined') return null

    try {
      const configs = {
        exportDate: new Date().toISOString(),
        sites: JSON.parse(localStorage.getItem('cms-sites') || '[]'),
        selectedSite: localStorage.getItem('cms-selected-site'),
        apiConfigs: JSON.parse(localStorage.getItem('cms-api-configs') || '[]'),
        organizations: JSON.parse(localStorage.getItem('cms-organizations') || '[]'),
        users: JSON.parse(localStorage.getItem('cms-users') || '[]'),
        promptTemplates: JSON.parse(localStorage.getItem('cms-prompt-templates') || '[]')
      }

      return configs
    } catch (error) {
      console.error('❌ Erro ao exportar configurações:', error)
      return null
    }
  }

  // Importar configurações
  public importConfigurations(configs: any) {
    if (typeof window === 'undefined') return false

    try {
      if (configs.sites) localStorage.setItem('cms-sites', JSON.stringify(configs.sites))
      if (configs.selectedSite) localStorage.setItem('cms-selected-site', configs.selectedSite)
      if (configs.apiConfigs) localStorage.setItem('cms-api-configs', JSON.stringify(configs.apiConfigs))
      if (configs.organizations) localStorage.setItem('cms-organizations', JSON.stringify(configs.organizations))
      if (configs.users) localStorage.setItem('cms-users', JSON.stringify(configs.users))
      if (configs.promptTemplates) localStorage.setItem('cms-prompt-templates', JSON.stringify(configs.promptTemplates))

      console.log('✅ Configurações importadas com sucesso')
      return true
    } catch (error) {
      console.error('❌ Erro ao importar configurações:', error)
      return false
    }
  }

  // Parar backup automático
  public stopBackup() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval)
      this.backupInterval = null
    }
  }

  // Destruir instância
  public destroy() {
    this.stopBackup()
    PersistenceManager.instance = null as any
  }
}

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  const persistenceManager = PersistenceManager.getInstance()
  
  // Verificar integridade na inicialização
  if (!persistenceManager.checkDataIntegrity()) {
    console.log('🔄 Tentando restaurar do backup...')
    if (!persistenceManager.restoreFromBackup()) {
      console.log('🧹 Limpando dados corrompidos...')
      persistenceManager.clearCorruptedData()
    }
  }
}

