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
					<!-- cols="auto" -->
					<v-col 
						class="py-0"
					>
						<v-btn
							text="Download"
							class="elevation-0"
							prepend-icon="mdi-download-outline"
							size="x-large"
							color="success"
							block
							:loading="isTranscodingAudio"
							@click="downloadFile"
						/>
					</v-col>
					<!-- TODO => OPTION TO CONVERT TO MP3 -->

					<!-- 
					<v-col 
						cols="" 
						class="py-0"
					>
						<v-select
							v-model="selectedAudioFormat"
							:items="audioFormats"
							item-title="title"
							item-value="value"
							hide-details
							label="Format"
							variant="solo"
							flat
							class="elevation-0"
							color="success"
						/>
					</v-col>
					-->	
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
import ExtPay from "../Extpay.js"
import audioBufferToWav from "audiobuffer-to-wav"

// Auth + Payment
const extpay = ExtPay('samplewizard')
const user = ref(false)

// Audio
const audioFormats = ref(["WAV", "MP3"])
const audioSrc = ref(false)
const isRecording = ref(false)
const isTranscodingAudio = ref(false)
const selectedAudioFormat = ref("WAV")

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
	try {
		const file = await transcode(audioSrc.value, selectedAudioFormat.value)
		chrome.downloads.download({	url: file })
		console.log("File downloaded!")
	} catch (error) {
		console.log(error)
		alert("Something went wrong, please try again later")
	}
}

const transcode = async (base64AudioData, outputFormat) => {
	isTranscodingAudio.value = true

	if (!outputFormat) {
		throw Error("Missing output audio format")
	}

	let transcodedAudio = null 
	
	try {
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

		// WAV 
		const wav = audioBufferToWav(decodedAudio)
		const wavBlob = new Blob([new Uint8Array(wav)], { type: 'audio/wav' })
		transcodedAudio = URL.createObjectURL(wavBlob)

		if (outputFormat === "MP3") {
			// TODO 
		}
	} catch (error) {
		console.log(error)
		return error
	} finally {
		isTranscodingAudio.value = false
	}
	console.warn("FILE:", transcodedAudio)
	return transcodedAudio
}

const base64ToBlob = (base64, mimeType) => {
    const bytes = atob(base64.split(',')[1]);
    let { length } = bytes;
    const out = new Uint8Array(length);

    while (length--) {
        out[length] = bytes.charCodeAt(length);
    }

    return new Blob([out], { type: mimeType });
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
