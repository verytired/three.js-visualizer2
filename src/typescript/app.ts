/// <reference path="DefinitelyTyped/threejs/three.d.ts" />
/// <reference path="DefinitelyTyped/dat-gui/dat-gui.d.ts" />
/// <reference path="Visualize.ts" />
/// <reference path="SoundManager.ts" />

declare module THREE {
	export var OrbitControls;
}

class App {

	private scene:THREE.Scene;
	private camera:THREE.PerspectiveCamera;
	private renderer;
	private container;
	private controls;

	private vizParams = {
		axis:true,
		isWireFrame: false,
		lineWidth: 3,
	};

	private vs:Visualize;
	private sm:SoundManager;

	constructor() {
		console.log("app start");

		//threejs initialize
		this.initThreeJS();

		//sound initialize
		var CLIENT_ID = 'd4668edbb5d755565ca2079b70b35576';
		var TRACK_URL = 'https://soundcloud.com/ben-klock/josh-wink-are-you-there-ben-klock-remix';

		this.sm = new SoundManager();
		this.sm.addListener('loaded', (e)=> {
			console.log("soundcloud loadend")
			this.sm.play();
			this.animate();
		})
		this.sm.init();
	}

	private initThreeJS() {
		//1.カメラ追加
		this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000000);
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

		//initialize visualize
		this.vs = new Visualize();
		this.scene.add(this.vs);

		//dat-gui settings
		var gui = new dat.GUI();
		var wireframeControl = gui.add(this.vizParams, 'isWireFrame');
		wireframeControl.onChange((value)=> {
			 this.vs.setWireFrame(value);
		});

		var axix_cntrl = gui.add(this.vizParams, 'axis')
		axix_cntrl.onChange((value)=> {
			axis.visible = value;
		});

		var lw_cntrl = gui.add(this.vizParams,'lineWidth',1,30);
		lw_cntrl.onChange((value)=>{
			this.vs.setLineWidth(value)
		})

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
		this.sm.update()
		this.vs.update(this.sm.getFreqByteData(),this.sm.getTimeByteData());
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

}

window.addEventListener("load", (e) => {
	console.log('loaded');
	var app = new App();
});