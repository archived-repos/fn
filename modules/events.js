fn.define('Events', function () {
	'use strict';

	function _addListener (handlers, handler, context) {
        if( ! handler instanceof Function ) {
            return false;
        }
        handlers.push({ handler: handler, context: context });
    }

    function _triggerEvent (handlers, data, caller) {
        if( handlers ) {
            for( var i = 0, len = handlers.length; i < len; i++ ) {
                handlers[i].handler.call(caller, data);
            }
            return len;
        }
    }

    function _emptyListener (handlers) {
        if( handlers ) {
            handlers.splice(0, handlers.length);
        }
    }

    function _removeListener (handlers, handler) {
        if( handlers ) {
            for( var i = 0, len = handlers.length; i < len; ) {
                if( handlers[i].handler === handler ) {
                    handlers.splice(i, 1);
                    len--;
                } else {
                    i++;
                }
            }
        }
    }

    function Events (target) {
        target = target || this;
        var listeners = {};
        var listenersOnce = {};

        target.on = function (eventName, handler, context) {
            listeners[eventName] = listeners[eventName] || [];
            _addListener(listeners[eventName], handler, context);
        };

        target.once = function (eventName, handler, context) {
            listenersOnce[eventName] = listenersOnce[eventName] || [];
            _addListener(listenersOnce[eventName], handler, context);
        };

        target.trigger = function (eventName, data, caller) {
            _triggerEvent(listeners[eventName], data, caller);

            var len = _triggerEvent(listenersOnce[eventName], data, caller);
            if( len ) {
                listenersOnce[eventName].splice(0, len);
            }
        };

        target.off = function (eventName, handler) {
            if( handler === undefined ) {
                _emptyListener(listeners[eventName]);
                _emptyListener(listenersOnce[eventName]);
            } else {
                _removeListener(listeners[eventName], handler);
                _removeListener(listenersOnce[eventName], handler);
            }
        };
    }

    return Events;
});