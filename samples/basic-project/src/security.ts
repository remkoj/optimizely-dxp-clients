import type { SecurityPolicySources } from '@remkoj/optimizely-one-nextjs/security'

const self = '\'self\''
const unsafeInline = '\'unsafe-inline\''
const unsafeEval = '\'unsafe-eval\''

/**
 * The base sources of this site, shared by next.config.ts (static policy) and
 * proxy.ts (request-dependent policy), so both build the same base policy.
 *
 * Next.js needs inline scripts and styles; development additionally needs
 * 'unsafe-eval' and websockets for HMR.
 */
export function baseSources(isDevelopment: boolean): Partial<SecurityPolicySources> {
  return {
    'script-src': [self, unsafeInline, ...(isDevelopment ? [unsafeEval] : [])],
    'connect-src': [self, ...(isDevelopment ? ['ws:', 'wss:'] : [])],
    'img-src': [self, 'data:'],
    'frame-src': [self],
    'style-src': [self, unsafeInline],
    'font-src': [self, 'data:'],
    'worker-src': [self]
  }
}
