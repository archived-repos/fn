fn.define('widgets', function ($) {
    var jDoc = $(document),
        plugins = {},
        pluginSets = {};

    function htmlPlugin (pluginName, plugin, isCollection) {
        if( typeof pluginName === 'string' && plugin instanceof Function ) {
            if( isCollection ) {
                pluginSets[pluginName] = plugin;
                if( jDoc.isReady ) {
                    plugin.call(jDoc, jDoc.find(pluginName));
                }
            } else {
                plugins[pluginName] = plugin;
                if( jDoc.isReady ) {
                    jDoc.find(pluginName).each(plugin);
                }
            }
        }
    }

    jDoc.ready(function () {
        htmlPlugin.init = function (jElement) {
            if( !jElement ) {
                return false;
            } else if( !jElement.jquery ) {
                jElement = $(jElement);
            }

            if( jElement.jquery ) {
                var plugin, pluginList = plugins;
                for( var pluginKeys = Object.keys(pluginList), i = 0, len = pluginKeys.length; i < len; i++ ) {
                    plugin = pluginList[pluginKeys[i]];
                    jElement.find(pluginKeys[i]).each(plugin);
                }

                pluginList = pluginSets;
                for( var pluginKeys = Object.keys(pluginList), i = 0, len = pluginKeys.length; i < len; i++ ) {
                    pluginList[pluginKeys[i]].call(jElement, jElement.find(pluginKeys[i]));
                }
            }
        };

        jDoc.isReady = true;
        htmlPlugin.init(jDoc);
    });

    return htmlPlugin;
});