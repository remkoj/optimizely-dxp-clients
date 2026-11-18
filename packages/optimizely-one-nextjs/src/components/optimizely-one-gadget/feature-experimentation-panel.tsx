'use client'

import { useDecideAll } from '@optimizely/react-sdk'
import {
  Box,
  Code,
  Disclosure,
  DisclosureContent,
  DisclosureTrigger,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
} from '@optiaxiom/react'
import Notice from './_notice.js'
import { FX_HEADING_CLASS, FX_PANEL_CLASS } from './_styles'
import { DefinitionList, Description, ItemList, ListItem, Term } from './_ui'

/**
 * Formats a flag variable value for display in the variables table.
 *
 * @param value   The variable value, as returned by the SDK
 * @returns       The text representation of the value
 */
const formatValue = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value, null, 2)

/**
 * Displays Feature Experimentation flag decisions from the active SDK user.
 * Each flag is a collapsed (by default) disclosure whose heading shows the flag
 * key and state; its details are the variation and rule as a definition list
 * and the variables as a table. All text uses one size, except the headings.
 *
 * @param props                                 The panel properties
 * @param props.featureExperimentationProject   Optional Feature Experimentation
 *                                              project ID, shown when set.
 * @returns A panel containing the current feature flag decisions.
 */
export default function FeatureExperimentationPanel({
  featureExperimentationProject,
}: {
  featureExperimentationProject?: string
}) {
  const { decisions, isLoading, error } = useDecideAll()

  if (isLoading)
    return (
      <Notice message="Loading Feature Experimentation decisions..." isLoading />
    )

  if (error)
    return (
      <Notice
        message={`Unable to load Feature Experimentation decisions: ${error.message}`}
      />
    )

  const decisionEntries = Object.entries(decisions)
  if (decisionEntries.length === 0)
    return (
      <Notice message="No active Feature Experimentation flags are available." />
    )

  return (
    <Box className={FX_PANEL_CLASS} fontSize="sm">
      {featureExperimentationProject && (
        <Text fontSize="sm" mb="8">
          Project ID: <Code>{featureExperimentationProject}</Code>
        </Text>
      )}
      <ItemList>
        {decisionEntries.map(([flagKey, decision]) => {
          const variables = Object.entries(decision.variables ?? {})
          return (
            <ListItem key={flagKey}>
              <Disclosure style={{ width: '100%', minWidth: 0 }}>
                <DisclosureTrigger>
                  <Text
                    asChild
                    className={FX_HEADING_CLASS}
                    style={{ overflowWrap: 'anywhere' }}
                  >
                    <span role="heading" aria-level={3}>
                      {flagKey}
                      <Text
                        asChild
                        color={decision.enabled ? 'fg.success' : 'fg.tertiary'}
                        fontWeight="600"
                      >
                        <span>
                          {' · '}
                          {decision.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </Text>
                    </span>
                  </Text>
                </DisclosureTrigger>
                <DisclosureContent>
                  <DefinitionList>
                    {decision.variationKey && (
                      <>
                        <Term>Variation</Term>
                        <Description>
                          <Code>{decision.variationKey}</Code>
                        </Description>
                      </>
                    )}
                    {decision.ruleKey && (
                      <>
                        <Term>Rule</Term>
                        <Description>
                          <Code>{decision.ruleKey}</Code>
                        </Description>
                      </>
                    )}
                  </DefinitionList>
                  {variables.length > 0 && (
                    <Box mt="8">
                      <Table aria-label={`Variables of ${flagKey}`}>
                        <TableHeader>
                          <TableRow>
                            <TableHeaderCell>Variable</TableHeaderCell>
                            <TableHeaderCell>Value</TableHeaderCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {variables.map(([name, value]) => (
                            <TableRow key={name}>
                              <TableCell>{name}</TableCell>
                              <TableCell>
                                <Code
                                  style={{
                                    whiteSpace: 'pre-wrap',
                                    overflowWrap: 'anywhere',
                                  }}
                                >
                                  {formatValue(value)}
                                </Code>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  )}
                </DisclosureContent>
              </Disclosure>
            </ListItem>
          )
        })}
      </ItemList>
    </Box>
  )
}
