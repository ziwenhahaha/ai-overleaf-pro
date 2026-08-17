import logger from '@overleaf/logger'
import { callbackify } from '@overleaf/promise-utils'
import UserGetter from '../../../../app/src/Features/User/UserGetter.mjs'
import LinkedFilesHandler from '../../../../app/src/Features/LinkedFiles/LinkedFilesHandler.mjs'
import LinkedFilesErrors from '../../../../app/src/Features/LinkedFiles/LinkedFilesErrors.mjs'
import MendeleyApiClient from './MendeleyApiClient.mjs'
import {
  MendeleyForbiddenError,
  MendeleyExpiredError,
  MendeleyAccountNotLinkedError,
} from './MendeleyApiClient.mjs'

const { AccessDeniedError, RemoteServiceError } = LinkedFilesErrors

/**
 * Create a linked .bib file from Mendeley (either My Library or a group).
 *
 * linkedFileData shape:
 *   {
 *     provider: 'mendeley'
 *     mendeleyGroupId?: string
 *     importedAt: Date | string
 *     importedByUserId?: string
 *     importedByName?: string
 *   }
 */
async function createLinkedFile(
  projectId,
  linkedFileData,
  name,
  parentFolderId,
  userId
) {
  logger.debug(
    { projectId, userId, groupId: linkedFileData.mendeleyGroupId },
    'creating Mendeley linked file'
  )

  linkedFileData.importedByUserId = userId
  linkedFileData.importedByName = await _getUserName(userId)

  const bibtex = await _getBibtex(linkedFileData)

  const file = await LinkedFilesHandler.promises.importContent(
    projectId,
    bibtex,
    _sanitizeData(linkedFileData),
    name,
    parentFolderId,
    userId
  )
  return file._id
}

/** Refresh an existing Mendeley linked .bib file. */
async function refreshLinkedFile(
  projectId,
  linkedFileData,
  name,
  parentFolderId,
  userId
) {
  logger.debug(
    { projectId, userId, groupId: linkedFileData.mendeleyGroupId },
    'refreshing Mendeley linked file'
  )

  const bibtex = await _getBibtex(linkedFileData)

  const file = await LinkedFilesHandler.promises.importContent(
    projectId,
    bibtex,
    _sanitizeData(linkedFileData),
    name,
    parentFolderId,
    userId
  )
  return file._id
}

async function _getBibtex(linkedFileData) {
  const userId = linkedFileData.importedByUserId
  try {
    if (linkedFileData.mendeleyGroupId) {
      return await MendeleyApiClient.getGroupLibraryBibtex(
        userId,
        linkedFileData.mendeleyGroupId
      )
    } else {
      return await MendeleyApiClient.getUserLibraryBibtex(userId)
    }
  } catch (err) {
    if (err instanceof MendeleyExpiredError) {
      throw new AccessDeniedError('Mendeley token expired').withCause(err)
    }
    if (err instanceof MendeleyForbiddenError) {
      throw new AccessDeniedError('Mendeley access denied').withCause(err)
    }
    if (err instanceof MendeleyAccountNotLinkedError) {
      throw new AccessDeniedError('Mendeley account not linked').withCause(err)
    }
    throw new RemoteServiceError('Mendeley API error').withCause(err)
  }
}

function _sanitizeData(data) {
  return {
    provider: 'mendeley',
    ...(data.mendeleyGroupId && {
      mendeleyGroupId: data.mendeleyGroupId,
    }),
    importedAt: data.importedAt,
    ...(data.importedByUserId && {
      importedByUserId: data.importedByUserId,
    }),
    importedByName: data.importedByName || 'Unknown',
  }
}

async function _getUserName(userId) {
  let user = null
  try {
    user = await UserGetter.promises.getUser(userId, {
      email: 1,
      first_name: 1,
      last_name: 1,
    })
  } catch (err) {
    logger.error({ userId, err }, 'failed to get user info')
  }
  if (!user) return 'Unknown'

  const { email, first_name, last_name } = user
  const name =
    first_name || last_name
      ? [first_name, last_name].filter(n => n != null).join(' ')
      : email
  return name || 'Unknown'
}

export default {
  createLinkedFile: callbackify(createLinkedFile),
  refreshLinkedFile: callbackify(refreshLinkedFile),
  promises: { createLinkedFile, refreshLinkedFile },
}
