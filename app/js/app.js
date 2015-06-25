var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var SoundManager = (function (_super) {
    __extends(SoundManager, _super);
    function SoundManager() {
        _super.call(this);
        this.CLIENT_ID = 'd4668edbb5d755565ca2079b70b35576';
        this.TRACK_URL = 'https://soundcloud.com/ben-klock/josh-wink-are-you-there-ben-klock-remix';
    }
    SoundManager.prototype.init = function () {
        var _this = this;
        SC.initialize({
            client_id: this.CLIENT_ID
        });
        SC.get('/resolve', { url: this.TRACK_URL }, function (sound) {
            if (sound.errors) {
                for (var i = 0; i < sound.errors.length; i++) {
                    console.log(sound.errors[i].error_message);
                }
                return;
            }
            _this.audio = document.getElementById('audio');
            var streamUrl = sound.stream_url + '?client_id=' + _this.CLIENT_ID;
            _this.audio.setAttribute('src', streamUrl);
            _this.audioContext = new (window.AudioContext || window.webkitAudioContext);
            _this.analyser = _this.audioContext.createAnalyser();
            _this.analyser.smoothingTimeConstant = 0.1;
            _this.analyser.fftSize = 1024;
            _this.source = _this.audioContext.createMediaElementSource(_this.audio);
            _this.source.connect(_this.analyser);
            _this.analyser.connect(_this.audioContext.destination);
            _this.freqByteData = new Uint8Array(_this.analyser.frequencyBinCount);
            _this.timeByteData = new Uint8Array(_this.analyser.frequencyBinCount);
            _this.emit("loaded", { "hoge": "hogehoge" });
        });
    };
    SoundManager.prototype.play = function () {
        this.audio.play();
    };
    return SoundManager;
})(EventEmitter2);
var Visualize = (function (_super) {
    __extends(Visualize, _super);
    function Visualize() {
        _super.call(this);
        this.RINGCOUNT = 160;
        this.SEPARATION = 30;
        this.INIT_RADIUS = 50;
        this.SEGMENTS = 512;
        this.BIN_COUNT = 512;
        this.init();
    }
    Visualize.prototype.init = function () {
        var geometry = new THREE.BoxGeometry(40, 40, 40);
        this.material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        this.cube = new THREE.Mesh(geometry, this.material);
        this.cube.position.set(0, 0, 0);
        this.cube.castShadow = true;
        this.add(this.cube);
        var loopShape = new THREE.Shape();
        var r = 100;
        loopShape.absarc(0, 0, 100, 0, Math.PI * 2, false);
        this.loopGeom = loopShape.createPointsGeometry(512 / 2);
        this.loopGeom.dynamic = true;
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
        this.add(line);
        for (var j = 0; j < this.SEGMENTS; j++) {
            var v = this.loopGeom.vertices[j];
            this.loopGeom.vertices[j].z = 0;
        }
        this.loopGeom.vertices[this.SEGMENTS].z = this.loopGeom.vertices[0].z;
    };
    Visualize.prototype.update = function () {
    };
    return Visualize;
})(THREE.Object3D);
var App = (function () {
    function App() {
        var _this = this;
        this.vizParams = {
            isWireFrame: false,
        };
        this.onWindowResize = function () {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        };
        console.log("app start");
        this.initThreeJS();
        var CLIENT_ID = 'd4668edbb5d755565ca2079b70b35576';
        var TRACK_URL = 'https://soundcloud.com/ben-klock/josh-wink-are-you-there-ben-klock-remix';
        var sc = new SoundManager();
        sc.addListener('loaded', function (e) {
            console.log("soundcloud loadend");
            sc.play();
            _this.animate();
        });
        sc.init();
    }
    App.prototype.initThreeJS = function () {
        var _this = this;
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.position.set(0, 70, 70);
        this.scene = new THREE.Scene();
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
        this.container = document.getElementById('container');
        this.container.appendChild(this.renderer.domElement);
        this.onWindowResize();
        window.addEventListener("resize", this.onWindowResize, false);
        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
        directionalLight.position.set(0, 100, 30);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        var axis = new THREE.AxisHelper(1000);
        axis.position.set(0, 0, 0);
        this.scene.add(axis);
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.container.addEventListener("mousemove", (function (e) {
            var mouseX, mouseY;
            mouseX = e.clientX - 600 / 2;
            mouseY = e.clientY - 400 / 2;
        }), false);
        this.vs = new Visualize();
        this.scene.add(this.vs);
        this.canvas = document.getElementById('visualizer');
        this.canvasContext = this.canvas.getContext('2d');
        var gui = new dat.GUI();
        var wireframeControl = gui.add(this.vizParams, 'isWireFrame');
        wireframeControl.onChange(function (value) {
        });
        window.addEventListener("keyup", function (e) {
            var imgData, imgNode;
            if (e.which !== 80)
                return;
            try {
                imgData = _this.renderer.domElement.toDataURL();
                console.log(imgData);
            }
            catch (e) {
                console.log(e);
                console.log("Browser does not support taking screenshot of 3d context");
                return;
            }
        });
    };
    App.prototype.update = function () {
        this.vs.update();
    };
    App.prototype.render = function () {
        this.renderer.render(this.scene, this.camera);
    };
    App.prototype.animate = function () {
        var _this = this;
        this.update();
        this.render();
        requestAnimationFrame(function (e) { return _this.animate(); });
    };
    return App;
})();
window.addEventListener("load", function (e) {
    console.log('loaded');
    var app = new App();
});
