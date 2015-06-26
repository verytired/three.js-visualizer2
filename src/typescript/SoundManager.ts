/// <reference path="DefinitelyTyped/eventemitter2/eventemitter2.d.ts" />

interface Window {
	AudioContext: any;
	webkitAudioContext: any;
}

//外部ライブラリ定義
declare var SC:any

class SoundManager extends EventEmitter2 {

	private CLIENT_ID:string = 'd4668edbb5d755565ca2079b70b35576';
	private TRACK_URL:string = 'https://soundcloud.com/ben-klock/josh-wink-are-you-there-ben-klock-remix';
	//private TRACK_URL:string = 'https://soundcloud.com/faruway/vril-torus-xxxii'
	private audio;
	private source;
	private analyser;
	private buffer;
	private audioBuffer;
	private audioContext;
	private freqByteData;
	private timeByteData;

	constructor() {
		super();
	}

	public init() {

		SC.initialize({
			client_id: this.CLIENT_ID
		});

		//// get the sound info
		SC.get('/resolve', {url: this.TRACK_URL}, (sound)=> {

			if (sound.errors) {
				// error occur
				for (var i = 0; i < sound.errors.length; i++) {
					console.log(sound.errors[i].error_message);
				}
				return;
			};

			// set the stream url to the audio element
			this.audio = document.getElementById('audio');
			var streamUrl = sound.stream_url + '?client_id=' + this.CLIENT_ID;
			this.audio.setAttribute('src', streamUrl);

			// create and setup an analyser
			this.audioContext = new (window.AudioContext || window.webkitAudioContext);
			this.analyser = this.audioContext.createAnalyser();
			this.analyser.smoothingTimeConstant = 0.1;
			this.analyser.fftSize = 1024;
			this.source = this.audioContext.createMediaElementSource(this.audio);
			this.source.connect(this.analyser);
			this.analyser.connect(this.audioContext.destination);

			//var bytes = new Uint8Array(analyser.frequencyBinCount);
			this.freqByteData = new Uint8Array(this.analyser.frequencyBinCount);
			this.timeByteData = new Uint8Array(this.analyser.frequencyBinCount);

			this.emit("loaded", {"hoge": "hogehoge"});
		});
	}

	private isPlay:boolean = false;
	public play() {
		this.isPlay = true
		this.audio.play();
	}

	public stop() {
		this.isPlay = false;
		this.audio.stop();
	}

	public update() {
		if(!this.isPlay)return
		this.analyser.getByteFrequencyData(this.freqByteData);
		this.analyser.getByteTimeDomainData(this.timeByteData)
	}

	public getFreqByteData() {
		if(!this.isPlay)return
		return this.freqByteData;
	}

	public getTimeByteData() {
		return this.timeByteData;
	}
}