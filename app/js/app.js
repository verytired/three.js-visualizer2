var App = (function () {
    function App() {
        var _this = this;
        this.isWireFrame = false;
        this.rings = [];
        this.levels = [];
        this.colors = [];
        this.RINGCOUNT = 160;
        this.SEPARATION = 30;
        this.INIT_RADIUS = 50;
        this.SEGMENTS = 512;
        this.BIN_COUNT = 512;
        this.onWindowResize = function () {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        };
        console.log("app start");
        var CLIENT_ID = 'd4668edbb5d755565ca2079b70b35576';
        var TRACK_URL = 'https://soundcloud.com/ben-klock/josh-wink-are-you-there-ben-klock-remix';
        SC.initialize({
            client_id: CLIENT_ID
        });
        SC.get('/resolve', { url: TRACK_URL }, function (sound) {
            if (sound.errors) {
                for (var i = 0; i < sound.errors.length; i++) {
                    console.log(sound.errors[i].error_message);
                }
                return;
            }
            console.log(sound);
            var audio = document.getElementById('audio');
            var streamUrl = sound.stream_url + '?client_id=' + CLIENT_ID;
            audio.setAttribute('src', streamUrl);
            _this.audioContext = new (window.AudioContext || window.webkitAudioContext);
            _this.analyser = _this.audioContext.createAnalyser();
            _this.analyser.smoothingTimeConstant = 0.1;
            _this.analyser.fftSize = 1024;
            _this.source = _this.audioContext.createMediaElementSource(audio);
            _this.source.connect(_this.analyser);
            _this.analyser.connect(_this.audioContext.destination);
            _this.freqByteData = new Uint8Array(_this.analyser.frequencyBinCount);
            _this.timeByteData = new Uint8Array(_this.analyser.frequencyBinCount);
            _this.initThreeJS();
            _this.cube.scale.set(0.001, 0.001, 0.001);
            _this.animate();
            audio.play();
        });
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
        var geometry = new THREE.BoxGeometry(40, 40, 40);
        this.material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        this.cube = new THREE.Mesh(geometry, this.material);
        this.cube.position.set(0, 0, 0);
        this.cube.castShadow = true;
        this.scene.add(this.cube);
        var axis = new THREE.AxisHelper(1000);
        axis.position.set(0, 0, 0);
        this.scene.add(axis);
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.container.addEventListener("mousemove", (function (e) {
            var mouseX, mouseY;
            mouseX = e.clientX - 600 / 2;
            mouseY = e.clientY - 400 / 2;
        }), false);
        this.canvas = document.getElementById('visualizer');
        this.canvasContext = this.canvas.getContext('2d');
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
        this.scene.add(line);
        for (var j = 0; j < this.SEGMENTS; j++) {
            this.loopGeom.vertices[j].z = Math.random(1000) * 10;
        }
        this.loopGeom.vertices[this.SEGMENTS].z = this.loopGeom.vertices[0].z;
        var gui = new dat.GUI();
        var wireframeControl = gui.add(this, 'isWireFrame');
        wireframeControl.onChange(function (value) {
            _this.material.wireframe = value;
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
        this.analyser.getByteFrequencyData(this.freqByteData);
        this.analyser.getByteTimeDomainData(this.timeByteData);
        var sum = 0;
        for (var i = 0; i < this.BIN_COUNT; i++) {
            sum += this.freqByteData[i];
        }
        var aveLevel = sum / this.BIN_COUNT;
        var scaled_average = (aveLevel / 256) * 1.0 * 2;
        this.levels.push(scaled_average);
        this.levels.shift(1);
        for (var j = 0; j < this.SEGMENTS; j++) {
            this.loopGeom.vertices[j].z = this.timeByteData[j];
        }
        this.loopGeom.vertices[this.SEGMENTS].z = this.loopGeom.vertices[0].z;
        this.loopGeom.verticesNeedUpdate = true;
        var d = 10 * scaled_average;
        if (d > 0)
            this.cube.scale.set(d, d, d);
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
    App.prototype.loadSoundCloud = function () {
    };
    App.prototype.initAudioAPI = function () {
    };
    return App;
})();
window.addEventListener("load", function (e) {
    console.log('loaded');
    var app = new App();
});
