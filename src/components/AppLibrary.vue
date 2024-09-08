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
import { createClient } from '@supabase/supabase-js'

// Components
import AudioVisualizer from '../components/AudioVisualizer.vue';

// Types 
import { Database } from "../types/supabasetypes"
import { File, Email } from "../types/global"

const supabase = createClient<Database>(
	'https://pysnzshgeafotwtersgp.supabase.co', 
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c256c2hnZWFmb3R3dGVyc2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUzNjIyMDAsImV4cCI6MjA0MDkzODIwMH0.admFCKfM7V3kdwPbnA_3pONoX9hs_eRvuQubrYOfN0Q' 
)

// TODO
// Get files from bucket with name UUID
// Loading spinner while getting files


// TODO => Move JWT logic to separate file
async function getToken(email: string) : Promise<string> {
	const response = await fetch('https://pysnzshgeafotwtersgp.supabase.co/functions/v1/sign-jwt', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ email }),
	});

	if (response.ok) {
		const { token } = await response.json();
		console.log('JWT Token:', token);
		return token;
	} else {
		const error = await response.json();
		throw new Error(error.message);
	}
}

// getToken('tor_erik_grimen@hotmail.com')
// 	.then(token => {
// 		console.log('JWT Token:', token);
// 		// Save the token in localStorage or send it in requests
// 	})
// 	.catch(error => console.error('Error:', error));


// TODO - set token in localstorage


const extpay = ExtPay('samplewizard')
const highlightColor = ref("#e255a1")

const isLoggedIn = ref<boolean>(false)

const userFiles = ref<File[]>([])

const fetchUserFiles = async (userEmail: string) : Promise<File[]> => {
	// TODO
		// JWT => EMAIL

		// const jwtToken = generateJWT(userEmail)
		// console.log("generated JWT", jwtToken)
		// supabase.auth.setAuth(jwtToken)

	const { data, error } = await supabase
		.from('emails')
		.select(`
		files ( * )
		`)
		.eq("user_email", userEmail)

	if (error) {
		console.error('Error fetching files:', error)
		return []
	}

	return data[0]?.files.length ? data[0].files : []
}


onMounted( async () : Promise<void> => {
	const authUser = await extpay.getUser()

	if (authUser?.paid) {	
		isLoggedIn.value = true

		const files = await fetchUserFiles(authUser.email)
		
		if (files && files.length) {
			userFiles.value = files
		}

		console.log("files -- ", files)
	}
})

const playFile = (fileUrl) => {
	console.log(fileUrl)
}
</script>