fn.define('ajax', function(promise) {
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
	        
	        if( isObject(args.headers) ) {
	            _.keys(args.headers).forEach(function(header){
	                xhr.setRequestHeader(header,args.headers[header]);
	            });
	        }
	        
	        xhr.send(args.data);
		});

		xhr.done = xhr.promise.then;
		xhr.fail = xhr.promise.catch;
		xhr.always = xhr.promise.finally;

		return xhr;
    }

    return ajax;
});