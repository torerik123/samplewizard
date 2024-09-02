<template>
	<v-row 
		dense 
	>
		<v-col class="pa-0">
			<p class="mb-2 text-caption" v-if="message">
				{{ message }} 
			</p>
			
			<v-btn
				variant="outlined"
				:color="highlightColor"
				block
				@click="login"
			>
				Log in/register
			</v-btn>
		</v-col>
	</v-row>
</template>

<script setup lang="ts">
import { ref, type Ref } from "vue"
import ExtPay from "../../Extpay.js"

const props = defineProps<{
	message?: string
}>()

const highlightColor: Ref<string> = ref("#e255a1")

const extpay = ExtPay('samplewizard')

const login = () : void => {
	extpay.openPaymentPage()
}
</script>