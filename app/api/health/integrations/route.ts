import { withApiHandler, jsonResponse } from '@/lib/api-handler'
import { getIntegrationsHealth } from '@/lib/integration-health'

export const GET = withApiHandler(async ({ requestId }) => {
  const report = await getIntegrationsHealth()
  return jsonResponse(report, requestId)
}, { route: 'health.integrations', defaultErrorCode: 'INTEGRATION_HEALTH_ERROR' })


