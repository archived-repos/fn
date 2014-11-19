fn.define('ajax', ['promise', function (promise) {
	'use strict';

	function ajax(url,args){

        if( !args ) args = ( url instanceof Object ) ? url : {};
        if( args.url ) url = args.url;
        if( !url ) return false;
        
        if( !args.method ) args.method = 'GET';
        
        if( !args.contentType ) {
            if( /^json$/i.test(args.mode) ) args.contentType = 'application/json';
            else args.contentType = 'application/x-www-form-urlencoded';
        }
        
        if( /^json$/i.test(args.mode) && isObject(args.data) ) args.data = JSON.stringify(args.data);
        
        var xhr = null;
        try	{ // Firefox, Opera 8.0+, Safari
            xhr = new XMLHttpRequest();
        } catch (e) { // Internet Explorer
            try { xhr = new ActiveXObject("Msxml2.XMLHTTP"); }
            catch (e) { xhr = new ActiveXObject("Microsoft.XMLHTTP"); }
        }
        if (xhr===null) { throw "Browser does not support HTTP Request"; }
	        
		xhr.promise = promise(function (resolve, reject) {


	        xhr.open(args.method,url,(args.async === undefined) ? true : args.async);
	        xhr.onreadystatechange=function(){
	            if( xhr.readyState == 'complete' || xhr.readyState == 4 ) {
	                if( xhr.status >= 200 && xhr.status <300 ) {
	                	var data = /^json$/i.test(args.mode) ? JSON.parse(xhr.responseText) : ( /^xml$/i.test(args.mode) ? xhr.responseXML : xhr.responseText );
	                	resolve(data, xhr.status, xhr);
	                } else {
	                    var data = /^json$/i.test(args.mode) ? JSON.parse(xhr.responseText) : ( /^xml$/i.test(args.mode) ? xhr.responseXML : xhr.responseText );
	                    reject(data, xhr.status, xhr);
	                }
	            }
	        }
	        
	        xhr.setRequestHeader('Content-Type',args.contentType);
	        xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
	        
	        if( args.headers ) {
	        	for( var header in args.headers ) {
	                xhr.setRequestHeader(header,args.headers[header]);
	        	}
	        }
	        
	        xhr.send(args.data);
		});

		// xhr.done = function (callback) { xhr.promise.then(callback); return xhr; };
		// xhr.fail = function (callback) { xhr.promise.catch(callback); return xhr; };
		// xhr.always = function (callback) { xhr.promise.finally(callback); return xhr; };

		return xhr.promise;
    }

    return ajax;
}]);