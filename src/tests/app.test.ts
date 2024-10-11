import { VueWrapper, mount, shallowMount } from "@vue/test-utils"
import { describe, expect, it, beforeEach, vi } from "vitest"

// Pinia
import { setActivePinia, createPinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { useRootStore } from "../stores/root"
import { useUtils } from "../composables/useUtils"

// Vuetify
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
})

// Components
import App from "../App.vue"
import AppLogo from "../components/AppLogo.vue"
import AppLibrary from "../components/AppLibrary.vue"
import RecordButton from "../components/RecordButton.vue"
import AudioVisualizer from "../components/AudioVisualizer.vue"
import LoginOrSignupBtn from "../components/LoginOrSignupBtn.vue"

// Fixtures
import { webmSrc } from "./fixtures/webmSrc";

// Mock chrome.runtime
global.chrome = {
	runtime: {
		onMessage: {
			addListener: vi.fn(), // Mock addListener method
		},
		sendMessage: vi.fn(), // Mock sendMessage,
		getContexts: vi.fn().mockResolvedValue([]),
	},
	storage: {
		local: {
			get: vi.fn().mockResolvedValue({}), // Mock chrome.storage.local.get
			remove: vi.fn().mockResolvedValue({}), // Mock chrome.storage.local.remove
		},
	},
}

// Mock composables
const useUtilsMock = vi.hoisted(() => {
	return {
		useUtils: vi.fn().mockReturnValue({
			deleteFile: vi.fn(),
		}),
	}
})
  
vi.mock('../composables/useUtils', () => ({
	useUtils: useUtilsMock.useUtils,
}))

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
	it('Renders correctly in list view', async () => {
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

	it("Renders the AudioVisualizer for each file in sortedFiles", async () => {
		// Mount the component
		const wrapper = mount(AppLibrary, {
			global: {
				plugins: [
					vuetify,
					createTestingPinia({
						initialState: {
							root: {
								files: [
									{
										name: "File 1",
										url: "file1.mp3",
										created_at: new Date(),
									},
									{
										name: "File 2",
										url: "file2.mp3",
										created_at: new Date(),
									},
								],
								user: { paid: true }, // Mock user as paid for rendering the files
								isFetchingFiles: false,
								showLoadMoreBtn: false,
							},
						},
					}),
				],
			},
		})

		// Mock store with files
		const store = useRootStore()
		expect(store.files.length).toBe(2)

		// // Find all AudioVisualizer components
		const audioVisualizers = wrapper.findAllComponents(AudioVisualizer)

		// // Check that the correct number of AudioVisualizer components are rendered
		expect(audioVisualizers.length).toBe(2)

		// Check that the correct props are passed to the AudioVisualizer components
		expect(audioVisualizers[0].props("title")).toBe("File 1")
		expect(audioVisualizers[1].props("title")).toBe("File 2")
	})

	it("Calls deleteFromLibrary when the delete event is emitted from AudioVisualizer", async () => {
		const wrapper = mount(AppLibrary, {
			global: {
				plugins: [
					vuetify,
					createTestingPinia({
						initialState: {
							root: {
								files: [
									{
										name: "File 1",
										url: "file1.mp3",
										created_at: new Date(),
									},
								],
								user: { id: "123", paid: true }, // Mock user with ID
							},
						},
					}),
				],
			},
		})

		const store = useRootStore() // Access the store

		// Find the AudioVisualizer component
		const audioVisualizer = wrapper.findComponent(AudioVisualizer)
		expect(audioVisualizer.exists()).toBe(true) // Ensure the component is rendered

		// Emit delete event from AudioVisualizer
		await audioVisualizer.vm.$emit("delete")

		// Check that deleteFile was called with the correct arguments
		const { deleteFile } = useUtils() // Directly access the mocked function
		expect(deleteFile).toHaveBeenCalledWith("File 1", store.user.id)

		// Check that the file was removed from the store
		expect(store.files).toEqual([]) // After deletion, the file list should be empty
	})

	it("Renders LoginOrSignupBtn when user is not paid", () => {
		const wrapper = mount(AppLibrary, {
			global: {
				plugins: [
					createTestingPinia({
						initialState: {
							root: {
								user: { paid: false }, // Mock the user state directly
							},
						},
					}),
				],
			},
		})

		const loginBtn = wrapper.findComponent({ name: "LoginOrSignupBtn" })
		expect(loginBtn.exists()).toBe(true)
		expect(loginBtn.text()).toContain(
			"The library feature is only available to premium users."
		)
	})
	  
	it('Shows "Load more" button if showLoadMoreBtn is true', () => {
		const wrapper = mount(AppLibrary, {
			global: {
				plugins: [
					vuetify,
					createTestingPinia({
						initialState: {
							root: {
								user: { paid: true },
								showLoadMoreBtn: true,
								isFetchingFiles: false,
								files: [
									{
										name: "File 1",
										url: "file1.mp3",
										created_at: new Date(),
									},
								],
							},
						},
					}),
				],
			},
		})

		// Look for the v-btn component
		const loadMoreBtn = wrapper.find("[data-test=loadMoreBtn]")

		// Check if the button exists
		expect(loadMoreBtn.exists()).toBe(true)

		// Verify the text content of the button
		expect(loadMoreBtn.text()).toBe("Load more...")
	})

	it('Calls fetchUserFiles when "Load more" button is clicked', async () => {
		// Mount the component
		const wrapper = mount(AppLibrary, {
			global: {
				plugins: [
					vuetify,
					createTestingPinia({
						fakeApp: true,
						createSpy: vi.fn,
						initialState: {
							root: {
								user: { id: "user123", paid: true }, // Ensure user has an id
								showLoadMoreBtn: true,
								isFetchingFiles: false,
								files: [
									{
										name: "File 1",
										url: "file1.mp3",
										created_at: new Date(),
									},
								],
							},
						},
					}),
				],
			},
		})

		// Get the store instance
		const { fetchUserFiles } = useRootStore()

		await wrapper.vm.$nextTick() // Wait for the component to be fully mounted
		
		const loadMoreBtn = wrapper.find("[data-test=loadMoreBtn]")

		 // Verify button exists before triggering the click
		 expect(loadMoreBtn.exists()).toBe(true)

		 await loadMoreBtn.trigger("click")
		 
		 expect(fetchUserFiles).toHaveBeenCalled()
	})
})

