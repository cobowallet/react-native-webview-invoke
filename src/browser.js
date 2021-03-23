import { createMessager } from './messager/index'

let _postMessage = null;
let _postFlutterMessage = null;
let _flutterReady = false;

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

    // flutter_inappwebview
    let flutter_inappwebview = window.flutter_inappwebview;

    if (flutter_inappwebview) {
        _postFlutterMessage = function(data) {
            if(!_flutterReady) {
                return;
            }
            window.flutter_inappwebview.callHandler(data.data.type, JSON.stringify(data.data)).then((result) => {
                data.data = result;
                data.status = STATUS_SUCCESS;
                listener(data);
            }).catch((err) => {
                data.data = err;
                data.status = STATUS_FAIL;
                listener(data);
            });
        }
        ready();
    } else {
        const descriptor = {
            get: function () {
                return flutter_inappwebview;
            },
            set: function (value) {
                flutter_inappwebview = value;
                if (flutter_inappwebview) {
                    _postFlutterMessage = function(data) {
                        if(!_flutterReady) {
                            return;
                        }
                        window.flutter_inappwebview.callHandler(data.data.type, JSON.stringify(data.data)).then((result) => {
                            data.data = result;
                            data.status = STATUS_SUCCESS;
                            listener(data);
                        }).catch((err) => {
                            data.data = err;
                            data.status = STATUS_FAIL;
                            listener(data);
                        });
                    }
                    setTimeout(ready, 50);
                }
            }
        }
        Object.defineProperty(window, 'flutter_inappwebview', descriptor);
    }

    // onMessage react native
    window.document.addEventListener('message', e => originalPostMessage && listener(JSON.parse(e.data)))
    // onMessage react-native-webview
    window.addEventListener('message', e => ReactNativeWebView && listener(JSON.parse(e.data)))
    // onMessage react-native-webview  with android
    window.document.addEventListener('message', e => ReactNativeWebView && listener(JSON.parse(e.data)));
    // flutter_inappwebview
    window.addEventListener('flutterInAppWebViewPlatformReady', function(e) {
        _flutterReady = true;
        if(!_postFlutterMessage) {
            _postFlutterMessage = function(data) {
                if(!_flutterReady) {
                    return;
                }
                window.flutter_inappwebview.callHandler(data.data.type, JSON.stringify(data.data)).then((result) => {
                    data.data = result;
                    data.status = STATUS_SUCCESS;
                    listener(data);
                }).catch((err) => {
                    data.data = err;
                    data.status = STATUS_FAIL;
                    listener(data);
                });
            }
            ready();
        }
    });
}

export default {
    bind, define, fn, addEventListener, removeEventListener, isConnect
}
