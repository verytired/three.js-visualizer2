/// <reference path="DefinitelyTyped/threejs/three.d.ts" />
/// <reference path="DefinitelyTyped/dat-gui/dat-gui.d.ts" />
/// <reference path="AudioManager.ts" />

interface Window {
	AudioContext: any;
	webkitAudioContext: any;
}

//外部ライブラリ定義
//この部分はコンパイルのみに使われるので型指定は適当
declare var SC: {
	get: (a,b,c)=>any;
	initialize: (a)=>any;
};

class App {
	constructor() {
		console.log("app start");
		var CLIENT_ID = 'd4668edbb5d755565ca2079b70b35576';
		var TRACK_URL = 'https://soundcloud.com/dj_potato_salad/d-j-potato-salad-presents-y-a';
		SC.initialize({
			client_id: CLIENT_ID
		});
		//// get the sound info
		SC.get('/resolve', {url: TRACK_URL}, (sound)=> {
			if (sound.errors) {
				// error occur
				for (var i = 0; i < sound.errors.length; i++) {
					console.log(sound.errors[i].error_message);
				}
				return;
			}
			// succeed in getting the sound info
			console.log(sound);

			// set the stream url to the audio element
			var audio = document.getElementById('audio');
			var streamUrl = sound.stream_url + '?client_id=' + CLIENT_ID;
			audio.setAttribute('src', streamUrl);

			// create and setup an analyser
			var audioCtx = new (window.AudioContext || window.webkitAudioContext);
			var analyser = audioCtx.createAnalyser();
			analyser.fftSize = 256;
			var source = audioCtx.createMediaElementSource(audio);
			source.connect(analyser);
			analyser.connect(audioCtx.destination);
		});
	}
}

window.addEventListener("load", (e) => {
	console.log('loaded');
	var app = new App();
});