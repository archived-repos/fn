
fn.define('localData', ['Events', function (Events) {
    'use strict';

    if ( typeof window === 'undefined' || !window.localStorage ) {
        throw 'localStorage not defined';
    }

    var localData = function (key, data, meta) {
        if( data !== undefined ) {
            localData.setItem(key, data, meta);
            return this;
        } else {
            return localData.getItem(key);
        }
    }, loopback = {};

    new Events(localData);

    localData.setItem = function (key, data, meta){
        var newValue = { data: data },
            oldValue = localStorage.getItem(key) ? ( JSON.parse(localStorage.getItem(key)) || {} ) : {};

        angular.extend( newValue, meta || {} );

        localStorage.setItem( key, JSON.stringify(newValue) );

        if( loopback[key] ) {
            localData._trigger(key, newValue, oldValue);
        }

        return newValue;
    };

    localData.getItem = function (key) {
        return (JSON.parse(localStorage.getItem(key)) || {}).data;
    };

    localData.getMeta = function (key, metaKey) {
        if( metaKey === undefined ) {
            return (JSON.parse(localStorage.getItem(key)) || {});
        } else {
            return (JSON.parse(localStorage.getItem(key)) || {})[metaKey];
        }
    };

    localData.loopback = function (key, value) {
        loopback[key] = ( value === undefined || value );
    };

    localData._trigger = function (key, newValue, oldValue) {
        localData.trigger(key, { url: location.href, newValueFull: newValue, oldValueFull: oldValue  });
    };

    window.addEventListener('storage', function (e) {
        e = e.originalEvent;
        if( /^{.*}$/.test(e.newValue) ) {
            localData._trigger( e.key, JSON.parse(e.newValue) || {}, JSON.parse(e.oldValue) || {} );
        }
    }, false);

    return localData;
}]);