import { useTranslation } from 'react-i18next'
import OLNotification from '@/shared/components/ol/ol-notification'
import type {
  LinkedFile,
  LinkedFileData,
} from '@/features/file-view/types/binary-file'
import useInstanceFeatures from '@modules/instance-features/frontend/js/use-instance-features'
import { getReferenceProvider } from '../reference-providers'

type TPRFileViewRefreshErrorProps = {
  file: LinkedFile<keyof LinkedFileData>
  refreshError: string
}

/**
 * Error message shown when refreshing a linked file fails.
 * Reference-manager files get a provider-specific message where we can
 * recognise the failure; any other linked file falls through to the raw error,
 * since core renders only this one component.
 * Registered via overleafModuleImports.tprFileViewRefreshError.
 */
export function TPRFileViewRefreshError({
  file,
  refreshError,
}: TPRFileViewRefreshErrorProps) {
  const { t } = useTranslation()
  const features = useInstanceFeatures()

  const provider = getReferenceProvider(file)

  // Suppress the provider-specific error UI for a reference manager that is
  // turned off; other providers still surface their refresh errors.
  if (provider && !features[provider.id]) {
    return null
  }

  let message = refreshError

  if (provider) {
    if (!refreshError) {
      message = t(provider.i18n.loadingError)
    } else if (refreshError?.includes('not linked')) {
      message = t(provider.i18n.loadingErrorForbidden)
    } else if (refreshError === 'forbidden' || refreshError?.includes('403')) {
      message = t(provider.i18n.loadingErrorForbidden)
    } else if (
      refreshError === 'expired' ||
      refreshError?.includes('token expired')
    ) {
      message = t(provider.i18n.loadingErrorExpired)
    }
  }

  return (
    <div className="file-view-error">
      <OLNotification type="error" content={message} />
    </div>
  )
}
