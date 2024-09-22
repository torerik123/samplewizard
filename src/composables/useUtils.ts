import { ref, type Ref } from "vue"
import audioBufferToWav from "audiobuffer-to-wav"
import { supabase } from "../../supabase/client"
import { type File } from "../types/global"
import { useRootStore } from "../stores/root"
import { storeToRefs } from "pinia"

export const useUtils = () => {
	const isTranscodingAudio: Ref<boolean> = ref(false)
	const highlightColor: Ref<string> = ref("#e255a1")

	const getFile = async (pathName: string) : Promise<File | false> => {
		if (!pathName) {
			console.error("Missing params PATHNAME")
			return false
		}

		try {
			// Check store for existing file
			const filename = pathName.split("/").at(-1)
			const { files } = storeToRefs(useRootStore())

			const fileExists = files.value.find(
				(item) => item.name === filename
			)

			if (fileExists) {
				return fileExists
			}

			// Create signed url
			const { data: signedUrlData, error: signedUrlError } =
				await supabase.storage
					.from("uploaded_files")
					.createSignedUrls([pathName], 60)

			if (signedUrlError) {
				console.error("Error generating signed URL", signedUrlError)
				return
			}

			const signedUrl = signedUrlData[0].signedUrl

			const newFile: File = {
				created_at: new Date().toISOString(),
				id: pathName,
				last_accessed_at: new Date().toISOString(),
				name: filename,
				updated_at: new Date().toISOString(),
				url: signedUrl, 
			}

			return newFile
		} catch (error) {
			console.error("Error getting file.")
		}
	}

	interface UploadSuccess {
		success: boolean
		data?: {
			fullPath: string
			id: string
			path: string
		} 
		error?: {
			type?: string
			message: string
			statusCode: string | number
		}
	}
	
	const uploadFile = async (
		blobUrl: string,
		uuid: string,
		sampleName: string
	): Promise<UploadSuccess> => {
		try {
			if (!uuid) {
				throw Error("Missing user id")
			}
			// Fetch the blob and create a file
			const filename = `${sampleName}.wav`
			const response = await fetch(blobUrl)

			if (!response.ok)
				throw new Error("Failed to fetch the file from the blob URL")

			const blob = await response.blob()

			// Transcode to WAV using AudioContext and createWAVBlob
			const audioContext = new (window.AudioContext || window.webkitAudioContext)();
			const arrayBuffer = await blob.arrayBuffer();
			const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

			// Convert the decoded audio buffer to WAV
			const wavBlob = createWAVBlob(audioBuffer);
			const file = new File([wavBlob], filename, { type: "audio/wav" });
			const pathName = `${uuid}/${filename}`

			// Upload file
			const { data, error: uploadError } = await supabase.storage
				.from("uploaded_files")
				.upload(pathName, file, {
					cacheControl: "3600",
					contentType: "audio/wav",
					upsert: false,
				})

			if (uploadError) {
				console.error("Error uploading file:", uploadError)

				return {
					success: false,
					error: {
						message: uploadError.message,
						statusCode: uploadError.statusCode,
					},
				}
			}

			console.log("File uploaded successfully!")
			return { success: true, data }
		} catch (err) {
			console.error("An error occurred:", err)

			// Fallback in case of a caught exception
			return {
				success: false,
				error: {
					type: "ExceptionError",
					message:
						(err as Error).message ||
						"An unexpected error occurred",
					statusCode: "500",
				},
			}
		}
	}
	
	const downloadFile = async (
		audioSrc: string,
		audioFormat: string,
		sampleName?: string
	): Promise<void> => {
		try {
			const file = await transcode(audioSrc, audioFormat)

			if (sampleName) {
				chrome.downloads.download({
					url: file,
					filename: sampleName + `.` + audioFormat,
				})
			} else {
				chrome.downloads.download({ url: file })
			}
			console.log("File downloaded!")
		} catch (error) {
			console.log(error)
			alert("Something went wrong, please try again later")
		}
	}

	const deleteFile = async (sampleName: string, uuid: string) => {
		if (!sampleName || !uuid) {
			console.error("Missing SAMPLENAME or UUID")
			return
		}

		const filePath = `${uuid}/${sampleName}`

		const { error } = await supabase
		.storage
		.from('uploaded_files')
		.remove([filePath])

		if (error) {
			console.log("Error deleting file: ", error)
			return
		}

		console.log("Deleted file: ", sampleName)
	}

	const transcode = async (
		base64AudioData: string,
		outputFormat: string
	): Promise<string> => {
		// Convert base64 string to blob for transcoding
		if (!outputFormat) {
			throw Error("Missing output audio format")
		}

		isTranscodingAudio.value = true
		let transcodedAudio = null

		try {
			const audioBlob = base64ToBlob(base64AudioData, "audio/webm")
			const audioUrl = URL.createObjectURL(audioBlob)

			switch (outputFormat) {
				case "WEBM":
					transcodedAudio = audioUrl
					break
				case "WAV":
					// Decode the audio data from WebM into a raw audio format that can be manipulated or re-encoded.
					const audioContext = new (window.AudioContext ||
						window.webkitAudioContext)()
					const audioSource = audioContext.createBufferSource()

					const response = await fetch(audioUrl)
					const buffer = await response.arrayBuffer()
					const decodedAudio = await audioContext.decodeAudioData(buffer)
				
					audioSource.buffer = decodedAudio

					// Use createWAVBlob to convert decoded audio to WAV format with PCM
					const wavBlob = createWAVBlob(decodedAudio);
					transcodedAudio = URL.createObjectURL(wavBlob);
					// WAV
					// const wav = audioBufferToWav(decodedAudio)
					// const wavBlob = new Blob([new Uint8Array(wav)], {
					// 	type: "audio/wav",
					// })
					// transcodedAudio = URL.createObjectURL(wavBlob)
					break
				case "MP3":
					// TODO
					break
				default:
					break
			}
		} catch (error) {
			console.log(error)
			return error
		}

		isTranscodingAudio.value = false
		return transcodedAudio
	}

	const base64ToBlob = (base64: string, mimeType: string): Blob => {
		const bytes = atob(base64.split(",")[1])
		let { length } = bytes
		const out = new Uint8Array(length)

		while (length--) {
			out[length] = bytes.charCodeAt(length)
		}

		return new Blob([out], { type: mimeType })
	}

	const createWAVBlob = (audioBuffer) => {
		const numOfChan = audioBuffer.numberOfChannels,
			length = audioBuffer.length * numOfChan * 2 + 44,
			buffer = new ArrayBuffer(length),
			view = new DataView(buffer),
			channels = [],
			sampleRate = audioBuffer.sampleRate,
			bitDepth = 16
	
		// Write WAV file header, passing the audioBuffer for length info
		writeWAVHeader(view, sampleRate, numOfChan, bitDepth, audioBuffer)
	
		// Write audio data
		let offset = 44
		for (let i = 0; i < numOfChan; i++) {
			channels.push(audioBuffer.getChannelData(i))
		}
		for (let i = 0; i < audioBuffer.length; i++) {
			for (let channel = 0; channel < numOfChan; channel++) {
				let sample = Math.max(-1, Math.min(1, channels[channel][i]))
				view.setInt16(
					offset,
					sample < 0 ? sample * 0x8000 : sample * 0x7fff,
					true
				)
				offset += 2
			}
		}
	
		// Create a Blob with WAV data
		return new Blob([view], { type: "audio/wav" })
	}
	
	const writeWAVHeader = (
		view,
		sampleRate,
		numOfChannels,
		bitDepth,
		audioBuffer
	) => {
		/* RIFF identifier */
		view.setUint32(0, 1380533830, false)
		/* file length */
		view.setUint32(4, 36 + audioBuffer.length * numOfChannels * 2, true)
		/* RIFF type */
		view.setUint32(8, 1463899717, false)
		/* format chunk identifier */
		view.setUint32(12, 1718449184, false)
		/* format chunk length */
		view.setUint32(16, 16, true)
		/* sample format (raw) */
		view.setUint16(20, 1, true)
		/* channel count */
		view.setUint16(22, numOfChannels, true)
		/* sample rate */
		view.setUint32(24, sampleRate, true)
		/* byte rate (sample rate * block align) */
		view.setUint32(28, (sampleRate * numOfChannels * bitDepth) / 8, true)
		/* block align (channel count * bytes per sample) */
		view.setUint16(32, (numOfChannels * bitDepth) / 8, true)
		/* bits per sample */
		view.setUint16(34, bitDepth, true)
		/* data chunk identifier */
		view.setUint32(36, 1684108385, false)
		/* data chunk length */
		view.setUint32(40, audioBuffer.length * numOfChannels * 2, true)
	}

	return {
		highlightColor,
		isTranscodingAudio,
		downloadFile,
		transcode,
		base64ToBlob,
		uploadFile,
		deleteFile,
		getFile,
		createWAVBlob,
		writeWAVHeader,
	}
}