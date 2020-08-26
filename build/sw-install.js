if ("serviceWorker" in navigator) {
	navigator.serviceWorker.register("/sw.js");
	navigator.serviceWorker.addEventListener("controllerchange", () => {
		window.location.reload();
	});
}
