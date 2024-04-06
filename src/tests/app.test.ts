import { VueWrapper, mount, shallowMount } from "@vue/test-utils";
import { describe, expect, it, beforeEach, test } from "vitest";

// import App from "../App.vue";
import AppLogo from "../components/AppLogo.vue";

describe("Example test", () => {
	let wrapper = VueWrapper;

	// beforeEach(() => {
	
	// })

	it("Render logo with correct color", () => {
		const wrapper = shallowMount(AppLogo, {
			props: {
				text: "SampleWizard",
			},
			color: "#e255a1"
		})
		const logo = wrapper.get('[data-test="appLogo"]')
		expect(logo.text()).toBe('SampleWizard')

		// TODO - Logo should have correct color
		console.log(logo.html())
		// expect(logo.element.style.color).toBe("#e255a1")
	});
})

