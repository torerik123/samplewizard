<template>
	<v-row 
		dense 
	>
		<v-col class="pa-0">
			<v-btn
				variant="outlined"
				:color="highlightColor"
				block
				@click="login"
			>
				Log in/register
			</v-btn>
		</v-col>
		<v-col cols="12">
			<p class="mb-2 text-caption" v-if="message">
				{{ message }} 
			</p>
		</v-col>
	</v-row>
</template>

<script setup lang="ts">
import ExtPay from "../../Extpay.js"
import { subscriptionPlan } from "../../extpay_default.js"
import { useUtils } from "../composables/useUtils.js";

const props = defineProps<{
	message?: string
}>()

const { highlightColor } = useUtils()

const extpay = ExtPay(subscriptionPlan)

const login = () : void => {
	extpay.openPaymentPage()
	// extpay.openTrialPage() // => No email
}
</script>