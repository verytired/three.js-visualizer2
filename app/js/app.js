var AudioManager = (function () {
    function AudioManager(callback, callbackObj) {
        var _this = this;
        this.audioContext = new AudioContext();
        this.fileReader = new FileReader();
        this.isPlaySound = false;
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 128;
        this.analyser.connect(this.audioContext.destination);
        this.fileReader.onload = function () {
            _this.audioContext.decodeAudioData(_this.fileReader.result, function (buffer) {
                _this.source = _this.audioContext.createBufferSource();
                _this.source.buffer = buffer;
                _this.source.connect(_this.analyser);
                _this.isPlaySound = true;
                if (callback != null && callbackObj != null)
                    callback.apply(callbackObj);
            });
        };
        document.getElementById('file').addEventListener('change', function (e) {
            _this.fileReader.readAsArrayBuffer(e.target.files[0]);
        });
    }
    AudioManager.prototype.play = function () {
        if (this.isPlaySound == true) {
            this.source.start(0);
        }
    };
    AudioManager.prototype.getSpectrum = function () {
        var spectrums = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(spectrums);
        return spectrums;
    };
    AudioManager.prototype.getAnalyser = function () {
        return this.analyser;
    };
    return AudioManager;
})();
var App = (function () {
    function App() {
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
            }, 1000 / 60);
        });
    }
    return App;
})();
window.addEventListener("load", function (e) {
    console.log('loaded');
    var app = new App();
});
