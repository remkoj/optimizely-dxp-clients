import { InlineScript } from '../../components/inline-script.js'

/**
 * Configuration for the Data Platform tracking script.
 */
export type OptimizelyDataPlatformProps = {
  /** Public or private Data Platform tracker ID. */
  trackerId: string
}

/**
 * Renders the Data Platform bootstrap script when a tracker ID is configured.
 *
 * @param props Data Platform tracker configuration.
 * @returns The tracking script and API resource hint, or `null` for an invalid ID.
 */
export const OptimizelyDataPlatformScript = (props: OptimizelyDataPlatformProps) => {
  const odp_id = props.trackerId.split('.').shift() ?? ''
  if (odp_id == '')
    return null
  return <>
    <InlineScript id='data-platform-script' html={`
    var zaius = window['zaius'] || (window['zaius'] = []);
    zaius.methods = ['initialize', 'onload', 'customer', 'entity', 'event', 'subscribe', 'unsubscribe', 'consent', 'identify', 'anonymize', 'dispatch'];

    // build queueing methods
    zaius.factory = function (method) {
        return function() {
            var args = Array.prototype.slice.call(arguments);
            args.unshift(method);
            zaius.push(args);
            return zaius;
        };
    };

    (function() 
    {
        for (var i = 0; i < zaius.methods.length; i++) {
            var method = zaius.methods[i];
            zaius[method] = zaius.factory(method);
        }

        var script   = document.createElement('script');
        script.type  = 'text/javascript';
        script.async = true;
        script.src   = 'https://d1igp3oop3iho5.cloudfront.net/v2/${ odp_id }/zaius.js';
        var firstScript = document.getElementsByTagName('script')[0];
        firstScript.parentNode.insertBefore(script, firstScript);
    })();
`} />
  </>
}

export default OptimizelyDataPlatformScript
