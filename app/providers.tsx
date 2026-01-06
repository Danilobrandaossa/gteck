'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/contexts/auth-context'
import { OrganizationProvider } from '@/contexts/organization-context'
import { PagesProvider } from '@/contexts/pages-context'
import { TemplatesProvider } from '@/contexts/templates-context'
import { MediaProvider } from '@/contexts/media-context'
import { UsersProvider } from '@/contexts/users-context'
import { CategoriesProvider } from '@/contexts/categories-context'
import { WordPressProvider } from '@/contexts/wordpress-context'
import { AIProvider } from '@/contexts/ai-context'
import { QueueProvider } from '@/contexts/queue-context'
import { SEOProvider } from '@/contexts/seo-context'
import { BulkOperationsProvider } from '@/contexts/bulk-operations-context'
import { PresselProvider } from '@/contexts/pressel-context'
import { APIConfigProvider } from '@/contexts/api-config-context'
import { PromptTemplatesProvider } from '@/contexts/prompt-templates-context'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <OrganizationProvider>
          <PagesProvider>
            <TemplatesProvider>
              <MediaProvider>
                <UsersProvider>
                  <CategoriesProvider>
                    <WordPressProvider>
                      <AIProvider>
                        <QueueProvider>
                          <SEOProvider>
                            <BulkOperationsProvider>
                              <PresselProvider>
                                <APIConfigProvider>
                                  <PromptTemplatesProvider>
                                    {children}
                                  </PromptTemplatesProvider>
                                </APIConfigProvider>
                              </PresselProvider>
                            </BulkOperationsProvider>
                          </SEOProvider>
                        </QueueProvider>
                      </AIProvider>
                    </WordPressProvider>
                  </CategoriesProvider>
                </UsersProvider>
              </MediaProvider>
            </TemplatesProvider>
          </PagesProvider>
        </OrganizationProvider>
    </AuthProvider>
  )
}
