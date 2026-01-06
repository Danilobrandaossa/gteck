'use client'

import { useState } from 'react'
import { useOrganization } from '@/contexts/organization-context'
import { ChevronDown, Building2, Globe, Plus } from 'lucide-react'

export function OrganizationSelector() {
  const { 
    currentOrganization, 
    currentSite, 
    organizations, 
    sites,
    setCurrentOrganization,
    setCurrentSite 
  } = useOrganization()
  
  const [isOrgOpen, setIsOrgOpen] = useState(false)
  const [isSiteOpen, setIsSiteOpen] = useState(false)

  const handleOrgChange = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId)
    if (org) {
      setCurrentOrganization(org)
      setCurrentSite(null) // Reset site when changing org
    }
    setIsOrgOpen(false)
  }

  const handleSiteChange = (siteId: string) => {
    const site = sites.find(s => s.id === siteId)
    if (site) {
      setCurrentSite(site)
    }
    setIsSiteOpen(false)
  }

  return (
    <div style={{ padding: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
      {/* Organization Selector */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '0.75rem', 
          fontWeight: '500', 
          color: 'var(--gray-500)', 
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Organização
        </label>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsOrgOpen(!isOrgOpen)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--gray-300)',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--white)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 style={{ width: '1rem', height: '1rem', color: 'var(--primary)' }} />
              <span style={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                maxWidth: '120px'
              }}>
                {currentOrganization?.name || 'Selecionar...'}
              </span>
            </div>
            <ChevronDown style={{ 
              width: '1rem', 
              height: '1rem', 
              color: 'var(--gray-400)',
              transform: isOrgOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }} />
          </button>

          {isOrgOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'var(--white)',
              border: '1px solid var(--gray-300)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 50,
              marginTop: '0.25rem'
            }}>
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleOrgChange(org.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    textAlign: 'left',
                    backgroundColor: currentOrganization?.id === org.id ? 'var(--primary-light)' : 'transparent',
                    color: currentOrganization?.id === org.id ? 'var(--primary)' : 'var(--gray-700)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Building2 style={{ width: '1rem', height: '1rem' }} />
                  <span style={{ 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap'
                  }}>
                    {org.name}
                  </span>
                </button>
              ))}
              <div style={{ borderTop: '1px solid var(--gray-200)', margin: '0.25rem 0' }} />
        <button
          onClick={() => window.location.href = '/settings?tab=organizations'}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            textAlign: 'left',
            backgroundColor: 'transparent',
            color: 'var(--gray-500)',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Plus style={{ width: '1rem', height: '1rem' }} />
          Nova Organização
        </button>
            </div>
          )}
        </div>
      </div>

      {/* Site Selector */}
      {currentOrganization && (
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '0.75rem', 
            fontWeight: '500', 
            color: 'var(--gray-500)', 
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Site
          </label>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsSiteOpen(!isSiteOpen)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--gray-300)',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--white)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Globe style={{ width: '1rem', height: '1rem', color: 'var(--primary)' }} />
                <span style={{ 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap',
                  maxWidth: '120px'
                }}>
                  {currentSite?.name || 'Selecionar...'}
                </span>
              </div>
              <ChevronDown style={{ 
                width: '1rem', 
                height: '1rem', 
                color: 'var(--gray-400)',
                transform: isSiteOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }} />
            </button>

            {isSiteOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'var(--white)',
                border: '1px solid var(--gray-300)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 50,
                marginTop: '0.25rem'
              }}>
                {sites.filter(site => site.organizationId === currentOrganization?.id).map((site) => (
                  <button
                    key={site.id}
                    onClick={() => handleSiteChange(site.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.875rem',
                      textAlign: 'left',
                      backgroundColor: currentSite?.id === site.id ? 'var(--primary-light)' : 'transparent',
                      color: currentSite?.id === site.id ? 'var(--primary)' : 'var(--gray-700)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Globe style={{ width: '1rem', height: '1rem' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        fontWeight: currentSite?.id === site.id ? '500' : '400'
                      }}>
                        {site.name}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--gray-500)',
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap'
                      }}>
                        {site.url}
                      </div>
                    </div>
                    {!site.isActive && (
                      <div style={{
                        width: '0.5rem',
                        height: '0.5rem',
                        backgroundColor: 'var(--gray-400)',
                        borderRadius: '50%'
                      }} />
                    )}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid var(--gray-200)', margin: '0.25rem 0' }} />
                <button
                  onClick={() => window.location.href = '/settings?tab=sites'}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    textAlign: 'left',
                    backgroundColor: 'transparent',
                    color: 'var(--gray-500)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Plus style={{ width: '1rem', height: '1rem' }} />
                  Novo Site
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

