import { type ReactNode, type FunctionComponent, type PropsWithChildren } from "react";
import { ArrowPathIcon } from '@heroicons/react/20/solid'

export const Notice : FunctionComponent<PropsWithChildren<{
    prefix?: string
    message?: string | ReactNode
    isLoading?: boolean
}>> = ({
    prefix,
    message,
    isLoading = false,
    children
}) => 
{
    const PrefixComponent = prefix && <span className='oo-notice-prefix'>{ prefix }</span>
    const Spinner = isLoading && <ArrowPathIcon className='oo-notice-spinner' />
    return <p className='oo-notice'>
        { Spinner }
        { PrefixComponent }
        { message }
        { children }
    </p>
}

export default Notice