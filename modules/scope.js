fn.define('Scope', function () {
    function Scope (scp) {
        for( var key in scp ) {
            this[key] = scp[key];
        }
    }

    function newScope (scp) {
        function S (scp) {
            for( var key in scp ) {
                this[key] = scp[key];
            }
        }
        S.prototype = this;
        for( var key in Scope.prototype ) {
            S.prototype[key] = Scope.prototype[key];
        }
        return new S(scp);
    }

    Scope.prototype.$new = newScope;

    return Scope;
});