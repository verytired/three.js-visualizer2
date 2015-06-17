var App = (function () {
    function App() {
        var _this = this;
        this.isWireFrame = false;
        this.onWindowResize = function () {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        };
        console.log("app start");
        var CLIENT_ID = 'd4668edbb5d755565ca2079b70b35576';
        var TRACK_URL = 'https://soundcloud.com/dj_potato_salad/d-j-potato-salad-presents-y-a';
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
            var audioCtx = new (window.AudioContext || window.webkitAudioContext);
            var analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            var source = audioCtx.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
            var bytes = new Uint8Array(analyser.frequencyBinCount);
            var drawId = setInterval(function () {
                analyser.getByteFrequencyData(bytes);
                var d = bytes[8];
                if (d > 0)
                    _this.cube.scale.set(d / 100, d / 100, d / 100);
                _this.renderer.render(_this.scene, _this.camera);
            }, 1000 / 60);
            _this.initThreeJS();
            _this.cube.scale.set(0.001, 0.001, 0.001);
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
        this.renderer.setClearColor(0xffffff);
        this.renderer.shadowMapEnabled = true;
        this.container = document.getElementById('container');
        this.container.appendChild(this.renderer.domElement);
        this.onWindowResize();
        window.addEventListener("resize", this.onWindowResize, false);
        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
        directionalLight.position.set(0, 100, 30);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        var geometry = new THREE.CubeGeometry(40, 40, 40);
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
        this.animate();
    };
    App.prototype.update = function () {
    };
    App.prototype.draw = function (spectrums) {
    };
    App.prototype.render = function () {
        this.renderer.render(this.scene, this.camera);
    };
    App.prototype.animate = function () {
        var _this = this;
        this.update();
        this.draw(this.spectrums);
        requestAnimationFrame(function (e) { return _this.animate(); });
        this.render();
    };
    return App;
})();
window.addEventListener("load", function (e) {
    console.log('loaded');
    var app = new App();
});
