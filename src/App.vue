<template>
	<v-sheet width="400" class="bg-cyan rounded-lg pa-8">
		<v-btn @click="start">
			Start
		</v-btn>
		<v-btn @click="stop">
			Stop
		</v-btn>

		<p>Recording: {{  recordingStatus }}</p>
		<h1>output</h1>
		<audio 
			id='recording' 
			controls='true'
			:src="audioSrc"
		></audio>
	</v-sheet>
</template>


<script setup>
import { ref, onMounted } from 'vue';

const mediaRecorder = ref(null)
const recordingStatus = ref(false)
const chunks = ref([])
const audioSrc = ref(false)

const start = async () => {
	chrome.runtime.sendMessage({
		event: "start-recording"
	})
}

const stop = () => {
	chrome.runtime.sendMessage({
		event: "stop-recording"
	})
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
