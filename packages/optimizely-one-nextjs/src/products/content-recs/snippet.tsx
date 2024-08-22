/* eslint @next/next/no-before-interactive-script-outside-document: 0 */
import Script from 'next/script'

export type OptimizelyContentRecsProps = {
    client: string
    delivery: number
    domain?: string
}

export const OptimizelyContentRecsTrackingScript = ({
    client: client_id,
    delivery: delivery_id,
    domain = 'idio.co'
}: OptimizelyContentRecsProps) => {

    return <Script id='content-recs-script' strategy='beforeInteractive'>{`
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
        ia.src='//s.${ domain }/ia.js';
        s=d.getElementById('content-recs-script');
        s.parentNode.insertBefore(ia,s)
    }(document,'script');
`}
</Script>
}

export default OptimizelyContentRecsTrackingScript