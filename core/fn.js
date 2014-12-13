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
    		var keys = full_key.split('.'), in_keys = o || {};
    		if(value !== undefined) {
    			if(keys.length) {
    				var key = keys.shift(), next_key;
    				while( next_key = keys.shift() ) {
    					if( !o[key] ) o[key] = {};
    					o = o[key];
    					key = next_key;
    				}
    				o[key] = value;
    			}
    			return value;
    		} else {
    		    var key;
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
    			for( var varName in definitions ) {
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
	function fn (f, dependencies) {
		if( dependencies ) {
			fn.define(f, dependencies);
		} else if( _.isArray(f) ) {
			return definitions[f];
		} else if( _.isString(f) ) {
			return definitions[f];
		} else {
			fn.run(f);
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

	fn.run = function (dependencies) {
		var f;

		if( _.isArray(dependencies) ) {
			f = dependencies.pop();
		} else if( _.isFunction(dependencies) ) {
			f = dependencies;
			dependencies = f.toString().match(RE_FN_ARGS)[1].split(',') || [];
		}

		if( f instanceof Function ) {
			fn.require(dependencies, f);
		}
	};

	fn.define = function (fnName, dependencies) {
		if( _.isString(fnName) ) {

			var fnDef, args = [];

			if( _.isArray(dependencies) ) {
				fnDef = dependencies.pop();
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

			fn.require(dependencies, function () {
				definitions[fnName] = fnDef.apply(definitions, arguments);
				log('fn defined: ', fnName);
				triggerFn(fnName);
			});
		}
	};

	fn.require = function (dependencies, callback) {
		if( !_.isFunction(callback) ) return false;

		var runCallback = function () {
			for( var i = 0, len = dependencies.length, injections = []; i < len; i++ ) {
				dependencies[i] && injections.push(definitions[dependencies[i]]);
			}
			callback.apply(definitions, injections);
		};

		if( _.isString(dependencies) ) dependencies = [dependencies];

		if( _.isArray(dependencies) ) {

			if( dependencies.length ) {

				for( var i = 0, len = dependencies.length, pending = 0; i < len; i++ ) {
					if( dependencies[i] && !definitions[dependencies[i]] ) {
						pending++;
						fn.defer(function () {
							fn.when(dependencies[i], function () {
								pending--;
								!pending && runCallback();
							})
						});
					}
				}

				!pending && runCallback();

			} else runCallback();
		}
	};

	fn.when = function (fnName, callback) {
		if( _.isFunction(callback) ) {
			if( definitions[fnName] ) callback.apply(context, definition);
			else onceFn(fnName, function () {
				callback.apply(context, definition);
			});
		}
	};

	fn.defer = function (f, time) {
		_.isFunction(f) && setTimeout(f, time || 0);
	};

	fn.globalize = _.globalize;

	_.globalize('fn', fn);

})();