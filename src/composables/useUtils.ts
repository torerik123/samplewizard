import { ref, type Ref } from "vue";
import audioBufferToWav from "audiobuffer-to-wav"

export const useUtils = () => {
	const isTranscodingAudio: Ref<boolean> = ref(false)

	const downloadFile = async (audioSrc: string, audioFormat: string, sampleName?: string) : Promise<void> => {
		try {
			console.log("AUDIOTYPE", typeof audioSrc)
			const file = await transcode(audioSrc, audioFormat)

			if (sampleName) {
				chrome.downloads.download({ url: file, filename: sampleName + `.` + audioFormat })
			} else {
				chrome.downloads.download({ url: file })
			}
			console.log("File downloaded!")
		} catch (error) {
			console.log(error);
			alert("Something went wrong, please try again later");
		}
	};

	const transcode = async (
		base64AudioData: string,
		outputFormat: string
	): Promise<string> => {
		isTranscodingAudio.value = true;
	
		if (!outputFormat) {
			throw Error("Missing output audio format");
		}
	
		let transcodedAudio = null;
	
		try {
			// Convert base64 string to blob for transcoding
			const audioBlob = base64ToBlob(base64AudioData, "audio/webm");
			const audioUrl = URL.createObjectURL(audioBlob);
	
			switch (outputFormat) {
				case "WEBM":
					transcodedAudio = audioUrl;
					break;
				case "WAV":
					// Decode the audio data from WebM into a raw audio format that can be manipulated or re-encoded.
					const audioContext = new (window.AudioContext ||
						window.webkitAudioContext)();
					const audioSource = audioContext.createBufferSource();
	
					const response = await fetch(audioUrl);
					const buffer = await response.arrayBuffer();
					const decodedAudio = await audioContext.decodeAudioData(buffer);
					audioSource.buffer = decodedAudio;
	
					// WAV
					const wav = audioBufferToWav(decodedAudio);
					const wavBlob = new Blob([new Uint8Array(wav)], {
						type: "audio/wav",
					});
					transcodedAudio = URL.createObjectURL(wavBlob);
					break;
				case "MP3":
					// TODO
					break;
				default:
					break;
			}
		} catch (error) {
			console.log(error);
			return error;
		}
	
		isTranscodingAudio.value = false;
		return transcodedAudio;
	};

	const base64ToBlob = (base64: string, mimeType: string) : Blob => {
		const bytes = atob(base64.split(',')[1]);
		let { length } = bytes;
		const out = new Uint8Array(length);
	
		while (length--) {
			out[length] = bytes.charCodeAt(length);
		}
	
		return new Blob([out], { type: mimeType });
	}

	const downloadFileUrl = (url: string) => {
		console.log()
		// 	const { data, error } = await supabase
		//   .storage
		//   .from('avatars')
		//   .download('folder/avatar1.png')
		console.log("TODO")
	}

	const getJwtToken = async (email: string) => {
		try {
			const response = await fetch("https://pysnzshgeafotwtersgp.supabase.co/functions/v1/sign-jwt", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
				},
				body: JSON.stringify({ email }),
			});
	
			if (!response.ok) {
				throw new Error(`Error: ${response.statusText}`);
			}
	
			const data = await response.json();
			return data.token; // The JWT token
		} catch (error) {
			console.error("Failed to get JWT token", error);
			return null;
		}
	}

	return { 
		isTranscodingAudio,
		downloadFile,
		transcode,
		base64ToBlob,
		downloadFileUrl,
		getJwtToken,
	}
}





