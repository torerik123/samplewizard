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

onMounted(() => {
	if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  		console.log("getUserMedia supported.");
		navigator.mediaDevices
			.getUserMedia({ audio: true, })
			.then((stream) => {
				mediaRecorder.value = new MediaRecorder(stream);
				mediaRecorder.value.onstop = (e) => {
					console.log("recorder stopped");

					// TODO => Set audio format 
					const blob = new Blob(chunks.value, { type: "audio/ogg; codecs=opus" });
					console.log(blob)
					chunks.value = [];
					audioSrc.value = window.URL.createObjectURL(blob);
				};
			})
			// Error callback
			.catch((err) => {
				console.error(`The following getUserMedia error occurred: ${err}`);
			});
	} else {
		console.log("getUserMedia not supported on your browser!");
	}
})

const start = () => {
	recordingStatus.value = true
	mediaRecorder.value.start()
	console.log(mediaRecorder.value.state);
	console.log("recorder started");

	mediaRecorder.value.ondataavailable = (e) => {
		chunks.value.push(e.data);
	}
}

const stop = () => {
	recordingStatus.value = false
	mediaRecorder.value.stop()
  	console.log(mediaRecorder.value.state)
  	console.log("recorder stopped")
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
