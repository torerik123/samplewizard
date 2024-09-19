import { VueWrapper, mount, shallowMount } from "@vue/test-utils"
import { describe, expect, it, beforeEach,  } from "vitest"

// Pinia
import { setActivePinia, createPinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { useRootStore } from "../stores/root"

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

describe("AudioVisualizer - List View", () => {
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

describe("LoginButton", () => {
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

describe("AppLibrary", () => {
	it("Only show files to logged in users", () => {
		const wrapper = mount(AppLibrary, {
			global: {
				plugins: [vuetify, createTestingPinia()],
			},
		})

		const files = wrapper.findAll("[data-test=audioVisualizerListView]")
		expect(files.length).toBe(0)
		expect(wrapper.text()).toContain(
			"Log in/register The library feature is only available to premium users."
		)
	})

	it.skip("TODOO: Renders the AudioVisualizer for each file in sortedFiles", async () => {
		// Mount the component
		const wrapper = mount(AppLibrary, {
			global: {
				plugins: [vuetify, createTestingPinia({
					initialState: {
						files: [
							{ name: "File 1", url: "file1.mp3", created_at: new Date() },
							{ name: "File 2", url: "file2.mp3", created_at: new Date() },
						],
					},
				})],
			},
			components: AudioVisualizer
		})

		// Mock store with files
		const store = useRootStore()
		expect(store.files.length).toBe(2)

		// // Wait for next tick to ensure component updates
		// await wrapper.vm.$nextTick()

		// // Find all AudioVisualizer components
		// const audioVisualizers = wrapper.findAllComponents(AudioVisualizer)
		// const audioVisualizers = wrapper.findAll("data-test=audioVisualizerListView")

		// // Check that the correct number of AudioVisualizer components are rendered
		// expect(audioVisualizers.length).toBe(2)


		// Check that the correct props are passed to the AudioVisualizer components
		// expect(audioVisualizers[0].props("title")).toBe("File 1")
		// expect(audioVisualizers[1].props("title")).toBe("File 2")
	})


	it.skip("TODO: calls deleteFromLibrary when the delete event is emitted from AudioVisualizer", async () => {
		const wrapper = mount(AppLibrary, {
			global: {
				plugins: [createTestingPinia({ createSpy: vi.fn })],
			},
		})

		const store = useRootStore()
		store.files = [
			{ name: "File 1", url: "file1.mp3", created_at: new Date() },
		]

		const audioVisualizer = wrapper.findComponent({
			name: "AudioVisualizer",
		})
		await audioVisualizer.vm.$emit("delete", "File 1")

		expect(useUtils().deleteFile).toHaveBeenCalledWith(
			"File 1",
			store.user.id
		)
	})

	it.skip("TODO: Renders LoginOrSignupBtn when user is not paid", () => {
		vi.mock("@/stores/root", () => ({
			useRootStore: vi.fn(() => ({
				user: { paid: false },
			})),
		}))

		const wrapper = mount(AppLibrary, {
			global: {
				plugins: [createTestingPinia({ createSpy: vi.fn })],
			},
		})

		const loginBtn = wrapper.findComponent({ name: "LoginOrSignupBtn" })
		expect(loginBtn.exists()).toBe(true)
		expect(loginBtn.text()).toContain(
			"The library feature is only available to premium users."
		)
	})
	
	it.skip('TODO: shows "Load more" button if showLoadMoreBtn is true', () => {
		vi.mock("@/stores/root", () => ({
			useRootStore: vi.fn(() => ({
				user: { paid: true },
				files: [],
				isFetchingFiles: false,
				showLoadMoreBtn: true,
			})),
		}))

		const wrapper = mount(AppLibrary, {
			global: {
				plugins: [createTestingPinia({ createSpy: vi.fn })],
			},
		})

		const loadMoreBtn = wrapper.find("button")
		expect(loadMoreBtn.exists()).toBe(true)
		expect(loadMoreBtn.text()).toBe("Load more...")
	})

	it.skip('TODO: Calls fetchUserFiles when "Load more" button is clicked', async () => {
		vi.mock("@/stores/root", () => ({
			useRootStore: vi.fn(() => ({
				user: { paid: true },
				files: [],
				isFetchingFiles: false,
				showLoadMoreBtn: true,
				fetchUserFiles,
			})),
		}))

		const wrapper = mount(AppLibrary, {
			global: {
				plugins: [createTestingPinia({ createSpy: vi.fn })],
			},
		})

		const loadMoreBtn = wrapper.find("button")
		await loadMoreBtn.trigger("click")

		expect(fetchUserFiles).toHaveBeenCalled()
	})

})

describe.skip("TODO: App.vue", () => {
})

describe.skip("TODO: Settings.vue", () => {
})



