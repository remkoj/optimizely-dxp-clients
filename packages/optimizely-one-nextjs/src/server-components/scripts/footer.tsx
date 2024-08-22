import 'server-only'
import EnvTools from '../../utils/env'
import EnvVars from '../../env-vars'
import CRecsScript from '../../products/content-recs/snippet'

export type FooterScriptsProps = {
    contentRecsClient?: string
    contentRecsDelivery?: number
    contentRecsDomain?: string
}

export default function (props: FooterScriptsProps)
{
    const crecs_client = props.contentRecsClient ||EnvTools.readValue(EnvVars.ContentRecsClient, '')
    const crecs_delivery = props.contentRecsDelivery || EnvTools.readValueAsInt(EnvVars.ContentRecsDelivery, 0)
    const crecs_domain = props.contentRecsDomain || EnvTools.readValue(EnvVars.ContentRecsHost, 'idio.co')
    return <>
        { crecs_client && crecs_delivery && <CRecsScript client={ crecs_client } delivery={ crecs_delivery } domain={ crecs_domain } /> }
    </>
}