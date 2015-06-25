/// <reference path="DefinitelyTyped/threejs/three.d.ts" />
/// <reference path="DefinitelyTyped/dat-gui/dat-gui.d.ts" />

interface Window {
	AudioContext: any;
	webkitAudioContext: any;
}

//外部ライブラリ定義
//この部分はコンパイルのみに使われるので型指定は適当
declare var SC:{
	get: (a, b, c)=>any;
	initialize: (a)=>any;
};

declare module THREE {
	export var OrbitControls;
}

class App {

	private scene:THREE.Scene;
	private camera:THREE.PerspectiveCamera;
	private renderer;
	private container;
	private controls;
	private cube;
	private material;
	private isWireFrame:Boolean = false;
	private animationId;
	private canvas;
	private canvasContext;
	private spectrums;

	private source;
	private analyser;
	private buffer;
	private audioBuffer;
	private audioContext;
	private freqByteData;
	private timeByteData;

	private rings = [];
	private levels = [];
	private colors = [];

	private RINGCOUNT = 160;//リングの数
	private SEPARATION = 30;
	private INIT_RADIUS = 50;
	private SEGMENTS = 512; //リングの分割数
	private BIN_COUNT = 512;

	private loopGeom;

	constructor() {
		console.log("app start");

		var CLIENT_ID = 'd4668edbb5d755565ca2079b70b35576';
		var TRACK_URL = 'https://soundcloud.com/ben-klock/josh-wink-are-you-there-ben-klock-remix';

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
			var audio:any = document.getElementById('audio');
			var streamUrl = sound.stream_url + '?client_id=' + CLIENT_ID;
			audio.setAttribute('src', streamUrl);

			// create and setup an analyser
			this.audioContext = new (window.AudioContext || window.webkitAudioContext);
			this.analyser = this.audioContext.createAnalyser();
			this.analyser.smoothingTimeConstant = 0.1;
			this.analyser.fftSize = 1024;
			this.source = this.audioContext.createMediaElementSource(audio);
			this.source.connect(this.analyser);
			this.analyser.connect(this.audioContext.destination);

			//var bytes = new Uint8Array(analyser.frequencyBinCount);
			this.freqByteData = new Uint8Array(this.analyser.frequencyBinCount);
			this.timeByteData = new Uint8Array(this.analyser.frequencyBinCount);

			this.initThreeJS();
			this.cube.scale.set(0.001, 0.001, 0.001)

			//start
			this.animate();
			audio.play();
		});
	}

	private initThreeJS() {
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
		this.renderer.setClearColor(0x000000);
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
		var geometry = new THREE.BoxGeometry(40, 40, 40);
		this.material = new THREE.MeshPhongMaterial({color: 0xff0000});
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

		//shape test circle
		var loopShape = new THREE.Shape();
		var r = 100

		loopShape.absarc(0, 0, 100, 0, Math.PI * 2, false);//これで円を書いている absarc(原点x,原点y,半径,start角度,end角度,???)
		this.loopGeom = loopShape.createPointsGeometry(512 / 2);//shapeにgeometoryの頂点データを生成する  //2点生成されるから半分の数の指定でいい？
		this.loopGeom.dynamic = true;

		//頂点をLineで結ぶ
		var m = new THREE.LineBasicMaterial({
			color: 0xffffff,
			linewidth: 1,
			opacity: 0.7,
			blending: THREE.AdditiveBlending,
			depthTest: false,
			transparent: true
		});
		var line = new THREE.Line(this.loopGeom, m);

		var scale = 1;
		scale *= 0.5;
		line.scale.x = scale;
		line.scale.y = scale;
		this.scene.add(line);

		//z-index
		for (var j = 0; j < this.SEGMENTS; j++) {
			this.loopGeom.vertices[j].z = Math.random(1000) * 10
		}
		// link up last segment
		this.loopGeom.vertices[this.SEGMENTS].z = this.loopGeom.vertices[0].z;


		//dat-gui設定
		var gui = new dat.GUI();
		var wireframeControl = gui.add(this, 'isWireFrame');
		wireframeControl.onChange((value)=> {
			this.material.wireframe = value
		});


		/*** ADDING SCREEN SHOT ABILITY ***/
		window.addEventListener("keyup", (e)=> {
			var imgData, imgNode;
			//Listen to 'P' key
			if (e.which !== 80) return;
			try {
				imgData = this.renderer.domElement.toDataURL();
				console.log(imgData);
			}
			catch (e) {
				console.log(e)
				console.log("Browser does not support taking screenshot of 3d context");
				return;
			}
		});
	}

	private onWindowResize = function () {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	private update() {
		//this.spectrums = this.audioManager.getSpectrum();
		//this.draw(spectrums);
		this.analyser.getByteFrequencyData(this.freqByteData);
		this.analyser.getByteTimeDomainData(this.timeByteData)

		//リングの処理
		//add a new average volume onto the list
		//平均化　ピークを合わせる　
		var sum = 0;
		for(var i = 0; i < this.BIN_COUNT; i++) {
			sum += this.freqByteData[i];
		}
		var aveLevel = sum / this.BIN_COUNT;
		var scaled_average = (aveLevel / 256) * 1.0*2; //256 is the highest a level can be
		this.levels.push(scaled_average);
		this.levels.shift(1);

		////add a new color onto the list
		////生成するカラー決定
		//var n = Math.abs(perlin.noise(noisePos, 0, 0));
		//colors.push(n);
		//colors.shift(1);

		//write current waveform into all rings
		//z軸変化はdbの時間軸変化で表す
		for(var j = 0; j < this.SEGMENTS; j++) {
			this.loopGeom.vertices[j].z = this.timeByteData[j];//stretch by 2
		}
		// link up last segment
		this.loopGeom.vertices[this.SEGMENTS].z = this.loopGeom.vertices[0].z;
		this.loopGeom.verticesNeedUpdate = true;

		//console.log(bytes);
		var d = 10*scaled_average;
		//this.cube.position.y = d
		if (d > 0)this.cube.scale.set(d, d, d);
	}

	private render() {
		this.renderer.render(this.scene, this.camera);
	}

	public animate() {
		this.update();
		this.render();

		requestAnimationFrame((e)=>
				this.animate()
		);
	}

	//todo
	public loadSoundCloud(){

	}

	//todo
	public initAudioAPI() {

	}
}

window.addEventListener("load", (e) => {
	console.log('loaded');
	var app = new App();


});