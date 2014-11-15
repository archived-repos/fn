fn.define('promise', function (_) {
    
    var promise;

    if( window.Promise ) {
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

        // promise = function promise (async) {
        //     var deferred = $q.defer();
        //     async.call(this, deferred.resolve, deferred.reject);
        //     return deferred.promise;
        // }

        // promise.when = function (promise) {
        //     return $q.when.apply(this, arguments);
        // };

        // promise.defer = function () {
        //     return $q.defer();
        // };
    }

    return promise;
});