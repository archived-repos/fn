/*
 * jstool-core - JS global object (fn) to define modules

 * The MIT License (MIT)
 * 
 * Copyright (c) 2014 Jesús Manuel Germade Castiñeiras <jesus@germade.es>
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 */
;(function () {
	'use strict';

	var _consoleLog = function (type, args) {
	        window.console[type].apply( window.console, args );
	    },
	    noop = function () {},
	    consoleLog = noop;

	var log = function() {
	        consoleLog('log', Array.prototype.slice.call(arguments));
	    };

	['info', 'warn', 'debug', 'error'].forEach(function (type) {
	    log[type] = (window.console !== undefined) ? function () {
	        consoleLog(type, Array.prototype.slice.call(arguments));
	    } : noop;
	});

	log.enable = function (enableLog) {
	    enableLog = (enableLog === undefined) ? true : enableLog;
	    if( enableLog ) {
	        consoleLog = (window.console !== undefined ) ? _consoleLog : noop;
	    } else {
	        consoleLog = noop;
	    }
	    log('log is enabled');
	};

	log.clear = function() {
	    log.history = [];
	    if (window.console) console.clear();
	};

	if( document.documentElement.getAttribute('data-log') === 'true' ) {
		log.enable();
	}

	window.log = log;

})();;/*	Copyright (c) 2014, Jesús Manuel Germade Castiñeiras <jesus@germade.es>
 * 
 *	Permission to use, copy, modify, and/or distribute this software for any purpose
 *	with or without fee is hereby granted, provided that the above copyright notice
 *	and this permission notice appear in all copies.
 * 
 *	THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *	REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
 *	FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT,
 *	OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE,
 *	DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS
 *	ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

(function () {
	'use strict';

	var _global = (typeof window === 'undefined' ? module.exports : window);

	var _ = {
		isFunction: function (fn) {
			return (fn instanceof Function);
		},
		isArray: function (list) {
			return (list instanceof Array);
		},
		isString: function (str) {
			return ( typeof str === 'string' );
		},
		isNumber: function (n) {
			return (n instanceof Number);
		},
		isObject: function(myVar,type){ if( myVar instanceof Object ) return ( type === 'any' ) ? true : ( typeof myVar === (type || 'object') ); else return false; },
		key: function(o,full_key,value){
    		if(! o instanceof Object) return false;
    		var key, keys = full_key.split('.'), in_keys = o || {};
    		if(value !== undefined) {
    			if(keys.length) {
    				key = keys.shift();
    				next_key = keys.shift();
    				while( next_key ) {
    					if( !o[key] ) o[key] = {};
    					o = o[key];
    					key = next_key;
    					next_key = keys.shift();
    				}
    				o[key] = value;
    			}
    			return value;
    		} else {
    			for(var k=0, len = keys.length;k<len;k++) {
    			    key = keys[k];
    			    if( key in in_keys ) in_keys = in_keys[keys[k]] || {};
    				else return false;
    			}
    			return in_keys;
    		}
    	},
    	keys: Object.keys,
    	globalize: function (varName, o) {
    		if( o ) {
    			_global[varName] = o;
    		} else if(varName) {
    			_global[varName] = definitions[varName];
    		} else {
    			for( varName in definitions ) {
    				_global[varName] = definitions[varName];
    			}
    		}
    	}
	};

	var definitions = { '_': _ },
		RE_FN_ARGS = /^function[^\(]\(([^\)]*)/,
		noop = function () {},
		fnListeners = {};

	/**
	 * @description
	 * fn function
	 *
	 * @param {fnName} function name
	 * @param {dependencies} array of dependencies ended by function defition
	 * @returns {Object} the Core
	 */
	function fn (deps, func, context) {
		if( _.isString(deps) ) {
			if( func === undefined ) {
				return definitions[deps];
			} else {
				return fn.define(deps, func, context);
			}
		} else {
			fn.run(deps, func, context);
		}
	}

	function onceFn (fnName, handler) {
		fnListeners[fnName] = fnListeners[fnName] || [];
		fnListeners[fnName].push(handler);
	}

	function triggerFn (fnName) {
		var definition = definitions[fnName];
		if( _.isArray(fnListeners[fnName]) ) {
			for( var i = 0, len = fnListeners[fnName].length; i < len; i++ ) {
				fnListeners[fnName][i](definition);
			}
		}
	}

	fn.waiting = {};

	fn.run = function (dependencies, f, context) {
		
		if( _.isArray(dependencies) ) {
			if( f === undefined ) {
				f = dependencies.pop();
			}
		} else if( _.isFunction(dependencies) ) {
			context = f;
			f = dependencies;
			dependencies = f.toString().match(RE_FN_ARGS)[1].split(',') || [];
		}

		if( f instanceof Function ) {
			fn.require(dependencies, f, context);
		}
	};

	function addDefinition (fnName, definition) {
		definitions[fnName] = definition;
		log.debug('fn defined: ', fnName);
		triggerFn(fnName);
		delete fn.waiting[fnName];
	}

	fn.define = function (fnName, dependencies, fnDef) {
		if( _.isString(fnName) ) {

			var args = [];

			if( _.isArray(dependencies) ) {
				if( fnDef === undefined ) {
					fnDef = dependencies.pop();
				}
			} else if( _.isFunction(dependencies) ) {
				fnDef = dependencies;
				dependencies = [];
				fnDef.toString().replace(RE_FN_ARGS, function(match, params) {
					params = params.replace(/\s/g,'');
					if( params ) {
						params.replace(/([^,]+),?/, function (match, param) {
							dependencies.push(param);
						});
					}
				});
			}

			fn.waiting[fnName] = dependencies;

			fn.require(dependencies, function () {
				var definition = fnDef.apply(definitions, arguments);
				if( definition && definition.then instanceof Function ) {
					definition.then(function (def) {
						setTimeout(function () {
							addDefinition(fnName, def);
						}, 0);
					});
				} else {
					addDefinition(fnName, definition);
				}
			});
		}
	};

	fn.require = function (dependencies, callback, context) {
		if( !_.isFunction(callback) ) return false;

		var runCallback = function () {
			for( var i = 0, len = dependencies.length, injections = []; i < len; i++ ) {
				if( dependencies[i] ) {
					injections.push(definitions[dependencies[i]]);
				}
			}
			callback.apply(context || definitions, injections);
		};

		runCallback.pending = 0;

		runCallback._try = function () {
			runCallback.pending--;
			if( !runCallback.pending ) {
				runCallback();
			}
		};

		runCallback._add = function (dependence) {
			if( !definitions[dependence] ) {
				runCallback.pending++;
				fn.defer(function () {
					if( definitions[dependence] ) {
						runCallback._try();
					} else {
						onceFn(dependence, runCallback._try);
					}
				});
			}
		};

		if( _.isString(dependencies) ) dependencies = [dependencies];

		if( _.isArray(dependencies) ) {

			if( dependencies.length ) {

				for( var i = 0, len = dependencies.length; i < len; i++ ) {
					if( dependencies[i] ) {
						runCallback._add(dependencies[i]);
					}
				}

				if( !runCallback.pending ) {
					runCallback();
				}

			} else runCallback();
		}
	};

	fn.when = function (fnName, callback) {
		if( _.isFunction(callback) ) {
			if( definitions[fnName] ) callback.apply(context, definitions[fnName]);
			else onceFn(fnName, function (definition) {
				callback.apply(context, definition);
			});
		}
	};

	fn.defer = function (f, time) {
		setTimeout(f, time || 0);
	};

	fn.globalize = _.globalize;

	fn.load = window.addEventListener ? function (listener) {
		window.addEventListener('load', listener, false);
	} : function (listener) {
		window.attachEvent('onload', listener );
	};

	fn.load(function () {
		var missingDependencies = {}, dependencies, key, i, len;

		for( key in fn.waiting ) {
			dependencies = fn.waiting[key];
			missingDependencies[key] = [];
			for( i = 0, len = dependencies.length; i < len; i++ ) {
				if( !definitions[dependencies[i]] ) {
					missingDependencies[key].push(dependencies[i]);
				}
			}
		}

		if( Object.keys(missingDependencies).length ) {
			console.group('missing dependencies');
			for( key in missingDependencies ) {
				log(key, missingDependencies[key]);
			}
			console.groupEnd();
		}
	});

	_.globalize('fn', fn);

	if( typeof jqlite !== 'undefined' ) {
		var $widget = function (widgetName, handler) {
			var dependencies = [];
			if( handler instanceof Array ) {
				dependencies = handler;
				handler = dependencies.pop();
			}

			handler.dependencies = dependencies;
			$widget.widgets[widgetName] = handler;

			if( !$widget.enabled ) {
				$widget.enabled = true;

				jqlite.plugin('[data-widget]', function () {
					var widgetName = this.getAttribute('data-widget'), _handler = $widget.widgets[widgetName];

					if( _handler ) {
						fn.run(_handler.dependencies, _handler, this);
					}
				});
			}
		};
		$widget.enabled = false;
		$widget.widgets = {};

		$widget.noConflict = $.widget;
		$.widget = $widget;
	}

})();
