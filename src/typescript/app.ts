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

	private scene:THREE.Scene;
	private camera:THREE.PerspectiveCamera;
	private renderer;
	private container;
	private controls;
	private cube;
	private material;
	private isWireFrame:Boolean =false;
	private animationId;
	private audioManager:AudioManager;
	private canvas;
	private canvasContext;
	private spectrums;


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

			var bytes = new Uint8Array(analyser.frequencyBinCount);

			//描画用ループを設定しその中で再生中のバッファを取得する
			var drawId = setInterval(()=>{
				analyser.getByteFrequencyData(bytes);
				//console.log(bytes);
				var d = bytes[8];
				//this.cube.position.y = d
				this.cube.scale.set(d / 100, d / 100, d / 100);
				this.renderer.render(this.scene, this.camera);

			},1000/60)

			this.initThreeJS();

		});
	}

	private initThreeJS(){
		//1.カメラ追加
		this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
		this.camera.position.set(0, 70, 70);

		//2.シーン追加
		this.scene = new THREE.Scene();

		//3.レンダラー追加
		this.renderer = new THREE.WebGLRenderer({
			antialias: false,
			clearColor: 0x000000,
			clearAlpha: 0,
			alpha: true,
			preserveDrawingBuffer: true
		});
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setClearColor(0xffffff);
		this.renderer.shadowMapEnabled = true;

		//4.表示コンテナ指定
		this.container = document.getElementById('container');
		this.container.appendChild(this.renderer.domElement);
		//リサイズ処理
		this.onWindowResize();
		window.addEventListener("resize", this.onWindowResize, false);

		//5 オブジェクト追加
		//光源追加
		var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
		directionalLight.position.set(0, 100, 30);
		directionalLight.castShadow = true;
		this.scene.add(directionalLight);
		//cube追加
		var geometry = new THREE.CubeGeometry(40, 40, 40);
		this.material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
		this.cube = new THREE.Mesh(geometry, this.material);
		this.cube.position.set(0, 0, 0);
		this.cube.castShadow = true;
		this.scene.add(this.cube);
		//座標軸追加
		var axis = new THREE.AxisHelper(1000);
		axis.position.set(0, 0, 0);
		this.scene.add(axis);

		//マウス制御機能追加
		this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
		this.container.addEventListener("mousemove", ((e) => {
			var mouseX, mouseY;
			mouseX = e.clientX - 600 / 2;
			mouseY = e.clientY - 400 / 2;
		}), false);

		this.canvas = document.getElementById('visualizer');
		this.canvasContext = this.canvas.getContext('2d');
		//this.canvas.setAttribute('width', this.audioManager.getAnalyser().frequencyBinCount * 10);

		var gui = new dat.GUI();
		var wireframeControl = gui.add(this, 'isWireFrame');
		wireframeControl.onChange( (value)=> {
			this.material.wireframe = value
		});

		/*** ADDING SCREEN SHOT ABILITY ***/
		window.addEventListener("keyup", (e)=>{
			var imgData, imgNode;
			//Listen to 'P' key
			if(e.which !== 80) return;
			try {
				imgData = this.renderer.domElement.toDataURL();
				console.log(imgData);
			}
			catch(e) {
				console.log(e)
				console.log("Browser does not support taking screenshot of 3d context");
				return;
			}
		});

		this.animate();
	}

	private onWindowResize = function () {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	private update() {
		//this.spectrums = this.audioManager.getSpectrum();
		//this.draw(spectrums);
	}

	private draw(spectrums) {
		//描画
		//spectrums 0 - 200の範囲

		//this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
		//for (var i = 0, len = spectrums.length; i < len; i++) {
		//	this.canvasContext.fillRect(i * 10, 0, 5, spectrums[i]);
		//}
	}

	private render() {
		//var d = 50;
		//this.cube.position.y = d
		//this.cube.scale.set(d / 100, d / 100, d / 100);
		this.renderer.render(this.scene, this.camera);
	}

	public animate() {
		this.update();
		this.draw(this.spectrums);

		requestAnimationFrame((e)=>
				this.animate()
		);
		this.render();
	}
}

window.addEventListener("load", (e) => {
	console.log('loaded');
	var app = new App();


});