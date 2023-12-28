<template>
	<v-sheet
		v-if="user"
		width="400"
		class="bg-cyan rounded-lg pa-8"
	>
		<v-row dense class="mb-5">
			<v-spacer></v-spacer>
			<v-col>
				<v-btn 
					@click="setRecordingStatus('start-recording')"
					class="elevation-0"
				>
					Start
				</v-btn>
			</v-col>
			<v-col>
				<v-btn 
					@click="setRecordingStatus('stop-recording')"
					class="elevation-0"
				>
					Stop
				</v-btn>
			</v-col>
			<v-spacer></v-spacer>
		</v-row>

		<audio 
			id="recording" 
			controls="true"
			:src="audioSrc"
		/>
		<v-btn v-if="audioSrc" @click="downloadFile">Download</v-btn>
	</v-sheet>
	
	<v-sheet 
		v-else
		width="400"
		class="bg-cyan rounded-lg pa-8"
	>
		<v-card-text class="text-body-1">You are not logged in.</v-card-text>
		<v-btn 
			@click="login"
			class="elevation-0"
		>
			Log in
		</v-btn>
	</v-sheet>
</template>


<script setup>
import { ref, onMounted } from 'vue';
import ExtPay from "../ExtPay.js";

const audioSrc = ref(false)
const user = ref(false)

const extpay = ExtPay('samplewizard')

const login = () => {
	extpay.openPaymentPage()
}

onMounted( async () => {
	const authUser = await extpay.getUser()

	if (authUser?.paid) {
		user.value = authUser
	}
	
	// TODO => Look for saved recordings 
	chrome.runtime.onMessage.addListener(async(message) => { 
		if (message.type === "recording-saved") {
			const id = message.data.id
			const result = await chrome.storage.local.get(["recording_" + id])
			audioSrc.value = result["recording_" + id]	
		}

	})
})

const setRecordingStatus = async (status) => {
	chrome.runtime.sendMessage({
		type: status
	})
}

const downloadFile = () => {
	// TODO => Not playing properly in VLC 
	chrome.downloads.download({	url: audioSrc.value })
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
