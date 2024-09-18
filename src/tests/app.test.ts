import { VueWrapper, mount, shallowMount } from "@vue/test-utils"
import { describe, expect, it, beforeEach,  } from "vitest"
import { createTestingPinia } from '@pinia/testing'
import { useRootStore } from "../stores/root"
import ExtPay from '../../Extpay.js'

// Vuetify
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
})

// Components
import AppLogo from "../components/AppLogo.vue"
import AppLibrary from "../components/AppLibrary.vue"
import RecordButton from "../components/RecordButton.vue"
import AudioVisualizer from "../components/AudioVisualizer.vue"
import LoginOrSignupBtn from "../components/LoginOrSignupBtn.vue"

// Fixtures
import { webmSrc } from "./fixtures/webmSrc";
import App from "../App.vue"

// Mock chrome.runtime
global.chrome = {
	runtime: {
	sendMessage: vi.fn()  // Mock sendMessage
	}
}

describe("Logo", () => {
	it("Render logo with correct color", () => {
		const wrapper = shallowMount(AppLogo, {
			global: {
				plugins: [vuetify]
			},
			props: {
				text: "SampleWizard",
				color: "#e255a1",
			},
		})

		const logo = wrapper.get('[data-test="appLogo"]')

		expect(logo.text()).toBe('SampleWizard')
		expect(logo.attributes('style')).toBe('color: #e255a1;')
	})
})

describe("RecordButton", () => {
	let wrapper = VueWrapper;

	it("Render with icon and text", () => {
		const wrapper = mount(RecordButton, {
			global: {
				plugins: [vuetify]
			},
		})

		const btn = wrapper.get('[data-test="recordButton"]')
		const icon = wrapper.get('[data-test="recordButtonIcon"]')

		expect(btn.text()).toBe('Start recording')
		expect(icon.attributes('class')).toContain('mdi-radiobox-marked')
		expect(icon.attributes('class')).toContain('text-red')
	})

	it("Change btn state on start/stop recording", async () => {
		const wrapper = mount(RecordButton, {
			global: {
				plugins: [vuetify]
			},
		})

		// Start - initial btn state 
		const startBtn = wrapper.get('[data-test="recordButton"]')
		expect(startBtn.text()).toBe('Start recording')
		await startBtn.trigger('click')

		expect(wrapper.emitted().toggleRecordingStatus).toEqual([ [ "start-recording" ] ])	
		
		// Update btn text
		await wrapper.setProps({ buttonState: "recording-active" })
		const stopBtn = wrapper.get("[data-test='recordButton']")

		expect(stopBtn.text()).toBe('Stop recording')
		expect(stopBtn.find("i").attributes('class')).toContain('mdi-stop')


		// Stop 
		await stopBtn.trigger('click')

		expect(wrapper.emitted().toggleRecordingStatus[1]).toEqual( ["stop-recording"] )	
		
		await wrapper.setProps({ buttonState: "recording-stopped" })

		expect(wrapper.get("[data-test='recordButton']").text()).toBe('Start recording')
	})


})

describe("AudioVisualizer - single file view", () => {
	it("Render component", async () => {
		const wrapper = mount(AudioVisualizer, {
			global: {
				plugins: [vuetify]
			},
			props: {
				src: webmSrc,
				variant: "single-file",
			}
		})

		// Waveform 
		const waveform = wrapper.get('[data-test="waveform"]')
		expect(waveform.exists()).toBe(true)

		// Play + Delete button
		const playBtn = wrapper.get('[data-test="playButton"]')
		const deleteBtn = wrapper.get('[data-test="deleteButton"]')

		expect(playBtn.exists()).toBe(true)
		expect(deleteBtn.exists()).toBe(true)

		expect(playBtn.text()).toBe('Play')
		expect(playBtn.find("i").attributes('class')).toContain('mdi-play')

		expect(deleteBtn.text()).toBe('Delete')
		expect(deleteBtn.find("i").attributes('class')).toContain('mdi-trash-can')

		// Emits delete event on delete button click
		await deleteBtn.trigger('click')

		// Check for the delete event only
		expect(wrapper.emitted('delete')).toBeTruthy()
		expect(wrapper.emitted('delete').length).toBe(1)	
	})
})

describe('AudioVisualizer - List View', () => {
	it('renders correctly in list view', async () => {
		const wrapper = mount(AudioVisualizer, {
			global: {
				plugins: [vuetify]
			},
			props: {
				variant: 'list',
				src: webmSrc,
				progressColor: 'blue',
				title: 'Sample Audio'
			}
		})

		// Check for play button
		const playBtn = wrapper.get('[data-test="playButtonList"]')
		expect(playBtn.exists()).toBe(true)

		// Check the icon inside the play button
		const icon = playBtn.find('i')
		expect(icon.exists()).toBe(true)
		expect(icon.classes()).toContain('mdi-play')

		// Check for title
		const title = wrapper.find('[data-test="sampleTitle"]')
		expect(title.text()).toBe('Sample Audio')
		
		// Check for waveform element
		const waveform = wrapper.get('[data-test="waveform"]')
		expect(waveform.exists()).toBe(true)
	})
})

describe('LoginButton.vue', () => {
	it('Renders login button and message', () => {
		const notLoggedInText = "You don't have an active subscription. Log in or register to enable WAV downloads and library."

		const wrapper = mount(LoginOrSignupBtn, {
			global: {
				plugins: [vuetify]
			},
			props: {
				message: notLoggedInText
			}
		})

		// Check if the button is rendered
		const button = wrapper.get('[data-test=loginOrSignupBtn]')
		expect(button.exists()).toBe(true)
		expect(button.text()).toBe('Log in/register')

		// Message
		const message = wrapper.get('[data-test=loginOrSignupBtnMessage]')
		expect(message.exists()).toBe(true)
		expect(message.text()).toBe(notLoggedInText)
	})
  
	it("Does not render message if message prop is not provided", () => {
		const wrapper = mount(LoginOrSignupBtn, {
			global: {
				plugins: [vuetify],
			},
		})

		const message = wrapper.find('[data-test="loginBtnMessage"]')
		expect(message.exists()).toBe(false)
	})
  
	it("Calls chrome.runtime.sendMessage on button click", async () => {
		const wrapper = mount(LoginOrSignupBtn, {
			global: {
				plugins: [vuetify],
			},
		})

		// Find the button and trigger a click event
		const button = wrapper.find('[data-test="loginOrSignupBtn"]')
		await button.trigger("click")

		// Assert that chrome.runtime.sendMessage was called
		expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith({
			type: "manage-subscription",
		})
	})
})



