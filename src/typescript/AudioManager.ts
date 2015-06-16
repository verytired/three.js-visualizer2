class AudioManager {
	private source;
	private audioContext = new AudioContext();
	private fileReader = new FileReader();
	private analyser;
	private isPlaySound:Boolean = false;

	private callbackBuffer;
	private callbackBufferObj;

	constructor(callback, callbackObj) {

		//analyser test
		this.analyser = this.audioContext.createAnalyser();
		this.analyser.fftSize = 128;
		this.analyser.connect(this.audioContext.destination);

		//loading audio file
		this.fileReader.onload = ()=> {
			//ロード完了後buffer取得開始
			this.audioContext.decodeAudioData(this.fileReader.result, (buffer)=> {
				this.source = this.audioContext.createBufferSource();
				this.source.buffer = buffer;
				this.source.connect(this.analyser);
				this.isPlaySound = true;
				//onload callback
				if (callback != null && callbackObj != null) callback.apply(callbackObj);
			});
		}

		//view fileName
		document.getElementById('file').addEventListener('change', (e:any)=> {
			this.fileReader.readAsArrayBuffer(e.target.files[0]);
		});
	}

	/**
	 * 再生開始
	 */
	public play() {
		if (this.isPlaySound == true) {
			this.source.start(0);
		}
	}

	/**
	 * スペクトラム取得
	 * @returns {Uint8Array}
	 */
	public getSpectrum() {
		//描画前にスペクトラムを取得する
		var spectrums = new Uint8Array(this.analyser.frequencyBinCount);
		this.analyser.getByteFrequencyData(spectrums);
		return spectrums
	}

	/**
	 * アナライザー取得
	 * @returns {any}
	 */
	public getAnalyser() {
		return this.analyser
	}
}