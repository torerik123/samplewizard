<template>
	<v-app>
		<div
			style="height: 100%;"
			class="bg-black d-flex align-center"
		>
			<v-sheet
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
						<AppLogo 
							text="SampleWizard"
							:color="highlightColor" 
						/>
					</v-col>
				</v-row>

				<v-row
					dense
					no-gutters
					class="pb-3"
				>
					<v-spacer />
					<v-col>
						<v-tabs
							v-model="activeTab"
							density="compact"
							:color="highlightColor"
							hide-slider
						>
							<v-tab 
								density="compact"
								:value="0"
								text="record"
								prepend-icon="mdi-music-note"
							/>
							<v-tab
								density="compact"
								:value="1"
								text="Library"
								prepend-icon="mdi-file-multiple"
							/>
						</v-tabs>
					</v-col>
					<v-spacer />
				</v-row>
		
				<!-- TODO => Component for recording tab  -->
				<v-window v-model="activeTab" style="padding: 4px;">
					<v-window-item :value="0">
						<!-- Sample Name  -->
						<v-row dense v-if="audioSrc">
							<v-col>
								<v-text-field
									v-model="sampleName"
									clearable
									prepend-inner-icon="mdi-pencil" 
									variant="solo" 
									placeholder="Sample name"
									density="compact"
								></v-text-field>
							</v-col>
						</v-row>

						<!-- Record / Playback  -->
						<v-row 
							dense
							no-gutters
							class="flex-nowrap mb-4"
						>
							<v-col v-if="audioSrc">
								<AudioVisualizer 
									:src="audioSrc"
									@delete="deleteAudio"
								/>
							</v-col>

							<v-col 
								v-else
							>
								<!-- TODO => Show waveform while recording  -->
								<RecordButton
									:button-state="recordBtnState"
									@set-recording-status="setRecordingStatus"
								/>
							</v-col>
						</v-row>

						<!-- TODO => Seperate to own component  -->
						<!-- Download  -->
						<v-row 
							v-if="audioSrc"
							dense
							class="mb-1"
						>
							<v-col 
								class="py-0"
							>
								<v-btn
									style="height: 100%;"
									text="Download"
									class="elevation-0"
									prepend-icon="mdi-download-outline"
									size="x-large"
									:color="highlightColor"
									block
									:loading="isTranscodingAudio"
									@click="downloadFile(audioSrc, selectedAudioFormat, sampleName)"
								/>
							</v-col>
							
							<v-col 
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
									:color="highlightColor"
								/>
							</v-col>
						</v-row>

						<v-row 
							v-if="user && audioSrc"
							dense 
						>
							<v-col cols="auto">
								<v-btn
									@click="saveToLibrary" 
									text="Save to library"
									prepend-icon="mdi-file-multiple"
								/>
							</v-col>
						</v-row>

						<!-- Log in  -->
						<LoginOrSignupBtn
							v-if="showLoginMessage"  
						 	message="To dowload files in WAV format you need a premium account." 
						/>
					</v-window-item>

					<v-window-item :value="1">
						<AppLibrary />
					</v-window-item>
				</v-window>	
			</v-sheet>
		</div>
	</v-app>
</template>


<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Ref, } from 'vue'
import ExtPay from "../ExtPay.js"

// Components
import AudioVisualizer from './components/AudioVisualizer.vue';
import AppLogo from './components/AppLogo.vue';
import AppLibrary from './components/AppLibrary.vue';
import RecordButton from './components/RecordButton.vue';
import LoginOrSignupBtn from "./components/LoginOrSignupBtn.vue"
import { useUtils } from './composables/useUtils.js';
import { c } from 'vite/dist/node/types.d-aGj9QkWt.js';

// Auth + Payment
const extpay = ExtPay('samplewizard')
const user: Ref<object | false> = ref(false)

const showLoginMessage = computed<boolean>(() : boolean => {
	return audioSrc.value && !user.value
})

// Styles
const highlightColor: Ref<string> = ref("#e255a1") // TODO => Make available in other components

interface AudioFormatOption {
	title: string
	value: string
	props?: { 
		disabled?: boolean 
	}
}

// Audio
const audioFormats: Ref<Array<AudioFormatOption>>= ref([
	{
		title: "WEBM",
		value: "WEBM",
	},
	{
		title: "WAV",
		value: "WAV",
		props: { disabled: showLoginMessage }
	},
	// {
	// 	title: "MP3",
	// 	value: "MP3",
	// 	props: { disabled: true }
	// }
])

const { downloadFile, isTranscodingAudio } = useUtils()

const audioSrc: Ref<string> = ref("")
const isRecording: Ref<boolean> = ref(false)
const selectedAudioFormat: Ref<string> = ref("WEBM")
const activeTab: Ref<null | number> = ref(null)
const sampleName = ref<string>("")	

const recordBtnState = computed<string>(() : "recording-active" | "recording-stopped" => {
	if (isRecording.value) {
		return "recording-active"
	} 
	return "recording-stopped"
})

const login = () : void => {
	extpay.openPaymentPage()
}

onMounted( async () : Promise<void> => {
	const authUser = await extpay.getUser()

	if (authUser?.paid) {	
		user.value = authUser
		refreshToken(authUser.email)
	}

	getSavedRecordings()
})

const setRecordingStatus = async (status) : Promise<void> => {
	isRecording.value = status === "start-recording" ? true : false 

	chrome.runtime.sendMessage({
		type: status
	})
}

const deleteAudio = () : void => {
	audioSrc.value = null
	chrome.storage.local.remove(["new_recording"])
}	

const saveToLibrary = () => {
	console.log("TODO")
	// TODO
	// Validation => Must have sample name
	// Upload to bucket corresponding to UUID
}

const getSavedRecordings = async () => {
	// Check for saved recordings on launch
	const savedAudio = await chrome.storage.local.get(["new_recording"])
	
	if (savedAudio.new_recording) {
		audioSrc.value = savedAudio.new_recording
	}

	chrome.runtime.onMessage.addListener(async(message) : Promise<void> => { 
		if (message.type === "recording-saved") {
			const result = await chrome.storage.local.get(["new_recording"])
			audioSrc.value = result["new_recording"]	
		}
	})

	const existingContexts = await chrome.runtime.getContexts({});
	const offscreenDocument = existingContexts.find(
		(c) : boolean => c.contextType === 'OFFSCREEN_DOCUMENT'
	)

	isRecording.value = offscreenDocument?.documentUrl?.endsWith('#recording')
}

const refreshToken = async (email: string) => {
	let { samplewizard_jwt } = await chrome.storage.local.get(["samplewizard_jwt"])

	if (!samplewizard_jwt) {
		const { getJwtToken } = useUtils()
		const newToken = await getJwtToken(email)

		await chrome.storage.local.set({ "samplewizard_jwt": newToken })
		console.log("New token: ", newToken)
		samplewizard_jwt =  newToken
	}

	console.log("Received JWT Token:", samplewizard_jwt);
}
</script>

<style>
#app {
	margin: 0px;
	padding: 0px;
}

button:hover, 
button:hover .v-btn__content {
	border-color: #FFF;
	color: #FFF;
}

.v-tab.v-tab.v-btn {
    min-width: 0px;
}
</style>
