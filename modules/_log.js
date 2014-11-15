(function () {
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

})();