describe("App.vue", () => {
	it("Renders the component correctly", async () => {
		const wrapper = mount(App, {
			global: {
				plugins: [
					vuetify,
					createTestingPinia({}),
				],
			},
		})

		await wrapper.vm.$nextTick() // Wait for all mounting and async tasks

		// Check if AppLogo exists
		expect(wrapper.findComponent(AppLogo).exists()).toBe(true)
		expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled()
		
		// Check if RecordButton exists
		expect(wrapper.findComponent(RecordButton).exists()).toBe(true)
	})
	
	it("Switches tabs when clicked", async () => {
		const wrapper = mount(App, {
			global: {
				plugins: [vuetify, createTestingPinia({
					initialState: {
						root: {
							user: { paid: true }, // Mock paid user to show library
						},
					},
				})],
			},
		})

		// Initial state => no active tab
		expect(wrapper.find(".v-tab--active").exists()).toBe(false)

		// Library
		const libraryTab = wrapper.find('[data-test="libraryTab"]')
		await libraryTab.trigger("click")
		
		// Verify that the Library tab is active by checking for the active class
		expect(wrapper.find(".v-tab-item--selected").text()).toBe("Library")

		// Settings
		const settingsTab = wrapper.find('[data-test="settingsTab"]')
		await settingsTab.trigger("click")

		// Verify that the Settings tab is active
		expect(wrapper.find(".v-tab-item--selected").text()).toBe("Settings")
	})
	

	it.skip("sets audioSrc to null when deleteAudio is called", async () => {
		const wrapper = mount(App)

		// Simulate setting an audio source
		wrapper.setData({ audioSrc: "sample-audio.mp3" })
		expect(wrapper.vm.audioSrc).toBe("sample-audio.mp3")

		// Call deleteAudio method
		wrapper.vm.deleteAudio()

		// Check if audioSrc is set to null
		expect(wrapper.vm.audioSrc).toBe(null)
	})
	
	it.skip("calls downloadFile when the Download button is clicked", async () => {
		const downloadFileMock = jest.spyOn(App.methods, "downloadFile")
		const wrapper = mount(App, {
			data() {
				return {
					audioSrc: "sample-audio.mp3",
					selectedAudioFormat: "WEBM",
					sampleName: "Sample 1",
				}
			},
		})

		const downloadButton = wrapper.find('v-btn[text="Download"]')
		await downloadButton.trigger("click")

		expect(downloadFileMock).toHaveBeenCalledWith(
			"sample-audio.mp3",
			"WEBM",
			"Sample 1"
		)
	})

	it.skip("shows snackbar with success message when file is saved", async () => {
		const wrapper = mount(App, {
			data() {
				return {
					showSnackbar: false,
					snackbarText: "",
					snackbarColor: "success",
				}
			},
		})

		// Simulate file save success
		wrapper.setData({
			showSnackbar: true,
			snackbarText: "Saved to library!",
		})

		// Check if snackbar is visible and the text is correct
		expect(wrapper.find("v-snackbar").isVisible()).toBe(true)
		expect(wrapper.find("v-snackbar").text()).toContain("Saved to library!")
	})

	it.skip("renders Settings tab and Save to library button if user is paid", async () => {
		const wrapper = mount(App, {
			data() {
				return {
					user: { paid: true },
				}
			},
		})

		// Check if Settings tab is rendered
		const settingsTab = wrapper.find('v-tab[text="Settings"]')
		expect(settingsTab.exists()).toBe(true)

		// Check if Save to library button is visible
		const saveToLibraryBtn = wrapper.find('v-btn[text="Save to library"]')
		expect(saveToLibraryBtn.exists()).toBe(true)
	})

	it.skip("validates sample name correctly", async () => {
		const wrapper = mount(App)

		// Set an invalid sample name
		wrapper.setData({ sampleName: "invalid/name" })

		// Trigger form validation
		await wrapper.vm.$refs.form.validate()

		// Check for validation error message
		const textField = wrapper.find("v-text-field")
		expect(textField.props().errorMessages).toContain(
			"Invalid characters in name."
		)
	})
})

describe.skip("TODO: Settings.vue", () => {
})



