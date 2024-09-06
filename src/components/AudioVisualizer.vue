<template>
	<!-- Single file  -->
	<div 
		v-if="variant === 'single-file'"
	>
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
						data-test="waveform" 
					/>
				</v-sheet>
			</v-col>
		</v-row>
	
		<v-row 
			dense 
		>
			<v-spacer />
			<v-col cols="auto">
				<v-btn
					:append-icon="isPlaying ? 'mdi-pause' : 'mdi-play'"
					class="elevation-0"
					:text="isPlaying ? 'Pause' : 'Play'"
					color="success"
					data-test="playButton"
					@click="togglePlay"
				/>
			</v-col>
			<v-col cols="auto">
				<v-btn
					append-icon="mdi-trash-can"
					class="elevation-0"
					text="Delete"
					data-test="deleteButton"
					@click="$emit('delete')"
				/>
			</v-col>
		</v-row>
	</div>

	<!-- Compact/List view  -->
	 <div v-if="variant === 'list'">
		<v-row dense align="center">
			<v-col cols="auto">
				<v-btn 
					@click="togglePlay"
					:icon="isPlaying ? 'mdi-pause' : 'mdi-play'"
					class="elevation-0"
					data-test="playButton"
					size="small" 
					:color="progressColor"
				/>
			</v-col>
			<v-col>
				<v-card-subtitle>{{ title }}</v-card-subtitle>
				<v-sheet>
					<div 
						id="waveform" 
						ref="wavesurfer"
						data-test="waveform" 
					/>
				</v-sheet>
			</v-col>
			<v-col cols="auto">
				<v-row dense no-gutters>
					<v-col cols="auto">									
						<v-btn 
							@click="downloadFileUrl(src)"
							icon="mdi-download" 
							variant="text"
							size="small"
						></v-btn>
					</v-col>
					<v-col cols="auto">
						<v-btn 
							icon="mdi-trash-can" 
							variant="text"
							size="small"
							color="grey"
						></v-btn>
					</v-col>
				</v-row>
			</v-col>
		</v-row>
	 </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import type { Ref } from 'vue';
import WaveSurfer from 'wavesurfer.js'
import { useUtils } from '../composables/useUtils';


// TODO 
// single-file view => Save to library BTN


interface Props {
	src: string,
	waveColor?: string, // Default ???
	progressColor?: string, // Default??
	variant?: "single-file" | "list"
	title?: string,
}

const props = withDefaults(defineProps<Props>(), {
	waveColor: '#FFF',
	progressColor: '#e255a1',
	variant: "single-file",
})

const emit = defineEmits<{
  (e: 'delete'): void
}>()

// Play state
const wavesurfer: Ref<null | object> = ref(null)
const isPlaying: Ref<boolean> = ref(false)

const { downloadFileUrl } = useUtils()

onMounted(() => {
	nextTick(() => {
		wavesurfer.value = WaveSurfer.create({
			container: wavesurfer.value,
			height: props.variant === "single-file" ? 80 : 20	,
			waveColor: props.waveColor,
			progressColor: props.progressColor,
			url: props.src,
			normalize: true,
		})

		wavesurfer.value.on('finish', () => {
			isPlaying.value = false
		})
	})
})

const togglePlay = (): void => {
	if (isPlaying.value) {
		wavesurfer.value.pause()
		isPlaying.value = false
	} else {
		wavesurfer.value.play()
		isPlaying.value = true
	}
}
</script>
