class App {
	constructor() {
		console.log("app start");
	}
}

window.addEventListener("load", (e) => {
	console.log('loaded');
	var app = new App();
});