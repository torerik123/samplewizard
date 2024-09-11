<template>
	<div v-if="isLoggedIn">
		<v-sheet color="transparent" v-if="!userFiles.length">
			<v-card text="You have no saved files." />
		</v-sheet>

		<v-sheet color="transparent" v-else>
			<v-row
				v-for="file in userFiles" 
				:key="file.filename"
				dense
				no-gutters
				align="center"
				class="mb-1"
			>
				<v-col>
					<AudioVisualizer 
						:src="file.file_url"
						variant="list"
						:title="file.filename"
					/>
				</v-col>
			</v-row>
		</v-sheet>
	</div>

	<div v-else>
		<LoginOrSignupBtn message="The library feature is only available to premium users."/>
	</div>
</template>

<script setup lang="ts">
import { ref, type Ref, onMounted } from "vue"
import LoginOrSignupBtn from "../components/LoginOrSignupBtn.vue"
import ExtPay from "../../Extpay.js"
import { supabase } from "../supabase";

// Components
import AudioVisualizer from '../components/AudioVisualizer.vue';
import { useUtils } from "../composables/useUtils";

// TODO
// Get files from bucket with name UUID
// Loading spinner while getting files

const extpay = ExtPay('samplewizard')
const highlightColor = ref("#e255a1")

const isLoggedIn = ref<boolean>(false)

const userFiles = ref<File[]>([])
const jwt = ref()
const { refreshToken, getUserId } = useUtils()

const fetchUserFiles = async (userEmail: string) : Promise<File[]> => {
	// Get UUID
	const user_id = getUserId(userEmail)
	console.log("LIBRARY", user_id)

	return []
	// TODO
		// Move to useUtils 
		// JWT => EMAIL

	// return data[0]?.files.length ? data[0].files : []
}


// TODO => Move JWT logic to separate file


onMounted( async () : Promise<void> => {
	const authUser = await extpay.getUser()

	if (authUser?.paid) {	
		isLoggedIn.value = true
		jwt.value = await refreshToken(authUser.email)

		// TODO => token
		const files = await fetchUserFiles(authUser.email)
		
		if (files && files.length) {
			userFiles.value = files
		}

		// console.log("files -- ", files)
	}
})

const playFile = (fileUrl) => {
	console.log(fileUrl)
}
</script>