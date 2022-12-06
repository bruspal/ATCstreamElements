class SE_Utils {
    instanceName = '';
    constructor(instanceName) {
        this.instanceName = instanceName || 'ATC_Probe';
    }
    /*
    Send a message (HACK de SE_API.store.set)
    */
    sendMessage(message, data, options) {
        if (debugMode) debugger;
        options = options || {};
        data = data || {};
        message = this.instanceName + '_' + message;
        let objMessage = {
            timestamp: Date.now(),
            payload: data,
            'options': options
        };
        console.log('custom-message-sending:' + message, objMessage);
        SE_API.store.set(message, objMessage).then(() => {
            console.log('custom-message-sent:' + message, objMessage);
        });
    }

    /*
    Attach a callback to a message sent via
    USAGE : receiveMessage('message', (payload, options) => {
        ...
    });
    */
    receiveMessage(message, callback) {
        window.addEventListener('onEventReceived', function (obj) {
            const listener = obj.detail.listener;
            if (listener == 'kvstore:update') {
                const messageName = obj.detail.event.data.key;
                let messageStr = instanceName + '_' + message;
                if (('customWidget.' + messageStr) == messageName) {
                    SE_API.store.get(messageStr).then((ret) => {
                        if (ret === null) {
                            // quedalle
                        } else {
                            callback(ret.payload, ret.options);
                        }
                    });
                }
            }
        });
    }

    log(message, callback) {
        if (typeof callback === 'function' ) {
            callback(message);
        } else {
            console.log(`ATC_Probe ${this.instanceName} : `, message);
        }
    }
}

