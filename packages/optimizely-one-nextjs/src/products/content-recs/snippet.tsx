import { InlineScript } from '../../components/inline-script.js'

/**
 * Configuration for the Content Recommendations tracking script.
 */
export type OptimizelyContentRecsProps = {
  /** Content Recommendations client ID. */
  client: string
  /** Content Recommendations delivery ID. */
  delivery: number
  /** Content Recommendations domain, without the `s.` prefix. */
  domain?: string
}

/**
 * Renders the Content Recommendations tracking snippet.
 *
 * @param props Content Recommendations client, delivery, and host settings.
 * @returns The Content Recommendations inline script.
 */
export const OptimizelyContentRecsTrackingScript = ({
  client: client_id,
  delivery: delivery_id,
  domain = 'idio.co'
}: OptimizelyContentRecsProps) => {

  return <InlineScript id='content-recs-script' html={`
    // Set client and delivery
    _iaq = [
        ['client', ${ JSON.stringify(client_id) }],
        ['delivery', ${ JSON.stringify(delivery_id) }]
    ];

    // Include Content Analytics
    !function(d,s){
        var ia=d.createElement(s);
        ia.async=1;
        ia.id='content-recs-snippet';
        ia.src='https://s.${ domain }/ia.js';
        s=d.getElementById('content-recs-script');
        s.parentNode.insertBefore(ia,s)
    }(document,'script');
`} />
}

export default OptimizelyContentRecsTrackingScript