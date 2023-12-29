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
					<v-spacer></v-spacer>
					<v-col cols="auto">
						<v-btn
							v-if="!isRecording && !audioSrc"
							prepend-icon="mdi-radiobox-marked"
							@click="setRecordingStatus('start-recording')"
							class="elevation-0"
							size="x-large"
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
							@click="setRecordingStatus('stop-recording')"
							prepend-icon="mdi-stop"
							class="elevation-0"
							size="x-large"
						>
							Stop recording
						</v-btn>
					</v-col>
					<v-spacer></v-spacer>
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
					<v-col cols="auto" class="pl-3">
						<v-btn
							@click="audioSrc = null"
							icon="mdi-trash-can"
							class="elevation-0"
						/>
					</v-col>
				</v-row>

				<!-- Download  -->
				<v-row 
					v-if="audioSrc"
					dense
				>
					<v-col>
						<v-btn 
							@click="downloadFile"
							text="Download"
							class="elevation-0"
							prepend-icon="mdi-download-outline"
							size="x-large"
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
				<v-card-text class="text-body-1">You are not logged in.</v-card-text>

				<v-btn 
					@click="login"
					class="elevation-0"
					size="x-large"
				>
					Log in
				</v-btn>
			</v-sheet>
		</div>
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
	// TODO => Convert webm to mp3/wav

	// TODO => Not playing properly in VLC => missing audio codec?
	// set bitrate, author url? 
	chrome.downloads.download({	url: audioSrc.value })
	console.log("downloaded file", audioSrc.value)
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
