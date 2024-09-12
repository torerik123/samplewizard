<template>
	<v-app>
		<div
			style="height: 100%;"
			class="bg-black d-flex align-start"
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
								<v-form
									ref="form" 
									validate-on="lazy"
								>
									<v-text-field
										v-model="sampleName"
										:rules="nameRules"
										clearable
										prepend-inner-icon="mdi-pencil" 
										variant="solo" 
										placeholder="Sample name"
										density="compact"
									></v-text-field>

								</v-form>
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

						<!-- Upload success / failure -->
						<v-snackbar 
							:timeout="2000"
							close-on-content-click
							timer
							:text="snackbarText"
							v-model="showSnackbar"
							:color="snackbarColor"
						></v-snackbar>

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
import { useUtils } from './composables/useUtils.js';

// Components
import AudioVisualizer from './components/AudioVisualizer.vue';
import AppLogo from './components/AppLogo.vue';
import AppLibrary from './components/AppLibrary.vue';
import RecordButton from './components/RecordButton.vue';
import LoginOrSignupBtn from "./components/LoginOrSignupBtn.vue"
import { c } from 'vite/dist/node/types.d-aGj9QkWt.js';

// Types 
import { type ExtPayUser } from './types/global.js';
// import { File, Email } from "./types/global"

// TODO 
// Set headers when uploading files
// Loading spinner while uploading file to library 
// Save filename to files table, enable tags?
// Supabase StorageError type missing property statusCode?

// Auth + Payment
const extpay = ExtPay('samplewizard')
const jwt = ref()

const user: Ref<ExtPayUser | false> = ref(false)

const showLoginMessage = computed<boolean>(() : boolean => {
	return audioSrc.value && !user.value
})


// Audio
interface AudioFormatOption {
	title: string
	value: string
	props?: { 
		disabled?: boolean 
	}
}

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

const { 
	highlightColor,
	refreshToken, 
	downloadFile, 
	isTranscodingAudio, 
	uploadFile, 
	getUserId,
} = useUtils()

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

// Form 
const form = ref()
const nameRules = ref([
	v => !!v || 'Name is required',
])

onMounted( async () : Promise<void> => {
	const authUser = await extpay.getUser()

	if (authUser?.paid) {
		user.value = authUser
		jwt.value = await refreshToken(authUser.email)
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

// Show snackbar on upload success/error 
const snackbarText = ref("Saved to library!")
const snackbarColor = ref<"success" | "error">("success")
const showSnackbar = ref<boolean>(false)

const saveToLibrary = async () => {
	const { valid } = await form.value.validate()
	console.log("saving - " + sampleName.value)

	if (valid && 
		user.value && 
		typeof user.value.email === 'string' && 
		audioSrc.value
	) {
		const authHeader = `Bearer ${jwt.value}`
		console.log("GETTING authHeader", authHeader)

		// TODO => Set JWT when making request
		// const session = { access_token: authHeader }
		// supabase.auth.setSession(session)

		const user_id = await getUserId(user.value.email)
		const { error } = await uploadFile(audioSrc.value, user_id, sampleName.value)

		if (error) {
			showSnackbar.value = true
			snackbarColor.value = "error"

			if (error.statusCode === "409") {
				snackbarText.value = "A file with that name already exists."
			} else {
				snackbarText.value = "Upload failed! Please try again later or contact support."
			}
		} else {
			// Success
			showSnackbar.value = true
			snackbarColor.value = "success"
			snackbarText.value = "Saved to library!"
		}		
	}
	
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

const login = () : void => {
	extpay.openPaymentPage()
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
