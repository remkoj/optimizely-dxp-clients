'use client'

import {
  useCallback,
  useRef,
  type FunctionComponent,
  type PointerEvent,
  type PropsWithChildren,
  type ReactNode,
} from 'react'
import { Box, Flex, Text } from '@optiaxiom/react'

/**
 * Two-column definition list used by the gadget panels to show label/value
 * pairs.
 *
 * @param props   The list contents, use {@link Term} and {@link Description}.
 * @returns       The definition list.
 */
export const DefinitionList: FunctionComponent<PropsWithChildren> = ({
  children,
}) => (
  <Box
    asChild
    m="0"
    style={{
      display: 'grid',
      gridTemplateColumns: 'fit-content(9rem) minmax(0, 1fr)',
      columnGap: '1rem',
      rowGap: '0.5rem',
    }}
  >
    <dl>{children}</dl>
  </Box>
)

/**
 * The label of a {@link DefinitionList} entry.
 *
 * @param props   The label content.
 * @returns       The label element.
 */
export const Term: FunctionComponent<PropsWithChildren> = ({ children }) => (
  <Box asChild m="0" color="fg.secondary" fontSize="sm" fontWeight="600">
    <dt>{children}</dt>
  </Box>
)

/**
 * The value of a {@link DefinitionList} entry.
 *
 * @param props   The value content.
 * @returns       The value element.
 */
export const Description: FunctionComponent<PropsWithChildren> = ({
  children,
}) => (
  <Box
    asChild
    m="0"
    fontSize="sm"
    style={{ overflowWrap: 'anywhere', fontFamily: 'inherit' }}
  >
    <dd>{children}</dd>
  </Box>
)

/**
 * A list of items separated by a thin border.
 *
 * @param props   The list items, use {@link ListItem}.
 * @returns       The list element.
 */
export const ItemList: FunctionComponent<PropsWithChildren> = ({
  children,
}) => (
  <Box asChild m="0" p="0" style={{ listStyle: 'none' }}>
    <ul>{children}</ul>
  </Box>
)

/**
 * An entry of an {@link ItemList}, with an optional leading icon.
 *
 * @param props   The entry content and optional icon.
 * @returns       The list item.
 */
export const ListItem: FunctionComponent<
  PropsWithChildren<{ icon?: ReactNode }>
> = ({ icon, children }) => (
  <Box
    asChild
    py="6"
    fontSize="sm"
    borderB="1"
    borderColor="border.tertiary"
  >
    <li>
      <Flex flexDirection="row" alignItems="center" gap="8">
        {icon && (
          <Box asChild color="fg.secondary" style={{ flex: 'none' }}>
            <span style={{ display: 'inline-flex' }}>{icon}</span>
          </Box>
        )}
        <Box style={{ minWidth: 0 }}>{children}</Box>
      </Flex>
    </li>
  </Box>
)

/**
 * A titled block of content, used to group related information in a panel.
 *
 * @param props   The section title and content.
 * @returns       The section element.
 */
export const Section: FunctionComponent<
  PropsWithChildren<{ title: string }>
> = ({ title, children }) => (
  <Box mb="12">
    <Text fontSize="sm" fontWeight="600" color="fg.secondary" mb="2">
      {title}
    </Text>
    <Box fontSize="sm">{children}</Box>
  </Box>
)

/**
 * Small attribution line shown at the bottom of a panel.
 *
 * @param props   The attribution text.
 * @returns       The attribution element.
 */
export const PoweredBy: FunctionComponent<PropsWithChildren> = ({
  children,
}) => (
  <Text fontSize="xs" color="fg.tertiary" mt="12">
    {children}
  </Text>
)

/**
 * Adds click-and-drag horizontal scrolling to a scrollable element, while
 * still allowing regular clicks on its children.
 *
 * Dragging further than 4px captures the pointer, scrolls the element and
 * suppresses the click that would otherwise activate the child under the
 * pointer. Touch input is left alone, as it scrolls natively.
 *
 * @returns   The props to spread on the scrollable element
 */
export function useDragScroll<T extends HTMLElement>() {
  const state = useRef({ active: false, dragged: false, startX: 0, scroll: 0 })
  return {
    onPointerDown: useCallback((e: PointerEvent<T>) => {
      if (e.pointerType === 'touch' || e.button !== 0) return
      state.current = {
        active: true,
        dragged: false,
        startX: e.clientX,
        scroll: e.currentTarget.scrollLeft,
      }
    }, []),
    onPointerMove: useCallback((e: PointerEvent<T>) => {
      const s = state.current
      if (!s.active) return
      const delta = e.clientX - s.startX
      if (!s.dragged && Math.abs(delta) > 4) {
        s.dragged = true
        e.currentTarget.setPointerCapture(e.pointerId)
      }
      if (s.dragged) e.currentTarget.scrollLeft = s.scroll - delta
    }, []),
    onPointerUp: useCallback((e: PointerEvent<T>) => {
      state.current.active = false
      if (e.currentTarget.hasPointerCapture(e.pointerId))
        e.currentTarget.releasePointerCapture(e.pointerId)
    }, []),
    onPointerCancel: useCallback(() => {
      state.current.active = false
      state.current.dragged = false
    }, []),
    onClickCapture: useCallback((e: React.MouseEvent<T>) => {
      if (state.current.dragged) {
        e.preventDefault()
        e.stopPropagation()
        state.current.dragged = false
      }
    }, []),
  }
}
