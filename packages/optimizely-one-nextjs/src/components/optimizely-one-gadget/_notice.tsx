import {
  type ReactNode,
  type FunctionComponent,
  type PropsWithChildren,
} from 'react'
import { ArrowPathIcon } from '@heroicons/react/20/solid'

export const Notice: FunctionComponent<
  PropsWithChildren<{
    prefix?: string
    message?: string | ReactNode
    isLoading?: boolean
  }>
> = ({ prefix, message, isLoading = false, children }) => {
  const PrefixComponent = prefix && (
    <span className="oo:font-bold">{prefix}</span>
  )
  const Spinner = isLoading && (
    <ArrowPathIcon className="oo:inline-block oo:h-4 oo:w-4 oo:ml-2 oo:animate-spin" />
  )
  return (
    <p className="oo:text-[12px] oo:m-2 oo:mt-3 oo:p-1 oo:md:p-2 oo:rounded-md oo:bg-amber-200 oo:border oo:border-amber-800 oo:text-amber-800">
      {Spinner}
      {PrefixComponent}
      {message}
      {children}
    </p>
  )
}

export default Notice
