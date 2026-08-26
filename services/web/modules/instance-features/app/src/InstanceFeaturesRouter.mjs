import Settings from '@overleaf/settings'
import Features from '../../../../app/src/infrastructure/Features.mjs'
import AuthenticationController from '../../../../app/src/Features/Authentication/AuthenticationController.mjs'
import AuthorizationMiddleware from '../../../../app/src/Features/Authorization/AuthorizationMiddleware.mjs'
import AiChatController from '../../../../app/src/Features/AiChat/AiChatController.mjs'
import { RateLimiter } from '../../../../app/src/infrastructure/RateLimiter.mjs'
import RateLimiterMiddleware from '../../../../app/src/Features/Security/RateLimiterMiddleware.mjs'

const aiChatRateLimiter = new RateLimiter('ai-chat', {
  points: 30,
  duration: 60,
})

// Reports which instance-level (env-gated) features are enabled
// (Need login to avoid abuse)
// 1. githubSync: whether GitHub Sync is enabled
//    (env var GITHUB_SYNC_ENABLED; via Features.hasFeature, same as git-bridge)
// 2. zotero / mendeley: whether each reference-manager integration is enabled
//    (env var ENABLED_LINKED_FILE_TYPES includes the provider name; no Features
//    case exists for them, so we read the setting directly)

// Other features can be exposed with `ol-` meta, so no need to add them here
// unless they are instance-level and env-gated.

export default {
  apply(webRouter) {
    webRouter.get(
      '/system/features',
      AuthenticationController.requireLogin(),
      (_req, res) => {
        res.json({
          githubSync: Features.hasFeature('github-sync'),
          zotero: Boolean(Settings.enabledLinkedFileTypes?.includes('zotero')),
          mendeley: Boolean(
            Settings.enabledLinkedFileTypes?.includes('mendeley')
          ),
        })
      }
    )

    webRouter.post(
      '/project/:project_id/ai-chat',
      AuthenticationController.requireLogin(),
      AuthorizationMiddleware.blockRestrictedUserFromProject,
      AuthorizationMiddleware.ensureUserCanReadProject,
      RateLimiterMiddleware.rateLimit(aiChatRateLimiter, {
        params: ['project_id'],
      }),
      AiChatController.chat
    )
  },
}
