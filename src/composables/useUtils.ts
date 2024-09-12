import { ref, type Ref } from "vue"
import audioBufferToWav from "audiobuffer-to-wav"
import { supabase } from "../supabase"
import type { StorageError } from "@supabase/storage-js"

export const useUtils = () => {
	const isTranscodingAudio: Ref<boolean> = ref(false)
	const highlightColor: Ref<string> = ref("#e255a1")

	const getUserId = async (email: string): Promise<string> => {
		// Get UUID
		let {
			data: { user_id },
			error,
		} = await supabase
			.from("emails")
			.select("user_id")
			.eq("user_email", email)
			.single()

		if (error) {
			console.log(error)
		}

		if (!user_id) {
			console.warn("User not found.")
			return ""
		}
		return user_id
	}

	const downloadFile = async (
		audioSrc: string,
		audioFormat: string,
		sampleName?: string
	): Promise<void> => {
		try {
			console.log("AUDIOTYPE", typeof audioSrc)
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

	interface UploadSuccess {
		success: boolean
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
			// Fetch the blob and create a file
			const filename = `${sampleName}.wav`
			const response = await fetch(blobUrl)

			if (!response.ok)
				throw new Error("Failed to fetch the file from the blob URL")

			const blob = await response.blob()
			const file = new File([blob], filename, { type: "audio/wav" })
			const pathName = `${uuid}/${filename}`

			// Upload file
			const { error: uploadError } = await supabase.storage
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
			return { success: true }
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

	const transcode = async (
		base64AudioData: string,
		outputFormat: string
	): Promise<string> => {
		isTranscodingAudio.value = true

		if (!outputFormat) {
			throw Error("Missing output audio format")
		}

		let transcodedAudio = null

		try {
			// Convert base64 string to blob for transcoding
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
					const decodedAudio = await audioContext.decodeAudioData(
						buffer
					)
					audioSource.buffer = decodedAudio

					// WAV
					const wav = audioBufferToWav(decodedAudio)
					const wavBlob = new Blob([new Uint8Array(wav)], {
						type: "audio/wav",
					})
					transcodedAudio = URL.createObjectURL(wavBlob)
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

	const getJwtToken = async (email: string) => {
		// Get JWT token from supabase edge function
		try {
			const response = await fetch(
				"https://pysnzshgeafotwtersgp.supabase.co/functions/v1/sign-jwt",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${
							import.meta.env.VITE_SUPABASE_ANON_KEY
						}`,
					},
					body: JSON.stringify({ email }),
				}
			)

			if (!response.ok) {
				throw new Error(`Error: ${response.statusText}`)
			}

			const data = await response.json()
			return data.token
		} catch (error) {
			console.error("Failed to get JWT token", error)
			return null
		}
	}

	const refreshToken = async (email: string) => {
		// Check for existing token => if not => get new token

		// TODO => Check if token is valid
		let { samplewizard_jwt } = await chrome.storage.local.get([
			"samplewizard_jwt",
		])

		if (!samplewizard_jwt) {
			const newToken = await getJwtToken(email)

			await chrome.storage.local.set({ samplewizard_jwt: newToken })
			console.log("New token: ", newToken)
			samplewizard_jwt = newToken
		}

		console.log("Received JWT Token:", samplewizard_jwt)

		return samplewizard_jwt
	}

	return {
		highlightColor,
		isTranscodingAudio,
		downloadFile,
		transcode,
		base64ToBlob,
		getJwtToken,
		uploadFile,
		refreshToken,
		getUserId,
	}
}
