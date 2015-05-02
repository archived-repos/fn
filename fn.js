
/*	Copyright (c) 2014, Jesús Manuel Germade Castiñeiras <jesus@germade.es>
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

	function _instanceof (prototype) {
    	return function (o) {
    		return o instanceof prototype;
    	};
    }

    function isString (o) {
    	return typeof o === 'string';
    }
    var isFunction = _instanceof(Function),
    	isArray = _instanceof(Array),
    	isObject = _instanceof(Object);

	function globalize (varName, o) {
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

	var definitions = {},
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
		if( isString(deps) ) {
			if( func === undefined ) {
				return definitions[deps];
			} else {
				return fn.define(deps, func, context);
			}
		} else {
			fn.run(deps, func, context);
		}
		return fn;
	}

	function onceFn (fnName, handler) {
		fnListeners[fnName] = fnListeners[fnName] || [];
		fnListeners[fnName].push(handler);
	}

	function triggerFn (fnName) {
		var definition = definitions[fnName];
		if( isArray(fnListeners[fnName]) ) {
			for( var i = 0, len = fnListeners[fnName].length; i < len; i++ ) {
				fnListeners[fnName][i](definition);
			}
		}
	}

	fn.waiting = {};

	fn.run = function (dependencies, f, context) {

		if( isArray(dependencies) ) {
			if( f === undefined ) {
				f = dependencies.pop();
			}
		} else if( isFunction(dependencies) ) {
			context = f;
			f = dependencies;
			dependencies = f.toString().match(RE_FN_ARGS)[1].split(',') || [];
		}

		if( f instanceof Function ) {
			fn.require(dependencies, f, context);
		}

		return fn;
	};

	function addDefinition (fnName, definition) {
		definitions[fnName] = definition;
		console.debug('fn defined: ', fnName);
		triggerFn(fnName);
		delete fn.waiting[fnName];
	}

	fn.define = function (fnName, dependencies, fnDef) {
		if( isString(fnName) ) {

			var args = [];

			if( isArray(dependencies) ) {
				if( fnDef === undefined ) {
					fnDef = dependencies.pop();
				}
			} else if( isFunction(dependencies) ) {
				fnDef = dependencies;
				dependencies = [];
				fnDef.toString().replace(RE_FN_ARGS, function(match, params) {
					params = params.replace(/\s/g,'');
					if( params ) {
						[].push.apply(dependencies, params.split(','));
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

		return fn;
	};

	fn.require = function (dependencies, callback, context) {
		if( !isFunction(callback) ) {
			return false;
		}

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

		if( isString(dependencies) ) {
			dependencies = [dependencies];
		}

		if( isArray(dependencies) ) {

			if( dependencies.length ) {

				for( var i = 0, len = dependencies.length; i < len; i++ ) {
					if( dependencies[i] ) {
						runCallback._add(dependencies[i]);
					}
				}

				if( !runCallback.pending ) {
					runCallback();
				}

			} else {
				runCallback();
			}
		}

		return fn;
	};

	fn.when = function (fnName, callback, context) {
		if( isFunction(callback) ) {
			if( definitions[fnName] ) {
				callback.apply(context, definitions[fnName]);
			} else {
				onceFn(fnName, function (definition) {
					callback.apply(context, definition);
				});
			}
		}

		return fn;
	};

	fn.defer = function (f, time) {
		setTimeout(f, time || 0);

		return fn;
	};

	fn.globalize = globalize;

	globalize('fn', fn);

	if( !_global.define ) {
		_global.define = fn.define;
	}

	if( !_global.require ) {
		_global.require = fn.require;
	}

	if( typeof window !== 'undefined' ) {
		fn.load = window.addEventListener ? function (listener) {
			window.addEventListener('load', listener, false);
			return fn;
		} : function (listener) {
			window.attachEvent('onload', listener );
			return fn;
		};
	}


	fn.ready = function (callback) {
		if( callback instanceof Function ) {
			if (/loaded|complete/.test(document.readyState)) {
		    callback();
		  } else {
				fn.load(callback);
			}
		}
		return fn;
	};

	fn.ready(function () {
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
				console.log(key, missingDependencies[key]);
			}
			console.groupEnd();
		}
	});

})();
