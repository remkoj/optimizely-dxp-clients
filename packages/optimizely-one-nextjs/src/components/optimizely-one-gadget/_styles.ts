/**
 * Class name applied to the gadget trigger button
 */
export const TRIGGER_CLASS = 'opti-one-gadget-trigger'

/**
 * Class name applied to the gadget popover content
 */
export const CONTENT_CLASS = 'opti-one-gadget-content'

/**
 * Class name applied to the (drag-scrollable) tab list
 */
export const TABS_CLASS = 'opti-one-gadget-tabs'

/**
 * Class name applied to the Feature Experimentation panel, which renders all
 * text at the Axiom `sm` size, like the other panels (see
 * {@link FX_HEADING_CLASS} for the exception)
 */
export const FX_PANEL_CLASS = 'opti-one-gadget-fx'

/**
 * Class name applied to the flag headings of the Feature Experimentation
 * panel, which are the only text rendered larger than the body text (1.125 times
 * its size)
 */
export const FX_HEADING_CLASS = 'opti-one-gadget-fx-heading'

/**
 * Optimizely brand green, used for the trigger button
 */
const OPTI_GREEN = '#3be081'

/**
 * Stylesheet for the parts of the gadget that cannot be expressed with Axiom
 * props: brand colours with hover states, responsive width, drag-scroll tab list styling and a defensive
 * reset of inherited properties.
 *
 * Axiom styles live in the `optiaxiom` CSS layer, so any unlayered host page
 * CSS wins over them. These rules are deliberately unlayered (so they win over
 * host element selectors such as `button` or `a`) and scoped to the gadget
 * classes. The inherited-property reset prevents host typography (uppercase
 * transforms, letter spacing, font families, text alignment) from leaking in.
 */
export const GADGET_CSS = `
.${TRIGGER_CLASS},
.${CONTENT_CLASS} {
  font-family: var(--ax-fontFamily-sans, system-ui, sans-serif);
  font-style: normal;
  line-height: 1.5;
  text-transform: none;
  text-indent: 0;
  text-shadow: none;
  word-spacing: normal;
  direction: ltr;
  visibility: visible;
  box-sizing: border-box;
}
.${CONTENT_CLASS} {
  font-size: 0.875rem;
  font-weight: 400;
  letter-spacing: normal;
  text-align: left;
  white-space: normal;
  color: var(--ax-colors-fg-default);
  width: calc(100vw - 2rem);
  max-width: none;
}
.${CONTENT_CLASS} *,
.${CONTENT_CLASS} *::before,
.${CONTENT_CLASS} *::after {
  box-sizing: border-box;
}
.${TRIGGER_CLASS} {
  background-color: ${OPTI_GREEN};
  color: #0b1f16;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.${TRIGGER_CLASS}:hover {
  background-color: #2bc771;
}
.${TRIGGER_CLASS}:active {
  background-color: #22b062;
}
.${TRIGGER_CLASS}:focus-visible {
  outline: 2px solid #0b1f16;
  outline-offset: 2px;
}
.${FX_PANEL_CLASS} {
  font-size: var(--ax-fontSize-sm-fontSize, 0.875rem);
}
.${FX_PANEL_CLASS} * {
  font-size: inherit;
}
.${FX_PANEL_CLASS} .${FX_HEADING_CLASS} {
  font-size: 1.125em;
  font-weight: 600;
  line-height: 1.4;
}
.${TABS_CLASS} {
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  overscroll-behavior-x: contain;
}
.${TABS_CLASS}:active {
  cursor: grabbing;
}
@media (min-width: 768px) {
  .${CONTENT_CLASS} {
    width: 75vw;
  }
}
@media (min-width: 1280px) {
  .${CONTENT_CLASS} {
    width: 50vw;
  }
}
`

const LAYER_ORDER_STYLE_ID = 'opti-one-gadget-layer-order'

/**
 * Makes sure that the Axiom CSS layer (`optiaxiom`) takes precedence over all
 * cascade layers that the host site defines (for example the Tailwind CSS
 * `base` and `utilities` layers).
 *
 * Cascade layer order is determined by the first declaration of each layer in
 * document order. Axiom's stylesheet is usually loaded before the site
 * stylesheet, which puts `optiaxiom` *below* the site's resets (`padding: 0`,
 * `border-radius: 0` on buttons, ...) and breaks the gadget's spacing. This
 * function collects the host layers and prepends a `@layer` statement that
 * lists them first and `optiaxiom` last, which re-orders the layers without
 * touching any site styles. It is idempotent and does nothing on the server.
 *
 * @returns Nothing
 */
export function ensureAxiomLayerOrder(): void {
  if (typeof document === 'undefined') return
  const hostLayers = new Set<string>()
  const addLayer = (name: unknown) => {
    if (typeof name !== 'string' || name.length === 0) return
    const topLevel = name.split('.')[0]
    if (topLevel !== 'optiaxiom') hostLayers.add(topLevel)
  }
  for (const sheet of Array.from(document.styleSheets)) {
    if (sheet.ownerNode instanceof Element && sheet.ownerNode.id === LAYER_ORDER_STYLE_ID)
      continue
    let rules: CSSRuleList
    try {
      rules = sheet.cssRules
    } catch {
      continue // Cross-origin stylesheet, rules are not accessible
    }
    for (const rule of Array.from(rules) as Array<
      CSSRule & { name?: string; nameList?: string[]; layerName?: string }
    >) {
      if (Array.isArray(rule.nameList)) rule.nameList.forEach(addLayer)
      else addLayer(rule.name ?? rule.layerName)
    }
  }
  const statement = `@layer ${[...hostLayers, 'optiaxiom'].join(', ')};`
  let style = document.getElementById(
    LAYER_ORDER_STYLE_ID
  ) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = LAYER_ORDER_STYLE_ID
    document.head.prepend(style)
  }
  if (style.textContent !== statement) style.textContent = statement
}
