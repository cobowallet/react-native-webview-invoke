import { createMessager } from './messager/index'

let _postMessage = null;
let _postFlutterMessage = null;

const isBrowser = typeof window !== 'undefined'

const { bind, define, listener, ready, fn, addEventListener, removeEventListener, isConnect } = createMessager(
    function(data) {
        if (isBrowser) {
            if(_postMessage) {
                _postMessage(JSON.stringify(data));
            }
            if(_postFlutterMessage) {
                _postFlutterMessage(data);
            }
        }
    }
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
    // flutter_inappwebview
    window.addEventListener('flutterInAppWebViewPlatformReady', function(e) {
        if(!_postFlutterMessage) {
            _postFlutterMessage = function(data) {
                if (!!data.data  &&
                    Object.prototype.toString.call(data.data)=='[object Array]' &&
                    typeof data.data[0] === 'object' &&
                    Object.prototype.hasOwnProperty.call(data.data[0], 'type')
                ) {
                    let handlerName = data.data[0].type;
                    let params = JSON.stringify(data.data[0]);
                    data.reply = true;
                    window.flutter_inappwebview.callHandler(handlerName, params).then((result) => {
                        data.data = !!result ? result : '';
                        data.status = 'success';
                        listener(data);
                    }).catch((err) => {
                        data.data = '';
                        data.status = 'fail';
                        listener(data);
                    });
                } else {
                    listener(data);
                }
            };
            ready();
        }
    });
}

export default {
    bind, define, fn, addEventListener, removeEventListener, isConnect
}
