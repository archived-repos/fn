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
    	global: function (varName, o) {
    		(typeof window === 'undefined' ? module.exports : window)[varName] = o;
    	}
	};

	var definitions = { '_': _ },
		RE_FN_ARGS = /^function[^\(]\(([^\)]*)/,
		noop = function () {},
		tryDone = function (waitFor, callback) {
			if( !Object.keys(waitFor).length && _.isFunction(callback) ) {
				callback();
				return true;
			}
			return false;
		},
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
		if( _.isArray(fnListeners[fnName]) ) {
			for( var i = 0, len = fnListeners[fnName].length; i < len; i++ ) {
				fnListeners[fnName][i]();
			}
		}
	}

	fn.run = function (dependencies) {
		var f;

		if( _.isArray(dependencies) ) {
			f = dependencies.pop();
		} else if( _.isFunction(dependencies) ) {
			f = dependencies;
			dependencies = f.toString().match(RE_FN_ARGS)[1].split(',');
		}

		if( f instanceof Function ) {
			fn.require(dependencies, function () {
				f.apply(definitions, this.injections);
			});
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
				// dependencies = fnDef.toString().replace(/\s/g,'').match(RE_FN_ARGS)[1].split(',');
			}

			// log('fn.define', fnName, fnDef, dependencies);
			fn.require(dependencies, function () {
				definitions[fnName] = fnDef.apply(definitions, this.injections);
				triggerFn(fnName);
				log('fn defined: ', fnName);
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
			else onceFn(fnName, callback);
		}
	};

	fn.defer = function (f) {
		if( _.isFunction(f) ) {
			setTimeout(f, 0);
		}	
	};

	_.global('fn', fn);

})();