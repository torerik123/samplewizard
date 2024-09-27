chrome.runtime.onMessage.addListener(async (message) => {
	if (message.target === "offscreen") {
		switch (message.type) {
			case "start-offscreen-recording":
				startRecording(message.data)
				break
			case "stop-offscreen-recording":
				stopRecording()
				break
			default:
				throw new Error("Unrecognized message:", message.type)
		}
	}
})

let recorder
let data = []

const startRecording = async ({ streamId, tabName, mute, trim }) => {
	if (recorder?.state === "recording") {
		throw new Error("Called startRecording while recording is in progress.")
	}

	const media = await navigator.mediaDevices.getUserMedia({
		audio: {
			mandatory: {
				chromeMediaSource: "tab",
				chromeMediaSourceId: streamId,
			},
		},
		video: false,
	})

	// console.log(media); // Check if stream is obtained correctly
	// Continue to play the captured audio to the user.
	if (!mute) {
		const output = new AudioContext()
		const source = output.createMediaStreamSource(media)
		source.connect(output.destination)
	}

	if (!MediaRecorder.isTypeSupported("video/webm; codecs=opus")) {
		console.error("MediaRecorder does not support the desired codec.");
	}

	// Start recording
	recorder = new MediaRecorder(media, { mimeType: "video/webm; codecs=opus" })
	recorder.ondataavailable = (event) => data.push(event.data)

	recorder.onstop = async () => {
		const blob = new Blob(data, { type: "video/webm; codecs=opus" })

		if (trim) {
			const trimmedBlob = await trimSilenceFromBlob(blob)
			saveRecording(trimmedBlob, tabName)
		} else {
			saveRecording(blob, tabName)
		}

		recorder = undefined // Clear state for next recording
		data = []
	}

	recorder.start()
	window.location.hash = "recording"
}

const stopRecording = async () => {
	if (recorder && recorder.state === "recording") {
		recorder.stop();
	}
	recorder.stop()

	// Stopping the tracks makes sure the recording icon in the tab is removed.
	recorder.stream.getTracks().forEach((t) => t.stop())

	// Update current state in URL
	window.location.hash = ""
}

const trimSilenceFromBlob = async (blob) => {
	// Implement the silence trimming logic here
	const arrayBuffer = await blob.arrayBuffer()
	const audioBuffer = await decodeWebM(arrayBuffer)

	const trimmedAudioBuffer = trimSilence(audioBuffer)

	// Convert the trimmed audio buffer back to Blob
	const trimmedBlob = await encodeWAV(trimmedAudioBuffer)
	return trimmedBlob
}

const trimSilence = (audioBuffer, threshold = 0.01) => {
	const rawAudioData = audioBuffer.getChannelData(0) // Mono audio
	const length = rawAudioData.length

	// Check if there is any audio data - return original if not
	if (length === 0) {
		return audioBuffer
	}

	let start = 0
	let end = length - 1

	while (start < length && Math.abs(rawAudioData[start]) < threshold) {
		start++
	}

	while (end > start && Math.abs(rawAudioData[end]) < threshold) {
		end--
	}

	// If start and end are the same, there is no significant audio
	if (start >= end) {
		return audioBuffer // Return the original buffer if no significant audio is found
	}

	const trimmedLength = end - start + 1
	const trimmedBuffer = new AudioContext().createBuffer(
		audioBuffer.numberOfChannels,
		trimmedLength,
		audioBuffer.sampleRate
	)

	for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
		trimmedBuffer.copyToChannel(
			audioBuffer.getChannelData(channel).subarray(start, end + 1),
			channel
		)
	}

	return trimmedBuffer
}

const decodeWebM = async (arrayBuffer) => {
	const audioContext = new AudioContext()
	const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
	return audioBuffer
}

const encodeWAV = (audioBuffer, sampleRate = 44100, numChannels = 1) => {
	const numFrames = audioBuffer.length;
	const bitDepth = 16; // 16-bit audio
	
	const buffer = new ArrayBuffer(44 + numFrames * numChannels * 2);
	const view = new DataView(buffer);

	// WAV file header
	writeWAVHeader(view, sampleRate, numChannels, bitDepth, audioBuffer);

	// Write PCM data from audioBuffer
	let offset = 44;
	for (let i = 0; i < numFrames; i++) {
		for (let channel = 0; channel < numChannels; channel++) {
			let sample = audioBuffer.getChannelData(channel)[i];
			// Scale sample to 16-bit PCM
			let intSample = Math.max(-1, Math.min(1, sample));
			intSample = (intSample < 0 ? intSample * 0x8000 : intSample * 0x7FFF) | 0;
			view.setInt16(offset, intSample, true);
			offset += 2;
		}
	}

	return new Blob([buffer], { type: 'audio/wav' });
}

const writeWAVHeader = (
	view,
	sampleRate,
	numOfChannels,
	bitDepth,
	audioBuffer
) => {
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

const saveRecording = (blob, tabName) => {
	let reader = new FileReader()
	reader.readAsDataURL(blob)
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
}
