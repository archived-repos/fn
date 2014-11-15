fn.define('parse', function(_){
    
    var cmd = {},
        splitRex = /\$[\w\?]*{[^\}]+}|{\$}|{\:}/,
        matchRex = /(\$([\w\?]*){([^\}]+)})|({\$})|({\:})/g,
        emptyModel = function (){ this._parent = this };
	
	function $parse(tmpl){
        var texts = tmpl.split(splitRex),
            list = [texts.shift()];
            
        tmpl.replace(matchRex,function(match,match2,cmd,arg,closer,colon){
            list.push( closer ? { cmd: '', arg: '/' } : ( colon ? { cmd: '', arg: 'else' } : { cmd: cmd, arg: arg } ) );
            list.push(texts.shift());
        });
        
        return parseTokens('root',false,list);
    }
    
    $parse.cmd = function(cmd_name,handler){
    	if( _.isString(cmd_name) && _.isFunction(handler) ) cmd[cmd_name] = handler;
    };
    
    $parse._run = function(tokens,model) {
        var result = '';
            
        tokens.forEach(function(token){
            if( _.isString(token) ) result += token;
            else if( _.isObject(token,'modelscript') ) result += token.render(model);
            else if( _.isArray(token) ) result += $parse._run(token,model);
        });
        
        return result;
    }
    
    $parse.modelQuery = function(model,selector) {
		selector = selector.trim();
		//if( /^\'.*\'$/.test(selector) ) return [selector.match(/^\'(.*)\'$/)[1]];
		
		var path = selector.split('/'), step, parent;
		while( step = path.shift() ) {
			if( step != '.' ) {
				if( step == '..' ) model = model._parent || {};
				else {
					parent = model;
					model = _.key(model,step);
					model._parent = parent;
				}
			}
		}
		return model || '';
    };
	
	$parse.modelValue = function(model,arg){
        
        var value;
        //if( /^[\w\_\.]+$/.test(arg) ) value = _.key(model,arg);
        if( /^[\w\_\.]+$/.test(arg) ) value = $parse.modelQuery(model,arg);
        else {
            var eval_vars = '';
            _.keys(model).forEach(function(key){ eval_vars += (','+key+' = model.'+key) });
            try{
            	eval('value = (function(){ var aux'+eval_vars+'; return ('+arg+'); })();');
            }catch(err){ console.log('ERROR: '+err.message+' in '); console.log('value = (function(){ var aux'+eval_vars+'; return ('+arg+'); })();'); console.log(model); }
        }
        return value;
	};
    
    cmd.root = function(){ return this.content; };
    cmd.var = function(value){ return (value instanceof Object) ? '' : (value || ''); };
    cmd.if = function(cond){ return cond ? this.content : this.otherwise; };
    cmd['?'] = cmd.if;
    
    function modelScript(cmd,arg,options,list){
        this.cmd = cmd;
        this.options = options || {};
        this.options.args = arg.split(',');
        this.list = list || [];
    }
    
    modelScript.prototype.render = function(model,args){
        var tokens;
        
        if( cmd[this.cmd] instanceof Function ) {
            var params = [];
            this.options.model = model;
            this.options.args.forEach(function(key){ params.push(key?$parse.modelValue(model,key):''); });
            tokens = cmd[this.cmd].apply(this.options,params);
        } else return '[command '+this.cmd+' not found]';
        
        if( _.isArray(tokens) ) return $parse._run(tokens,model);
        else if( _.isString(tokens) ) return tokens;
        return '' + tokens;
    }
    
    function parseTokens(cmd,arg,tokens) {
    	cmd = (cmd || '').trim();
        arg = (arg || '').trim();
        
        var options = { content: [] },
            current_option = 'content',
            list = [ options.content ],
            nextOption = function(option_name) {
                options[option_name] = []; current_option = option_name; list.push(options[option_name]);
            };
        
        token = tokens.shift()
        while( token !== undefined ){
            
            if( _.isString(token) ) options[current_option].push(token);
            else if( token instanceof Object ) {
                if( token.cmd ) {
                    
                    switch(token.cmd) {
                    	case 'i18n':
                    		options[current_option].push(new modelScript(token.cmd,token.arg.replace(/\/$/,'')));
                    		break;
                        case 'case':
                        case 'when':
                            nextOption(token.arg);
                            break;
                        default: // cmd is like a helper
                        	if( token.arg.substr(-1) == '/' ) options[current_option].push(new modelScript(token.cmd,token.arg.replace(/\/$/,'')));
                            else options[current_option].push(parseTokens(token.cmd,token.arg,tokens));
                            break;
                    }
                    
                } else switch(token.arg) {
                    case 'else':
                    case 'otherwise': nextOption('otherwise'); break;
                    case '/':
                        return new modelScript(cmd,arg,options,list); // base case
                        break;
                    default:
                        options[current_option].push(new modelScript('var',token.arg));
                        break;
                }
            }
            token = tokens.shift()
        }
        if( cmd != 'root' ) console.log('something wrong in script');
        return new modelScript(cmd,arg,options,list);
    }
    
	$parse.cmd('i18n',function(){
		console.log('i18n',this);
		var params = (this.args[0] || '').match(/(([\w]+)\s*\:\s*)?(.*)/),
		    key = $parse.modelValue(this.model,params[3]);
		    //console.log('i18n',key,params[2],($i18n(key,params[2]) || '$i18n{'+key+'}'));
		return ($i18n(key,params[2]) || '$i18n{'+( params[2] ? ( params[2] + ':' ) : '' )+key+'}');
    });

	$parse.cmd('each',function(collection){
	    var result = '';
	    if( collection ) {
            _.each(collection,function(model){
            	result += $parse._run(this.content,model);
            });
        }
        return result;
    });
    
    $parse.cmd('for',function(){
    	var _for = this, result = '', selected_object = false;
	    
	    function _run(object_selector,var_name){
            selected_object = $parse.modelQuery(_for.model,object_selector);
            if( _.isArray(selected_object) ) {
                selected_object.forEach(function(item){
                    var submodel = { _parent: _for.model };
                    if(var_name) submodel[var_name] = item; else submodel = item;
                    result += $parse._run(_for.content,submodel);
                });
            } else if( selected_object instanceof Object ) {
                _.keys(selected_object).forEach(function(key){
                    var submodel = { _parent: _for.model };
                    if(var_name) submodel[var_name] = item; else submodel = item;
                    result += $parse._run(_for.content,submodel);
                });
            }
        }
	    
        if( /^\s*\S+\s+in\s+\S+\s*$/.test(this.args[0]) ) {
            var params = this.args[0].match(/^\s*(\S+)\s+in\s+(\S+)\s*$/);
            _run(params[2],params[1]);
        }
        return result;
    });
    
    $parse.cmd('with',function(){ return $parse._run(this.content,$parse.modelQuery(this.model,this.args[0])); });

    return $parse;
});
