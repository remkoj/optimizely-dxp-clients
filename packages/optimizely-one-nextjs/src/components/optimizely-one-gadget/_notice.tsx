'use client'

import {
  type ReactNode,
  type FunctionComponent,
  type PropsWithChildren,
} from 'react'
import { Alert, Box, Spinner } from '@optiaxiom/react'

/**
 * Message box used by the gadget panels to show loading, error and
 * informational states.
 *
 * @param props   Optional bold prefix, message, loading state and children.
 * @returns       The notice element.
 */
export const Notice: FunctionComponent<
  PropsWithChildren<{
    prefix?: string
    message?: string | ReactNode
    isLoading?: boolean
  }>
> = ({ prefix, message, isLoading = false, children }) => {
  return (
    <Box my="8">
      <Alert intent={isLoading ? 'information' : 'warning'}>
        {isLoading && (
          <Box mr="8" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
            <Spinner />
          </Box>
        )}
        {prefix && <strong>{prefix} </strong>}
        {message}
        {children}
      </Alert>
    </Box>
  )
}

export default Notice
