import type {
  LinkedFile,
  LinkedFileData,
} from '@/features/file-view/types/binary-file'

type TPRFileViewNotOriginalImporterProps = {
  file: LinkedFile<keyof LinkedFileData>
}

/**
 * Placeholder for the "only the original importer can refresh this file"
 * notice. The backend does not enforce that rule yet (the linked file agents
 * refresh with the original importer's credentials regardless of who clicks),
 * so there is nothing to tell the user and this renders nothing.
 * Registered via overleafModuleImports.tprFileViewNotOriginalImporter.
 */
export function TPRFileViewNotOriginalImporter(
  _props: TPRFileViewNotOriginalImporterProps
) {
  return null
}
