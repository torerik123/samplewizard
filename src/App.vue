<template>
	<v-app>
		<div
			style="height: 100%;"
			class="bg-cyan-lighten-2 d-flex align-center"
		>
			<v-sheet
				v-if="user"
				width="400"
				class="pa-5 align-items-center"
				color="transparent"
			>
				<v-row 
					dense 
					no-gutters
					class="pb-3"
				>
					<v-col>
						<v-card-title>SampleWizard</v-card-title>
						<v-card-title>{{ message }}</v-card-title>
					</v-col>
				</v-row>
				<v-row 
					dense 
					no-gutters
				>	
					<v-spacer />
					<v-col cols="auto">
						<v-btn
							v-if="!isRecording && !audioSrc"
							prepend-icon="mdi-radiobox-marked"
							class="elevation-0"
							size="x-large"
							@click="setRecordingStatus('start-recording')"
						>
							<template #prepend>
								<v-icon 
									icon="mdi-radiobox-marked"
									color="red"
								/>
							</template>
							Record
						</v-btn>
						<v-btn
							v-if="isRecording && !audioSrc"
							prepend-icon="mdi-stop"
							class="elevation-0"
							size="x-large"
							@click="setRecordingStatus('stop-recording')"
						>
							Stop recording
						</v-btn>
					</v-col>
					<v-spacer />
				</v-row>
		

				<!-- Playback  -->
				<v-row 
					v-if="audioSrc"
					dense
					no-gutters
					class="flex-nowrap"
				>
					<v-col>
						<audio 
							id="recording" 
							controls="true"
							:src="audioSrc"
							type="audio/wav"
							class="mb-5"
						/>
					</v-col>

					<!-- Delete  -->
					<v-col
						cols="auto"
						class="pl-3"
					>
						<v-btn
							icon="mdi-trash-can"
							class="elevation-0"
							@click="audioSrc = null"
						/>
					</v-col>
				</v-row>

				<!-- Download  -->
				<v-row 
					v-if="audioSrc"
					dense
				>
					<v-col 
						cols="auto"
						class="py-0"
					>
						<v-btn
							style="height: 100%;" 
							text="Download"
							class="elevation-0"
							prepend-icon="mdi-download-outline"
							size="x-large"
							color="success"
							@click="downloadFile"
						/>
					</v-col>
					<v-col 
						cols="" 
						class="py-0"
					>
						<v-select
							:v-model="audioFormat"
							:model-value="audioFormat"
							:items="['WAV', 'MP3', 'WEBM']"
							hide-details
							label="Format"
							variant="solo"
							flat
							class="elevation-0"
							color="success"
						/>
					</v-col>	
				</v-row>			
			</v-sheet>
			
			<!-- Log in  -->
			<v-sheet 
				v-else
				color="transparent"
				width="400"
				class="pa-8"
			>
				<v-card-text class="text-body-1">
					You are not logged in.
				</v-card-text>

				<v-btn 
					class="elevation-0"
					size="x-large"
					@click="login"
				>
					Log in
				</v-btn>
			</v-sheet>
		</div>
	</v-app>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import ExtPay from "../ExtPay.js"
import { FFmpeg } from '@ffmpeg/ffmpeg'
import * as toWav from "audiobuffer-to-wav"
// import { fetchFile, toBlobURL } from '@ffmpeg/util'

// TODO 
const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm'

const message = ref('Click Start to Transcode')

const base64ToBlob = (base64, mimeType) => {
    const bytes = atob(base64.split(',')[1]);
    let { length } = bytes;
    const out = new Uint8Array(length);

    while (length--) {
        out[length] = bytes.charCodeAt(length);
    }

    return new Blob([out], { type: mimeType });
}

