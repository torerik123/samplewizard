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

async function startRecording({ streamId, tabName }) {
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
	recorder.onstop = async () => {
		const blob = new Blob(data, { type: "video/webm; codecs=opus" })

		// Convert Blob to ArrayBuffer
		const arrayBuffer = await blob.arrayBuffer()

		// Decode audio data to PCM
		const audioContext = new AudioContext()
		const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

		// Create a WAV file with PCM data
		const wavBlob = createWAVBlob(audioBuffer)

		// Encode to base64 => send to app.vue
		let reader = new FileReader()
		reader.readAsDataURL(wavBlob)
		reader.onloadend = function () {
			let base64String = reader.result

			chrome.runtime.sendMessage({
				type: "save-recording",
				data: {
					recording: base64String,
					tabName,
				},
			})
		}

		// Clear state ready for next recording
		recorder = undefined
		data = []
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

function createWAVBlob(audioBuffer) {
	const numOfChan = audioBuffer.numberOfChannels,
		length = audioBuffer.length * numOfChan * 2 + 44,
		buffer = new ArrayBuffer(length),
		view = new DataView(buffer),
		channels = [],
		sampleRate = audioBuffer.sampleRate,
		bitDepth = 16

	// Write WAV file header, passing the audioBuffer for length info
	writeWAVHeader(view, sampleRate, numOfChan, bitDepth, audioBuffer)

	// Write audio data
	let offset = 44
	for (let i = 0; i < numOfChan; i++) {
		channels.push(audioBuffer.getChannelData(i))
	}
	for (let i = 0; i < audioBuffer.length; i++) {
		for (let channel = 0; channel < numOfChan; channel++) {
			let sample = Math.max(-1, Math.min(1, channels[channel][i]))
			view.setInt16(
				offset,
				sample < 0 ? sample * 0x8000 : sample * 0x7fff,
				true
			)
			offset += 2
		}
	}

	// Create a Blob with WAV data
	return new Blob([view], { type: "audio/wav" })
}

function writeWAVHeader(
	view,
	sampleRate,
	numOfChannels,
	bitDepth,
	audioBuffer
) {
	/* RIFF identifier */
	view.setUint32(0, 1380533830, false)
	/* file length */
	view.setUint32(4, 36 + audioBuffer.length * numOfChannels * 2, true)
	/* RIFF type */
	view.setUint32(8, 1463899717, false)
	/* format chunk identifier */
	view.setUint32(12, 1718449184, false)
	/* format chunk length */
	view.setUint32(16, 16, true)
	/* sample format (raw) */
	view.setUint16(20, 1, true)
	/* channel count */
	view.setUint16(22, numOfChannels, true)
	/* sample rate */
	view.setUint32(24, sampleRate, true)
	/* byte rate (sample rate * block align) */
	view.setUint32(28, (sampleRate * numOfChannels * bitDepth) / 8, true)
	/* block align (channel count * bytes per sample) */
	view.setUint16(32, (numOfChannels * bitDepth) / 8, true)
	/* bits per sample */
	view.setUint16(34, bitDepth, true)
	/* data chunk identifier */
	view.setUint32(36, 1684108385, false)
	/* data chunk length */
	view.setUint32(40, audioBuffer.length * numOfChannels * 2, true)
}

