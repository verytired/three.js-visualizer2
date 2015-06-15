var App = (function () {
    function App() {
        console.log("app start");
    }
    return App;
})();
window.addEventListener("load", function (e) {
    console.log('loaded');
    var app = new App();
});
