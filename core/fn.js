
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
						definitions[fnName] = def;
						log('fn defined: ', fnName);
						triggerFn(fnName);
						delete fn.waiting[fnName];
					});
				} else {
					definitions[fnName] = definition;
					log('fn defined: ', fnName);
					triggerFn(fnName);
					delete fn.waiting[fnName];
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

	_.globalize('fn', fn);

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

})();
