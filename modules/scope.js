fn.define('Scope', function () {
    function Scope (scp) {
        for( key in scp ) {
            this[key] = scp[key];
        }
    }

    function newScope (scp) {
        function S (scp) {
            for( key in scp ) {
                this[key] = scp[key];
            }
        }
        S.prototype = this;
        S.prototype.$new = newScope;
        return new S(scp);
    }

    Scope.prototype.$new = newScope;

    return Scope;
});