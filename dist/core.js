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
;(function (){
	'use strict';

	if (!Object.keys) {
	  Object.keys = function(obj) {
	    var keys = [];

	    for (var i in obj) {
	      if (obj.hasOwnProperty(i)) {
	        keys.push(i);
	      }
	    }

	    return keys;
	  };
	}

	// Add ECMA262-5 method binding if not supported natively
	//
	if (!('bind' in Function.prototype)) {
	    Function.prototype.bind= function(owner) {
	        var that= this;
	        if (arguments.length<=1) {
	            return function() {
	                return that.apply(owner, arguments);
	            };
	        } else {
	            var args= Array.prototype.slice.call(arguments, 1);
	            return function() {
	                return that.apply(owner, arguments.length===0? args : args.concat(Array.prototype.slice.call(arguments)));
	            };
	        }
	    };
	}

	// Add ECMA262-5 string trim if not supported natively
	//
	if (!('trim' in String.prototype)) {
	    String.prototype.trim= function() {
	        return this.replace(/^\s+/, '').replace(/\s+$/, '');
	    };
	}

	// Add ECMA262-5 Array methods if not supported natively
	//
	if (!('indexOf' in Array.prototype)) {
	    Array.prototype.indexOf= function(find, i /*opt*/) {
	        if (i===undefined) i= 0;
	        if (i<0) i+= this.length;
	        if (i<0) i= 0;
	        for (var n= this.length; i<n; i++)
	            if (i in this && this[i]===find)
	                return i;
	        return -1;
	    };
	}
	if (!('lastIndexOf' in Array.prototype)) {
	    Array.prototype.lastIndexOf= function(find, i /*opt*/) {
	        if (i===undefined) i= this.length-1;
	        if (i<0) i+= this.length;
	        if (i>this.length-1) i= this.length-1;
	        for (i++; i-->0;) /* i++ because from-argument is sadly inclusive */
	            if (i in this && this[i]===find)
	                return i;
	        return -1;
	    };
	}
	if (!('forEach' in Array.prototype)) {
	    Array.prototype.forEach= function(action, that /*opt*/) {
	        for (var i= 0, n= this.length; i<n; i++)
	            if (i in this)
	                action.call(that, this[i], i, this);
	    };
	}
	if (!('map' in Array.prototype)) {
	    Array.prototype.map= function(mapper, that /*opt*/) {
	        var other= new Array(this.length);
	        for (var i= 0, n= this.length; i<n; i++)
	            if (i in this)
	                other[i]= mapper.call(that, this[i], i, this);
	        return other;
	    };
	}
	if (!('filter' in Array.prototype)) {
	    Array.prototype.filter= function(filter, that /*opt*/) {
	        var other= [], v;
	        for (var i=0, n= this.length; i<n; i++)
	            if (i in this && filter.call(that, v= this[i], i, this))
	                other.push(v);
	        return other;
	    };
	}
	if (!('every' in Array.prototype)) {
	    Array.prototype.every= function(tester, that /*opt*/) {
	        for (var i= 0, n= this.length; i<n; i++)
	            if (i in this && !tester.call(that, this[i], i, this))
	                return false;
	        return true;
	    };
	}
	if (!('some' in Array.prototype)) {
	    Array.prototype.some= function(tester, that /*opt*/) {
	        for (var i= 0, n= this.length; i<n; i++)
	            if (i in this && tester.call(that, this[i], i, this))
	                return true;
	        return false;
	    };
	}
})();;(function () {
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

	if( window.enableLog ) {
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
    			(typeof window === 'undefined' ? module.exports : window)[varName] = o;
    		} else {
    			(typeof window === 'undefined' ? module.exports : window)[varName] = definitions[varName];
    		}
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
				log('fn defined: ', fnName);
				triggerFn(fnName);
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

	fn.globalize = _.globalize;

	_.globalize('fn', fn);

})();