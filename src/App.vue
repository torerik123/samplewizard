<template>
	<v-app>
		<v-sheet
			v-if="user"
			width="400"
			class="bg-cyan pa-8"
		>
			<v-row dense class="mb-5">
				<v-spacer></v-spacer>
				<v-col>
					<v-btn 
						v-if="!isRecording"
						prepend-icon="mdi-radiobox-marked"
						@click="setRecordingStatus('start-recording')"
						class="elevation-0"
						size="large"
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
						v-if="isRecording"
						@click="setRecordingStatus('stop-recording')"
						prepend-icon="mdi-stop"
						class="elevation-0"
						size="large"
					>
						Stop recording
					</v-btn>
				</v-col>
				<v-spacer></v-spacer>
			</v-row>
	
			<audio 
				id="recording" 
				controls="true"
				:src="audioSrc"
				class="mb-5"
			/>

			<!-- Download  -->
			<v-btn 
				v-if="audioSrc" 
				@click="downloadFile"
				text="Download"
				class="elevation-0"
				prepend-icon="mdi-download-outline"
				size="large"
				color=""
			/>
		</v-sheet>
		
		<v-sheet 
			v-else
			width="400"
			class="bg-cyan pa-8"
		>
			<v-card-text class="text-body-1">You are not logged in.</v-card-text>
			<v-btn 
				@click="login"
				class="elevation-0"
			>
				Log in
			</v-btn>
		</v-sheet>
	</v-app>
</template>


<script setup>
import { ref, onMounted } from 'vue';
import ExtPay from "../ExtPay.js";

const extpay = ExtPay('samplewizard')
const audioSrc = ref(false)
const user = ref(false)
const isRecording = ref(false)

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
	isRecording.value = status === "start-recording" ? true : false 

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
