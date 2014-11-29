fn.define('promise', [ '_', function (_) {

    if( typeof global === 'undefined' ) {
        var global = window;
    }
    
    var promise;

    if( global.Promise ) {
        promise = function promise (async) {
            return new Promise(async);
        }

        promise.when = function (promise) {
            return new Promise(function (resolve, reject) {
                if( promise ) {
                    if( typeof promise.then === 'function' ) {
                        promise.then(resolve, reject);
                    } else {
                        setTimeout(function () {
                            resolve(promise);
                        }, 0);
                    }
                } else {
                    setTimeout(function () {
                        reject(promise);
                    }, 0);
                }
            });
        };

        promise.defer = function () {
            var deferred, promise = new Promise(function (resolve, reject) {
                deferred = {
                    resolve: resolve,
                    reject: reject
                };
            });
            deferred.promise = promise;
            return deferred;
        };

    } else {

    	throw 'Promise not implemented, fallback needed';

        // Think about https://github.com/jakearchibald/es6-promise#nodejs
    }

    return promise;
}]);