(function (root) {

	var fn = (function (module) {
		${src}
		return module.exports;
	})({});

	root.fn = fn;
	root.define = fn.define;
	root.require = fn.require;

})(this);
