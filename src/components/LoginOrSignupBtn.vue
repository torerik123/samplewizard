<template>
	<v-row 
		dense 
	>
		<v-col class="pa-0">
			<v-btn
				variant="outlined"
				:color="highlightColor"
				block
				@click="manageSubscription"
			>
				Log in/register
			</v-btn>
		</v-col>
		<v-col cols="12">
			<p 
				v-if="message"
				class="mb-2 text-caption"
				data-test="loginBtnMessage" 
			>
				{{ message }} 
			</p>
		</v-col>
	</v-row>
</template>

<script setup lang="ts">
import { useUtils } from "../composables/useUtils.js";

const props = defineProps<{
	message?: string
}>()

const { highlightColor } = useUtils()


const manageSubscription = () => {
	chrome.runtime.sendMessage({
		type: "manage-subscription"
	})
}
</script>