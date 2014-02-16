(function(root){
	var document = root.document,
		head = document.getElementsByTagName('head')[0],
		baseURI = function(node){
			node = node[node.length-1];

			var URL = node.hasAttribute ? node.src : node.getAttribute('src', 4);
            URL = URL || root.location.href;
			return URL.slice(0, URL.lastIndexOf('/') + 1);
		}(document.getElementsByTagName('script'))
	//============
	function each(target, callback){
		var len = target.length;

		if(len){
			for(var i=0; i<len; i++) callback.call(null, target[i], i);
			return;
		}

		for(var key in target) callback.call(null, target[key], key);

	}

	function isUnnormalId(id){
		return (/^https?:|^\/|.js$/).test(id);
	}

	function isRelativePath(path){
		return path.indexOf('.') === 0
	}

	var DOT_RE = /\/\.\//g,
		DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//,
		DOUBLE_SLASH_RE = /([^:/])\/\//g

	function resolvePath(base, id){
		var path = base.substring(0, base.lastIndexOf('/')+1) + id;
		// a/./b => a/b
		path = path.replace(DOT_RE, '/');
		// a/b/../c/d => a/c/d
		while(path.match(DOUBLE_DOT_RE)){
			path = path.replace(DOUBLE_DOT_RE, '/')
		}
		// a/b//c/d => a/b/c/d
		path = path.replace(DOUBLE_SLASH_RE, '$1/');
		return path

	}

	function normalize(base, id){
		if(isUnnormalId(id)){
			return id;
		}

		if(isRelativePath(id)){
			return resolvePath(base, id) + '.js'
		}
		return base + id + '.js'
	}


	var Cache = function(){
		var _cache = {}

		return {
			get: function(key){
				return _cache[key];
			},
			set: function(key, value){
				if(_cache[key])  return false;
				_cache[key] = value;
				return true;
			}
		}
	}();


	var Loader = function(url, stop){
		this.stop = stop;
		this.path = url;
		this.list = [];
		this.loaded = 0;

		this.init();
	}

	Loader.prototype = {
		init: function(){
			var that = this;
			!that.stop && that.load(that.path);
		},
		load: function(url){
			var that = this;
			if(that.getType(url) === 'JS'){
				that.createScript();
				return;
			}
			that.createLink();
		},
		getType: function(url){
			return url.slice(url.lastIndexOf('.')+1).toUpperCase()
		},
		createLink: function(){
			var url = this.path,
				node = document.createElement('link');
			node.type = 'text/css';
			node.rel = 'stylesheet';
			node.href = url;

			node.onload = node.onerror = function(){
				node.onload = node.onerror = node = null;
				head.removeChild(node);
			}
			head.appendChild(node);
		},
		createScript: function(){
			var url = this.path,
				node = document.createElement('script')

			node.type = 'text/javascript';
			node.src = url;

			node.onload = function(){
				node.onload = node = null;
			}
			node.onerror = function(){
				node.onerror = node = null;
				head.removeChild(node);
			}
			head.appendChild(node);
		},
		done: function(){
			this.loaded = true;
			each(this.list, function(cb){
				return cb();
			})
		}
	}

	root.e = {
		config: function(options){
			if(options.baseURI){
				baseURI = resolvePath(baseURI, options.baseURI);
			}
			for(var key in options){
				root.e[key] = options[key];
			}
		}
	}

	//============

	function req(ids, callback){
		ids = typeof ids === 'string' ? [ids] : ids;
		each(ids, function(id){
			var path = normalize(baseURI, id),
				cache = Cache.get(path)

			if(!cache){
				cache = new Loader(path);
				Cache.set(path, cache);
			}
		})
	}

	function def(id, deps, factory){

	}

	e.use = root.require = root.require || req;
	root.define = root.define || def;

})(this);