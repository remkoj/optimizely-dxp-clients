import type { GenericContext } from "../rsc.js"
import type { PropsWithChildren, JSX } from "react"

/**
 * Define an element as a React Component, React ExoticComponent or string name
 * representing a HTML Element (e.g. "div", "a", etc...), this value can be used
 * as first argument of React.createElement()
 */
export type ElementType = (React.ComponentType<any>) | (React.ExoticComponent<any>) | (keyof JSX.IntrinsicElements)
/**
 * Define an element as a React Component, React ExoticComponent or string name
 * representing a HTML Element (e.g. "div", "a", etc...), this value can be used
 * as first argument of React.createElement()
 * 
 * The type must support children
 */
export type ElementWithChildrenType = React.ComponentType<PropsWithChildren> | React.ExoticComponent<PropsWithChildren> | keyof Omit<JSX.IntrinsicElements, 'meta' | 'img' | 'video' | 'audio'>

/**
 * The properties type of an ElementType
 */
export type ElementProps<T extends ElementType> = T extends keyof JSX.IntrinsicElements ? React.HTMLProps<JSX.IntrinsicElements[T]> : React.ComponentProps<T>

/**
 * Tests if K is a property of T - if so: it is the type of
 * T[K]; if not: it is equal to never
 */
export type PropTypeIfPropExists<T extends ElementType, K> = K extends keyof ElementProps<T> ? ElementProps<T>[K] : never

/**
 * Tests if K is a property of T - if so: it is equal to U;
 * if not: it is equal to never
 */
export type TypeIfPropExists<T extends ElementType, K, U> = K extends keyof ElementProps<T> ? U : never

/**
 * Defines the type to be T or an array of T
 */
export type MayBeArray<T> = T | T[]

/**
 * The union of property names of an Element that may receive child elements
 */
export type ElementChildrenProps<T extends ElementType> = keyof { [P in keyof ElementProps<T> as React.ReactElement[] extends ElementProps<T>[P] ? P : never]: ElementProps<T>[P] }

export type GenericContextProps<T extends ElementType> = keyof { [P in keyof ElementProps<T> as GenericContext extends ElementProps<T>[P] ? P : never]: ElementProps<T>[P] }

/**
 * Reserved Element properties that may not be passed to CmsContentArea wrappers, as these are auto-injected
 */
export type ReservedKeys = "data-epi-edit" | "data-epi-property-name" | "data-epi-property-render" | "data-epi-property-edittype" | "data-epi-block-id" | "data-displayoption" | "data-tag" | "data-component"

export type WithAs<Base, CT extends ElementType> = Base & {
  as?: CT
  children?: PropTypeIfPropExists<CT, 'children'>
  key: PropTypeIfPropExists<CT, 'key'>
} & Omit<ElementProps<CT>, keyof Base>