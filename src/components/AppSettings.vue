<template>
	<div>
		<!-- <v-card-title class="text-start">Recording</v-card-title> -->
		<v-switch 
			v-model="tabIsDefaultSampleName"
			label="Use tab title as default sample name"
			hide-details
			:color="highlightColor"
		/>

		<v-switch 
			v-model="mutePlayingTab"
			label="Mute playing tab"
			hide-details
			:color="highlightColor"
		/>

		<v-switch 
			v-model="trimSilence"
			label="Auto trim silence"
			hide-details
			:color="highlightColor"
		/>

		<!-- Save / Cancel  -->
		<v-row 
			v-if="settingsChanged"
			dense 
			class="mb-2"
		>
			<v-col>
				<v-btn 
					@click="updateSettings"
					block
					text="Save"
					:color="highlightColor"
					prepend-icon="mdi-check"
					:loading="savingSettings"
				/>
			</v-col>
			<v-col>
				<v-btn 
					@click="resetSettings"
					text="Cancel"
					prepend-icon="mdi-cancel"
					block
				/>
			</v-col>
		</v-row>
		<v-sheet color="transparent">
			<v-btn 
				text="Manage subscription"
				class="rounded-lg"
				@click="manageSubscription"
				block
				size="large"
			/>
		</v-sheet>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useUtils } from '../composables/useUtils'
import { useRootStore } from '../stores/root'
import { supabase } from '../../supabase/client';
import { storeToRefs } from 'pinia';
import { UserSettings } from '../types/global'

const manageSubscription = () => {
	chrome.runtime.sendMessage({
		type: "manage-subscription"
	})
}

const { user } = storeToRefs(useRootStore())
const { highlightColor } = useUtils()

const tabIsDefaultSampleName = ref<boolean>(false)
const mutePlayingTab = ref<boolean>(false)
const trimSilence = ref<boolean>(false)

const initalState = ref<UserSettings>()
const savingSettings = ref(false)

onMounted(() => {
	initalState.value = {
		tabIsDefaultSampleName: user.value.settings?.tabIsDefaultSampleName ?? false,
		mutePlayingTab: user.value.settings?.mutePlayingTab ?? false,
		trimSilence: user.value.settings?.trimSilence ?? false,
	}

	tabIsDefaultSampleName.value = initalState.value.tabIsDefaultSampleName 
	mutePlayingTab.value = initalState.value.mutePlayingTab 
	trimSilence.value = initalState.value.trimSilence 
})


const settingsChanged = computed(() => {
	const defaultSampleNameChanged = tabIsDefaultSampleName.value !== initalState.value?.tabIsDefaultSampleName
	const mutePlayingTabChanged = mutePlayingTab.value !== initalState.value?.mutePlayingTab
	const trimSilenceChanged = trimSilence.value !== initalState.value?.trimSilence
	return defaultSampleNameChanged || mutePlayingTabChanged || trimSilenceChanged
})

const updateSettings = async () => {
	const settings = {
		tabIsDefaultSampleName: tabIsDefaultSampleName.value,
		mutePlayingTab: mutePlayingTab.value,
		trimSilence: trimSilence.value,
	}

	try {
		savingSettings.value = true
		console.log("Updating settings..")

		const { error } = await supabase
			.from('emails')
			.update({
				settings
			})
			.eq('user_id', user.value.id);  // Ensure to target the correct user

		if (!error) {
			// Update the user settings and initial state to reflect the new settings
			user.value.settings = settings;
			initalState.value = settings
			console.log("Settings updated.")
		} else {
			console.error("Failed to update settings", error);
		}
	} catch (error) {
		console.log("Could not update settings. Please try again later or contact support.")
	} finally {
		savingSettings.value = false
	} 
}

const resetSettings = () => {
	tabIsDefaultSampleName.value = initalState.value.tabIsDefaultSampleName
	mutePlayingTab.value = initalState.value.mutePlayingTab
	trimSilence.value = initalState.value.trimSilence
}
</script>