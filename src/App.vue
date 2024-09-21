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
							<v-tab
								v-if="user?.paid" 
								density="compact"
								:value="2"
								text="Settings"
								prepend-icon="mdi-cog"
							/>
						</v-tabs>
					</v-col>
					<v-spacer />
				</v-row>
		
				<!-- TODO => Component for recording tab  -->
				<v-window v-model="activeTab" style="padding: 4px;">
					<!-- TODO => Seperate to own component  -->
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
									@toggle-recording-status="toggleRecordingStatus"
								/>
							</v-col>
						</v-row>

						<!-- Download  -->
						<v-row 
							v-if="audioSrc"
							dense
							class="mb-3"
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
							v-if="audioSrc && user?.paid"
							dense
						>
							<v-col>
								<v-btn
									@click="saveToLibrary" 
									text="Save to library"
									prepend-icon="mdi-file-multiple"
									block
									:loading="isSavingToLibrary"
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
						 	message="You don't have an active subscription. Log in or register to enable WAV downloads and library." 
						/>
					</v-window-item>

					<!-- Library  -->
					<v-window-item :value="1">
						<AppLibrary />
					</v-window-item>

					<!-- Settings  -->
					<v-window-item
						v-if="user?.paid" 
						:value="2"
					>
						<AppSettings/>
					</v-window-item>
				</v-window>	
			</v-sheet>
		</div>
	</v-app>
</template>


<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Ref, } from 'vue'
import { useUtils } from './composables/useUtils.js';
import { initSupabase, supabase } from "../supabase/client"

// Components
import AudioVisualizer from './components/AudioVisualizer.vue';
import AppLogo from './components/AppLogo.vue';
import AppLibrary from './components/AppLibrary.vue';
import AppSettings from './components/AppSettings.vue';
import RecordButton from './components/RecordButton.vue';
import LoginOrSignupBtn from "./components/LoginOrSignupBtn.vue"

import { useRootStore } from './stores/root.js';
import { storeToRefs } from 'pinia'

import { AudioFormatOption } from './types/global';
import { useAuth } from './composables/useAuth.js'

// TODO 
// Save filename to files table, enable tags?

// User data + files
const { 
	user,
	files,
 } = storeToRefs(useRootStore())

 const { 
	fetchUserFiles,
 } = useRootStore()

 const { refreshToken, getUserId} = useAuth()

 const { 
	highlightColor,
	downloadFile, 
	isTranscodingAudio, 
	uploadFile, 
	getFile,
} = useUtils()

const showLoginMessage = computed<boolean>(() : boolean => {
	return audioSrc.value && !user.value?.paid
})

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

const audioSrc = ref<string>("")
const isRecording = ref<boolean>(false)
const selectedAudioFormat = ref<string>("WEBM")
const activeTab = ref<null | number> (null)
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
  v => /^[a-zA-Z0-9._-]+$/.test(v) || 'Invalid characters in name. Only letters, numbers, dots (.), hyphens (-), and underscores (_) are allowed. Slashes (/) are not allowed.',
])

onMounted( async () : Promise<void> => {
	// Get recent recording from locolStorage
	getSavedRecordings()

	// Set extpay user data + get JWT
	chrome.runtime.sendMessage({
		type: "fetch-user",
	})

	// Update user data after payment / login
	chrome.runtime.onMessage.addListener(async(message) : Promise<void> => {
		if (message.type === "set-user-data") {
			if (message?.data) {
				setUserData(message.data)
			}
		}

		if (message.type === "user-paid") {
			console.log("received message!", message)
			setUserData(message.data)
			createSupabaseUser(message.data.email)
		}
	})
})

const createSupabaseUser = async (email) => {
	try {
		if (!supabase) {
			const token = await refreshToken(email)
			await initSupabase(token)
		}

		// Check if user exists
		let { data: existingEmail } = await supabase
		.from("emails")
		.select("user_email")
		.eq("user_email", email)

		if (!existingEmail.length) {
			// Create supabase user id after registering
			const { data, error } = await supabase
			.from('emails')
			.insert([
			{ user_email: email, },
			])
			.select()
		} 
	} catch (error) {
		console.log("ERROR creating user", error)
	}
}

const setUserData = async (extpay_user) => {
	user.value = extpay_user
	const token = await refreshToken(user.value.email)

	// Initialize supabase with JWT 
	if (token) {
		await initSupabase(token)

		// Set user data
		const { user_id, settings} = await getUserId(user.value.email)
		
		user.value.id = user_id
		user.value.token = token
		user.value.settings = settings 
		
		if (user.value?.paid) {
			selectedAudioFormat.value = "WAV"
			fetchUserFiles(user_id)
		}
	}
}

const toggleRecordingStatus = async (status) : Promise<void> => {
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
const snackbarText = ref<string>("Saved to library!")
const snackbarColor = ref<"success" | "error">("success")
const showSnackbar = ref<boolean>(false)

const isSavingToLibrary = ref<boolean>(false)

const saveToLibrary = async () => {
	const { valid } = await form.value.validate()
	console.log("saving - " + sampleName.value)

	if (valid && 
		user.value && 
		typeof user.value.email === 'string' && 
		audioSrc.value
	) {
		isSavingToLibrary.value = true   
		const { data, error } = await uploadFile(audioSrc.value, user.value.id, sampleName.value)

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

			if (data?.path) {
				// Fetch new file => add to files
				const newFile = await getFile(data.path)

				if (newFile) [
					files.value.push(newFile) 
				]
			}
		}		
		isSavingToLibrary.value = false
	}
	
}

const getSavedRecordings = async () => {
	// Check for saved recordings on launch
	const savedAudio = await chrome.storage.local.get(["new_recording"])
	
	if (savedAudio.new_recording) {
		audioSrc.value = savedAudio.new_recording.recording
		sampleName.value = savedAudio.new_recording?.tabName ? sanitizeFilename(savedAudio.new_recording.tabName) : ""
	}

	chrome.runtime.onMessage.addListener(async(message) : Promise<void> => { 
		if (message.type === "recording-saved") {
			const result = await chrome.storage.local.get(["new_recording"])
			const data = result["new_recording"]
			audioSrc.value = data.recording

			// TODO && Setting for default name enabled
			if (data?.tabName.length) {
				sampleName.value = sanitizeFilename(data.tabName)
			} 
		}
	})

	const existingContexts = await chrome.runtime.getContexts({});
	const offscreenDocument = existingContexts.find(
		(c) : boolean => c.contextType === 'OFFSCREEN_DOCUMENT'
	)

	isRecording.value = offscreenDocument?.documentUrl?.endsWith('#recording')
}

const sanitizeFilename = (filename: string): string => {
	return filename
    // Replace disallowed characters (including slashes) with an underscore
    .replace(/[^a-zA-Z0-9-_.]/g, '_')
    // Optionally, convert to lowercase for consistency
    // .toLowerCase();
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
