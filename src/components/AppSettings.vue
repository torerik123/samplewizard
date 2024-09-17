<template>
	<v-sheet color="transparent">
		<v-btn 
			text="Manage subscription"
			class="rounded-lg"
			@click="manageSubscription"
			block
			size="large"
		/>
	</v-sheet>
</template>

<script setup lang="ts">
import { subscriptionPlan } from "../../extpay_default.js"
import ExtPay from "../../ExtPay.js"

const manageSubscription = () => {
	const extpay = ExtPay(subscriptionPlan)
	extpay.openPaymentPage()
}
</script>