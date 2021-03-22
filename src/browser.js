import { createMessager } from './messager/index'

let _postMessage = null

const isBrowser = typeof window !== 'undefined'

const { bind, define, listener, ready, fn, addEventListener, removeEventListener, isConnect } = createMessager(
    data => isBrowser && _postMessage && _postMessage(JSON.stringify(data))
)

if (isBrowser) {

    // react-native
    let originalPostMessage = window.originalPostMessage

    if (originalPostMessage) {
        _postMessage = (...args) => window.postMessage(...args)
        ready()
    } else {
        const descriptor = {
            get: function () {
                return originalPostMessage
            },
            set: function (value) {
                originalPostMessage = value
                if (originalPostMessage) {
                    _postMessage = (...args) => window.postMessage(...args)
                    setTimeout(ready, 50)
                }
            }
        }
        Object.defineProperty(window, 'originalPostMessage', descriptor)
    }

    // react-native-webview
    let ReactNativeWebView = window.ReactNativeWebView

    if (ReactNativeWebView) {
        _postMessage = (...args) => window.ReactNativeWebView.postMessage(...args)
        ready()
    } else {
        const descriptor = {
            get: function () {
                return ReactNativeWebView
            },
            set: function (value) {
                ReactNativeWebView = value
                if (ReactNativeWebView) {
                    _postMessage = (...args) => window.ReactNativeWebView.postMessage(...args)
                    setTimeout(ready, 50)
                }
            }
        }
        Object.defineProperty(window, 'ReactNativeWebView', descriptor)
    }

    // onMessage react native
    window.document.addEventListener('message', e => originalPostMessage && listener(JSON.parse(e.data)))
    // onMessage react-native-webview
    window.addEventListener('message', e => ReactNativeWebView && listener(JSON.parse(e.data)))
    // onMessage react-native-webview  with android
    window.document.addEventListener('message', e => ReactNativeWebView && listener(JSON.parse(e.data)));
    // onMessage flutter_inappwebview
    window.addEventListener('flutterInAppWebViewPlatformReady', function(e) {
        // flutter_inappwebview
        _postMessage = function(...args) {
            let payload = args[0];
            let data = JSON.parse(payload).data;
            window.flutter_inappwebview.callHandler(data.type, JSON.stringify(data)).then((result) => {
                data.data = result;
                data.status = STATUS_SUCCESS;
                listener(data);
            }).catch((err) => {
                data.data = err;
                data.status = STATUS_FAIL;
                listener(data);
            });
        }
    });
}

export default {
    bind, define, fn, addEventListener, removeEventListener, isConnect
}
