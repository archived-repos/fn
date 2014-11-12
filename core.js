'use strict';


(function () {

	var _ = new (function _ () {

		this.isFunction = function (fn) {
			return (fn instanceof Function);
		};

		this.isArray = function (list) {
			return (list instanceof Array);
		};

		this.isString = function (str) {
			return ( typeof str === 'string' );
		};

	})();

	var Events = (function () {

		function _addListener (handlers, handler, context) {
            if( ! _.isFunction(handler) ) {
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
        };

        return Events;
    })();

	var definitions = {
			'Events': Events
		},
		RE_FN_ARGS = /^function[^\(]\((.*)[^\)]/,
		noop = function () {},
		tryDone = function (waitFor, callback) {
			if( !Object.keys(waitFor).length && _.isFunction(callback) ) {
				callback();
				return true;
			}
			return false;
		};

	function fn (fnName, dependencies) {
		if( dependencies ) {
			fn.define(fnName, dependencies);
		}
		return definitions[fnName];
	};

	new Events(fn);

	fn.run = function (dependencies) {
		var callback;

		if( _.isArray(dependencies) ) {
			callback = dependencies.pop();
		} else if( _.isFunction(dependencies) ) {
			callback = dependencies;
			dependencies = callback.toString().match(RE_FN_ARGS)[1].split(',');
		}

		fn.require(dependencies, function () {
			callback.apply(definitions, this.injections);
		});
	};

	fn.define = function (fnName, dependencies) {
		if( _.isString(fnName) ) {

			var fnDef, args = [];

			if( _.isArray(dependencies) ) {
				fnDef = dependencies.pop();
			} else if( _.isFunction(dependencies) ) {
				fnDef = dependencies;
				dependencies = fnDef.toString().match(RE_FN_ARGS)[1].split(',');
			}

			fn.require(dependencies, function () {
				definitions[fnName] = fnDef.apply(definitions, this.injections);
				fn.trigger(fnName);
			});
		}
	};

	fn.require = function (dependencies, callback) {
		if( !_.isFunction(callback) ) return false;

		var runCallback = function () {
			var injections = [];
			for( var i = 0, len = dependencies.length; i < len; i++ ) {
				injections.push(definitions[dependencies[i]]);
			}
			callback.call({ injections: injections });
		};

		if( _.isArray(dependencies) ) {

			if( dependencies.length ) {
				var waitFor = {};

				for( var i = 0, len = dependencies.length; i < len; i++ ) {
					if( !definitions[dependencies[i]] ) {
						waitFor[dependencies[i]] = true;
					}
				}

				if( !tryDone(waitFor, runCallback) ) {
					dependencies.forEach(function (dependence) {
						fn.when(dependence, function () {
							delete waitFor[dependence];
							tryDone(waitFor, runCallback);
						});
					});
				}

			} else runCallback();
		} else if( _.isString(dependencies) ) {
			fn.when(dependencies, runCallback);
		}
	};

	fn.when = function (fnName, callback) {
		if( _.isFunction(callback) ) {
			if( definitions[fnName] ) callback();
			else fn.once(fnName, callback);
		}
	};

	fn.defer = function (f) {
		if( _.isFunction(f) ) {
			setTimeout(f, 0);
		}	
	};

	window.fn = fn;

})();