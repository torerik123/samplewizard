<template>
	<v-sheet class="bg-transparent">
		<v-btn
			v-if="buttonState === 'recording-stopped'"
			prepend-icon="mdi-radiobox-marked"
			class="elevation-0"
			size="x-large"
			data-test="recordButton"
			@click="$emit('setRecordingStatus', 'start-recording')"
		>
			<template #prepend>
				<v-icon 
					icon="mdi-radiobox-marked"
					color="red"
					data-test="recordButtonIcon"
				/>
			</template>
			Start recording
		</v-btn>
		<v-btn
			v-if="buttonState === 'recording-active' "
			prepend-icon="mdi-stop"
			class="elevation-0"
			size="x-large"
			data-test="recordButton"
			@click="$emit('setRecordingStatus', 'stop-recording')"
		>
			Stop recording
		</v-btn>
	</v-sheet>
</template>

<script setup lang="ts">
const emits = defineEmits<{
	(e: "setRecordingStatus"): void
}>()

const props = defineProps({
	buttonState: {
		type: String,
		default: "recording-stopped",
	}
})
</script>