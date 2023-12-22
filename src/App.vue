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
		<audio 
			id="recording" 
			controls="true"
			:src="audioSrc"
		/>
	</v-sheet>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue';

const recordingStatus = ref(false)
const audioSrc = ref(false)

const setRecordingStatus = async (status) => {
	chrome.runtime.sendMessage({
		event: status
	})
}

// TODO => Watch localstorage for changes??? 
onMounted( async () => {
	const result = await chrome.storage.local.get(["recordedFile"])
	audioSrc.value = result.recordedFile
})

console.log(chrome.storage.local.get(["recordedFile"]))
// const savedRecording = computed(() => {
// 	const result = 
// 	return null
// })
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