const transcode = async (base64AudioData) => {
	// TODO => error handling
	// Convert base64 string to blob for transcoding 
	const audioBlob = base64ToBlob(base64AudioData, 'audio/webm');
	const audioUrl = URL.createObjectURL(audioBlob);

	// Decode the audio data from WebM into a raw audio format that can be manipulated or re-encoded.
	const audioContext = new (window.AudioContext || window.webkitAudioContext)()
	const audioSource = audioContext.createBufferSource()
	
	const response = await fetch(audioUrl)
	const buffer = await response.arrayBuffer()
	const decodedAudio = await audioContext.decodeAudioData(buffer)
	audioSource.buffer = decodedAudio

	// TODO 
	// MP3 
	// const mp3Encoder = new lamejs.Mp3Encoder(1, 44100, 320)
	// const mp3Blob = new Blob(mp3Packets, { type: 'audio/mp3' });
	// const mp3Url = URL.createObjectURL(mp3Blob);
	// console.warn("__MP3", mp3Url)


	// Cleanup
	// URL.revokeObjectURL(audioUrl)
	// URL.revokeObjectURL(mp3Url)

	// WAV 
	const wav = toWav(decodedAudio)  // using the audiobuffer-to-wav library
	const wavBlob = new Blob([new Uint8Array(wav)], { type: 'audio/wav' })
	const wavUrl = URL.createObjectURL(wavBlob)
	return wavUrl
	// Transcode to MP3/WAV with FFmpeg???
	const ffmpeg = new FFmpeg()

	const originalFile = await fetchFile(audioSource.buffer)
	console.warn(originalFile)
	message.value = 'Loading ffmpeg-core.js'
	
	ffmpeg.on('log', message  => {
		message.value = message
	})

	await ffmpeg.load()

	console.warn("--LOADED", ffmpeg)
	message.value = 'Start transcoding'

	await ffmpeg.writeFile('test.webm', await fetchFile(originalFile))
	await ffmpeg.exec(['-i', 'test.webm', 'test.mp3'])

	message.value = 'Complete transcoding'

	const data = await ffmpeg.readFile('test.mp3')

	const transcodedAudio = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mp3' }))

	console.log("--TRANSCODED => ", transcodedAudio)
}


const extpay = ExtPay('samplewizard')
const audioSrc = ref(false)
const user = ref(false)
const isRecording = ref(false)
const audioFormat = ref("WAV")

const login = () => {
	extpay.openPaymentPage()
}

onMounted( async () => {
	const authUser = await extpay.getUser()

	if (authUser?.paid) {	
		user.value = authUser
	}
	 
	chrome.runtime.onMessage.addListener(async(message) => { 
		if (message.type === "recording-saved") {
			const id = message.data.id
			const result = await chrome.storage.local.get(["recording_" + id])
			audioSrc.value = result["recording_" + id]	
		}
	})

	const existingContexts = await chrome.runtime.getContexts({});
	const offscreenDocument = existingContexts.find(
		(c) => c.contextType === 'OFFSCREEN_DOCUMENT'
	)

	isRecording.value = offscreenDocument?.documentUrl?.endsWith('#recording')

	// TODO => Clears recorded audio if window is closed before download
})

const setRecordingStatus = async (status) => {
	isRecording.value = status === "start-recording" ? true : false 

	chrome.runtime.sendMessage({
		type: status
	})
}

const downloadFile = async  () => {
	// TODO => Convert webm to mp3/wav
	const blob = dataURIToBlob(audioSrc.value)
	const file = await transcode(audioSrc.value)

	chrome.downloads.download({	url: file })
	// chrome.downloads.download({	url: audioSrc.value })
	console.log("File downloaded!")
}	

const dataURIToBlob = (dataURI) => {
	// https://gist.github.com/fupslot/5015897
	// Convert base64 string to blob so we can transcode to wav/mp3
    dataURI = dataURI.replace(/^data:/, '');

    const type = dataURI.match(/image\/[^;]+/);
    const base64 = dataURI.replace(/^[^,]+,/, '');
    const arrayBuffer = new ArrayBuffer(base64.length);
    const typedArray = new Uint8Array(arrayBuffer);

    for (let i = 0; i < base64.length; i++) {
        typedArray[i] = base64.charCodeAt(i);
    }

    return new Blob([arrayBuffer], {type});
}

</script>

<style>
#app {
	margin: 0px;
	padding: 0px;
}

.logo {
	height: 6em;
	padding: 1.5em;
	will-change: filter;
	transition: filter 300ms;
}

.logo:hover {
	filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
	filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
