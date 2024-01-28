chrome.runtime.onMessage.addListener(async (message) => {
	if (message.target === "offscreen") {
		switch (message.type) {
			case "start-offscreen-recording":
				startRecording(message.data);
				break;
			case "stop-offscreen-recording":
				stopRecording();
				break;
			default:
				throw new Error("Unrecognized message:", message.type);
		}
	}
});

let recorder;
let data = [];

async function startRecording(streamId) {
	if (recorder?.state === "recording") {
		throw new Error(
			"Called startRecording while recording is in progress."
		);
	}

	const media = await navigator.mediaDevices.getUserMedia({
		audio: {
			mandatory: {
				chromeMediaSource: "tab",
				chromeMediaSourceId: streamId,
			},
		},
		video: false,
	});

	// Continue to play the captured audio to the user.
	const output = new AudioContext()
	const source = output.createMediaStreamSource(media)
	source.connect(output.destination)

	// Start recording
	recorder = new MediaRecorder(media, { 
		mimeType: "video/webm; codecs=opus"
	})

	recorder.ondataavailable = (event) => data.push(event.data);
	recorder.onstop = () => {
		const blob = new Blob(data, { type: "video/webm; codecs=opus" })

		// Encode to base64 => send to app.vue
		let reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onloadend = function () {
        	let base64String = reader.result

			chrome.runtime.sendMessage({
				type: "save-recording",
				data: base64String,
			})
        } 

		// Clear state ready for next recording
		recorder = undefined;
		data = [];
	}

	recorder.start();

	// Record the current state in the URL. This provides a very low-bandwidth
	// way of communicating with the service worker (the service worker can check
	// the URL of the document and see the current recording state). We can't
	// store that directly in the service worker as it may be terminated while
	// recording is in progress. We could write it to storage but that slightly
	// increases the risk of things getting out of sync.
	window.location.hash = "recording";
}

async function stopRecording() {
	recorder.stop();

	// Stopping the tracks makes sure the recording icon in the tab is removed.
	recorder.stream.getTracks().forEach((t) => t.stop());

	// Update current state in URL
	window.location.hash = "";
}
