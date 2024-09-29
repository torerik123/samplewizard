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
	
		<!-- Play / Delete 		 -->
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
	 <div v-if="variant === 'list'" data-test="audioVisualizerListView">
		<v-row 
			dense
			align="center"
		>
			<v-col cols="2">
				<v-btn 
					@click="togglePlay"
					:icon="isPlaying ? 'mdi-pause' : 'mdi-play'"
					class="elevation-0"
					data-test="playButtonList"
					size="small" 
					:color="progressColor"
				/>
			</v-col>
			<v-col cols="7">
				<v-card-subtitle 
					data-test="sampleTitle" 
					class="text-truncate"
				>{{ title }}
				</v-card-subtitle>
				<v-sheet>
					<div 
						id="waveform" 
						ref="wavesurfer"
						data-test="waveform" 
					/>
				</v-sheet>
			</v-col>
			<v-col cols="3">
				<v-row dense no-gutters>
					<v-col cols="auto">									
						<v-btn 
							@click="$emit('download')"
							icon="mdi-download" 
							variant="text"
							size="small"
						></v-btn>
					</v-col>
					<v-col cols="auto">
						<v-btn 
							@click="$emit('delete')"
							icon="mdi-trash-can" 
							variant="text"
							size="small"
							color="grey"
							:loading="isDeletingFile"
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

interface Props {
	src: string,
	waveColor?: string,
	progressColor?: string,
	variant?: "single-file" | "list"
	title?: string,
	isDeletingFile?: boolean,
}

const props = withDefaults(defineProps<Props>(), {
	waveColor: '#FFF',
	progressColor: '#e255a1',
	variant: "single-file",
	isDeletingFile: false,
})

defineEmits<{
  (e: 'delete'): void
  (e: 'download'): void
}>()

// Play state
const wavesurfer: Ref<null | object> = ref(null)
const isPlaying: Ref<boolean> = ref(false)

onMounted(() => {
	nextTick(() => {
		if (wavesurfer.value) {
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
		}
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
