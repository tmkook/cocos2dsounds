/**
* 音效对象，方便统一设置声音
* example:
* Sounds.init(["res/audio/bg.mp3","res/audio/effect.mp3"]);
* Sounds.playMusic("res/audio.bg.mp3");
* Sounds.playEffect("res/audio/effect.mp3");
*/
var Sounds = {
	effect:true,
	music:true,
	musicVolume:0.5,
	effectVolume:0.5,
	ios:0,
	
	//加载音频文件
	init:function(urls){
		if(cc.sys.os == cc.sys.OS_IOS){
			this.ios = 1;
			IOS6WebAudio.init(urls);
		}else{
			cc.loader.load(urls);
		}
	},
	
	//播放音乐
	playMusic:function(url,loop){
		if(this.music){
			if(this.ios){
				IOS6WebAudio.playMusic(url,loop);
			}else{
				cc.audioEngine.playMusic(url,loop);
			}
		}
	},
	
	//暂停音乐
	stopMusic:function(){
		if(this.ios){
			IOS6WebAudio.stopMusic();
		}else{
			cc.audioEngine.pauseMusic();
		}
	},
	
	//播音效
	playEffect:function(url,loop){
		if(this.effect){
			if(this.ios){
				IOS6WebAudio.playEffect(url,loop);
			}else{
				cc.audioEngine.playEffect(url,loop);
			}
		}
	},
	
	//暂停音效
	stopEffect:function(){
		if(this.ios){
			IOS6WebAudio.stopAllEffects();
		}else{
			cc.audioEngine.stopAllEffects();
		}
	},
	
	//设置是否播放音乐
	setMusic:function(music){
		this.music = music;
		if(!music){
			this.stopMusic();
		}else{
			if(this.ios){
				IOS6WebAudio.resumeMusic();
			}else{
				cc.audioEngine.resumeMusic();
			}
		}
	},

	//设置是否播放音效
	setEffect:function(effect){
		this.effect = effect;
		if(!effect){
			this.stopEffect();
		}
	}
}


//兼容ios6音效播放
//参考资料
//https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/PlayingandSynthesizingSounds/PlayingandSynthesizingSounds.html
var IOS6WebAudio = {
	SOUNDS:[],
	myBuffers:{}, 
	myNodes:{},
	myMusic:"",
	myEffect:{},
	myAudioContext:"",
	
	//初始化
	init:function (urls) {
		this.SOUNDS = urls;
		if('webkitAudioContext' in window) {
			this.myAudioContext = new webkitAudioContext();
			this.myAudioAnalyser = this.myAudioContext.createAnalyser();
			this.myAudioAnalyser.smoothingTimeConstant = 1;
			this.myAudioAnalyser.connect(this.myAudioContext.destination);

			this.fetchSounds();
		}
	},

	//加载音频
	fetchSounds:function () {
		var request = new XMLHttpRequest();
		for (var i = 0, len = this.SOUNDS.length; i < len; i++) {
			request = new XMLHttpRequest();
			request._soundName = this.SOUNDS[i];
			request.open('GET', request._soundName, true);
			request.responseType = 'arraybuffer';
			var self = this;
			request.addEventListener('load', 
				function (event) {
					var request = event.target;
					var buffer = self.myAudioContext.createBuffer(request.response, false);
					self.myBuffers[request._soundName] = buffer;
				}, false);
			request.send();
		}
	},

	//获取音频
	routeSound:function (source) {
		this.myNodes.filter = this.myAudioContext.createBiquadFilter();
		this.myNodes.panner = this.myAudioContext.createPanner();
		this.myNodes.volume = this.myAudioContext.createGainNode();
		this.myNodes.filter.type = 1;
		source.connect(this.myNodes.filter);
		this.myNodes.filter.connect(this.myNodes.panner);
		this.myNodes.panner.connect(this.myNodes.volume);
		this.myNodes.volume.connect(this.myAudioAnalyser);
		return source;
	},

	//播放音乐
	playMusic:function (rand,loop) {
		var source = this.myAudioContext.createBufferSource();
		source.buffer = this.myBuffers[rand];
		source.loop = loop;
		source = this.routeSound(source);
		this.myMusic = source;
		this.myMusic.rand = rand;
		this.myMusic.noteOn(0);
	},
	
	//停止音乐
	stopMusic:function () {
		if(this.myMusic) this.myMusic.noteOff(0);
	},
	
	//恢复音乐
	resumeMusic:function(){
		this.playMusic(this.myMusic.rand,this.myMusic.loop);
	},
	
	//播放音效
	playEffect:function (rand,loop) {
		var source = this.myAudioContext.createBufferSource();
		source.buffer = this.myBuffers[rand];
		source.loop = loop;
		source = this.routeSound(source);
		source.rand = rand;
		this.myEffect[rand] = source;
		source.noteOn(0);
	},
	
	//停止所有音效
	stopAllEffects:function () {
		for(var i in this.myEffect){
			this.myEffect[i].noteOff(0);
		}
	}
}
