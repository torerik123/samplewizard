<template>
	<v-sheet
		width="400"
		class="bg-cyan rounded-lg pa-8"
	>
		<v-btn @click="setRecordingStatus('start-recording')">
			Start
		</v-btn>
		<v-btn @click="setRecordingStatus('stop-recording')">
			Stop
		</v-btn>

		<p>Recording: {{ recordingStatus }}</p>
		<h1>output</h1>
		{{ audioSrc }}
		<audio 
			id="recording" 
			controls="true"
			:src="audioSrc"
		/>
		<v-btn v-if="audioSrc" @click="downloadFile">Download</v-btn>
		<!-- <a 
			download="audio-file" 
			id="audioRecordDownload" 
			:href="audioSrc"
		>Download audio</a> -->
	</v-sheet>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue';

const recordingStatus = ref(false)
const audioSrc = ref(false)

const setRecordingStatus = async (status) => {
	chrome.runtime.sendMessage({
		type: status
	})
}

const downloadFile = () => {
	chrome.downloads.download({	url: audioSrc.value })
}	

onMounted( async () => {
	chrome.runtime.onMessage.addListener(async(message) => { 
		if (message.type === "recording-saved") {
			const id = message.data.id
			const result = await chrome.storage.local.get(["recording_" + id])
			audioSrc.value = result["recording_" + id]	
		}

	})
})



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
