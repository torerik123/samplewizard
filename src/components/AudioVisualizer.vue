<template>
	<v-row 
		dense 
		class="mb-2"
	>
		<v-col>
			<v-sheet
				class="rounded-lg bg-grey-darken-4"
			>
				<div 
					id="waveform" 
					ref="wavesurfer" 
				/>
			</v-sheet>
		</v-col>
	</v-row>

	<v-row 
		dense 
	>
		<v-col cols="auto">
			<v-btn
				:append-icon="isPlaying ? 'mdi-pause' : 'mdi-play'"
				class="elevation-0"
				:text="isPlaying ? 'Pause' : 'Play'"
				@click="togglePlay"
			/>
		</v-col>
		<v-spacer></v-spacer>
		<v-col cols="auto">
			<v-btn
				append-icon="mdi-trash-can"
				class="elevation-0"
				text="delete"
				@click="$emit('delete')"
			/>
		</v-col>
	</v-row>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import WaveSurfer from 'wavesurfer.js'

const wavesurfer = ref(null)
const isPlaying = ref(false)

const props = defineProps({
	src: {
		type: String,
		required: true
	},
	waveColor: {
		type: String,
		required: false,
		default: '#FFF'
	},
	progressColor: {
		type: String,
		required: true,
		default: '#e255a1',
	},
})

const emits = defineEmits(["delete"])

onMounted(() => {
	nextTick(() => {
		wavesurfer.value = WaveSurfer.create({
			container: '#waveform',
			height: 80,
			waveColor: props.waveColor,
			progressColor: props.progressColor,
			url: props.src
		})
	})
})

const togglePlay = () => {
	if (isPlaying.value) {
		wavesurfer.value.pause()
		isPlaying.value = false
	} else {
		wavesurfer.value.play()
		isPlaying.value = true
	}
}
</script>
