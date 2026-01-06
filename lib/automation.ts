import { logger } from './logger'
import { retryLogic, retryConfigs } from './retry-logic'

export interface WebhookConfig {
  id: string
  name: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers: Record<string, string>
  secret?: string
  events: string[]
  active: boolean
  retryCount: number
  timeout: number
}

export interface AutomationTrigger {
  id: string
  name: string
  type: 'content_created' | 'content_updated' | 'content_deleted' | 'user_registered' | 'ai_generated' | 'wordpress_synced' | 'custom'
  conditions?: Record<string, any>
  webhooks: string[]
  active: boolean
}

export interface AutomationAction {
  id: string
  name: string
  type: 'webhook' | 'email' | 'whatsapp' | 'slack' | 'discord' | 'n8n' | 'zapier' | 'custom'
  config: Record<string, any>
  active: boolean
}

export class AutomationManager {
  private webhooks = new Map<string, WebhookConfig>()
  private triggers = new Map<string, AutomationTrigger>()
  private actions = new Map<string, AutomationAction>()

  // Webhook Management
  addWebhook(webhook: WebhookConfig): void {
    this.webhooks.set(webhook.id, webhook)
    logger.info('Webhook added', { webhookId: webhook.id, name: webhook.name })
  }

  updateWebhook(webhookId: string, updates: Partial<WebhookConfig>): void {
    const webhook = this.webhooks.get(webhookId)
    if (!webhook) return

    const updatedWebhook = { ...webhook, ...updates }
    this.webhooks.set(webhookId, updatedWebhook)
    
    logger.info('Webhook updated', { webhookId, updates: Object.keys(updates) })
  }

  removeWebhook(webhookId: string): void {
    this.webhooks.delete(webhookId)
    logger.info('Webhook removed', { webhookId })
  }

  // Trigger Management
  addTrigger(trigger: AutomationTrigger): void {
    this.triggers.set(trigger.id, trigger)
    logger.info('Trigger added', { triggerId: trigger.id, name: trigger.name })
  }

  updateTrigger(triggerId: string, updates: Partial<AutomationTrigger>): void {
    const trigger = this.triggers.get(triggerId)
    if (!trigger) return

    const updatedTrigger = { ...trigger, ...updates }
    this.triggers.set(triggerId, updatedTrigger)
    
    logger.info('Trigger updated', { triggerId, updates: Object.keys(updates) })
  }

  removeTrigger(triggerId: string): void {
    this.triggers.delete(triggerId)
    logger.info('Trigger removed', { triggerId })
  }

  // Action Management
  addAction(action: AutomationAction): void {
    this.actions.set(action.id, action)
    logger.info('Action added', { actionId: action.id, name: action.name })
  }

  updateAction(actionId: string, updates: Partial<AutomationAction>): void {
    const action = this.actions.get(actionId)
    if (!action) return

    const updatedAction = { ...action, ...updates }
    this.actions.set(actionId, updatedAction)
    
    logger.info('Action updated', { actionId, updates: Object.keys(updates) })
  }

  removeAction(actionId: string): void {
    this.actions.delete(actionId)
    logger.info('Action removed', { actionId })
  }

  // Event Processing
  async processEvent(eventType: string, data: any): Promise<void> {
    logger.info('Processing event', { eventType, dataKeys: Object.keys(data) })

    // Encontrar triggers ativos para este evento
    const activeTriggers = Array.from(this.triggers.values())
      .filter(trigger => trigger.active && trigger.type === eventType)

    for (const trigger of activeTriggers) {
      try {
        // Verificar condições se existirem
        if (trigger.conditions && !this.evaluateConditions(trigger.conditions, data)) {
          continue
        }

        // Executar webhooks associados
        for (const webhookId of trigger.webhooks) {
          const webhook = this.webhooks.get(webhookId)
          if (webhook && webhook.active) {
            await this.executeWebhook(webhook, data)
          }
        }

        logger.info('Trigger executed', { triggerId: trigger.id, eventType })
      } catch (error) {
        logger.error('Trigger execution failed', {
          triggerId: trigger.id,
          eventType,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }
  }

  private evaluateConditions(conditions: Record<string, any>, data: any): boolean {
    // Implementar lógica de avaliação de condições
    // Por enquanto, sempre retorna true
    return true
  }

  private async executeWebhook(webhook: WebhookConfig, data: any): Promise<void> {
    const startTime = Date.now()

    try {
      await retryLogic.execute(
        async () => {
          const response = await fetch(webhook.url, {
            method: webhook.method,
            headers: {
              'Content-Type': 'application/json',
              ...webhook.headers,
              ...(webhook.secret && {
                'X-Webhook-Secret': webhook.secret
              })
            },
            body: JSON.stringify({
              event: 'cms_event',
              timestamp: new Date().toISOString(),
              data
            }),
            signal: AbortSignal.timeout(webhook.timeout)
          })

          if (!response.ok) {
            throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
          }

          return response
        },
        {
          ...retryConfigs.webhook,
          onRetry: (error, attempt) => {
            logger.retryAttempt('webhook', attempt, error.message)
          }
        }
      )

      const duration = Date.now() - startTime
      logger.webhookCall(webhook.url, true, duration)

    } catch (error) {
      const duration = Date.now() - startTime
      logger.webhookCall(webhook.url, false, duration)
      
      logger.error('Webhook execution failed', {
        webhookId: webhook.id,
        url: webhook.url,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }
  }

  // Métodos específicos para diferentes tipos de eventos
  async onContentCreated(content: any): Promise<void> {
    await this.processEvent('content_created', {
      type: 'content',
      action: 'created',
      content
    })
  }

  async onContentUpdated(content: any): Promise<void> {
    await this.processEvent('content_updated', {
      type: 'content',
      action: 'updated',
      content
    })
  }

  async onContentDeleted(contentId: string): Promise<void> {
    await this.processEvent('content_deleted', {
      type: 'content',
      action: 'deleted',
      contentId
    })
  }

  async onUserRegistered(user: any): Promise<void> {
    await this.processEvent('user_registered', {
      type: 'user',
      action: 'registered',
      user
    })
  }

  async onAIGenerated(aiData: any): Promise<void> {
    await this.processEvent('ai_generated', {
      type: 'ai',
      action: 'generated',
      ...aiData
    })
  }

  async onWordPressSynced(syncData: any): Promise<void> {
    await this.processEvent('wordpress_synced', {
      type: 'wordpress',
      action: 'synced',
      ...syncData
    })
  }

  // Getters
  getWebhook(webhookId: string): WebhookConfig | undefined {
    return this.webhooks.get(webhookId)
  }

  getAllWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values())
  }

  getTrigger(triggerId: string): AutomationTrigger | undefined {
    return this.triggers.get(triggerId)
  }

  getAllTriggers(): AutomationTrigger[] {
    return Array.from(this.triggers.values())
  }

  getAction(actionId: string): AutomationAction | undefined {
    return this.actions.get(actionId)
  }

  getAllActions(): AutomationAction[] {
    return Array.from(this.actions.values())
  }
}

export const automationManager = new AutomationManager()

