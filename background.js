import ExtPay from "./ExtPay.js"
import { subscriptionPlan } from "./extpay_default.js";

const extpay = ExtPay(subscriptionPlan)

extpay.startBackground(); // this line is required to use ExtPay in the rest of your extension

extpay.getUser().then((user) => {
	// console.log("user:", user)

	// if (user.paid && !user.subscriptionCancelAt) {
	// 	console.log("You're paid!")
	// } else if (user.paid && user.subscriptionCancelAt) {
	// 	console.log("Your subscription will end at the next billing cycle")
	// } else if (user.subscriptionStatus === "past_due") {
	// 	console.log("You need to update your card!")
	// 	extpay.openPaymentPage()
	// } else if (user.subscriptionStatus === "canceled") {
	// 	console.log("We hope you enjoyed your subscription!")
	// } else {
	// 	console.log("You haven't paid yet :( ")
	// }
})

extpay.onPaid.addListener((user) => {
	console.log("user paid!")

	chrome.runtime.sendMessage({
		type: "user-paid",
		data: user,
	})
})

// Messages
chrome.runtime.onMessage.addListener(async(message) => {
	switch (message.type) {
		case "start-recording":
			chrome.action.setBadgeBackgroundColor({ color: 'red' })
			chrome.action.setBadgeText({ text: ' ' })

			let recording = false;
			const { id, title: tabName } = await getCurrentTab()

			// Mute playing tab if enabled 
			if (message.mute) {
				await chrome.tabs.update(id, { muted: true });
				console.log("Tab muted");
			}

			const offscreenDocument = await chrome.runtime.getContexts({
				contextTypes: ['OFFSCREEN_DOCUMENT'],
			});

			// If an offscreen document is not already open, create one.
			if (!offscreenDocument.length) {
				try {
					// Create an offscreen document.
					await chrome.offscreen.createDocument({
					url: 'offscreen.html',
					reasons: ['USER_MEDIA'],
					justification: 'Recording from chrome.tabCapture API'
					});
	
					const newDoc = await chrome.runtime.getContexts({
						contextTypes: ['OFFSCREEN_DOCUMENT'],
					});
				} catch (error) {
					console.log(error)
				}
			} else {
				recording = offscreenDocument[0].documentUrl.endsWith('#recording')
			}

			// Get a MediaStream for the active tab.
			const streamId = await chrome.tabCapture.getMediaStreamId({
				targetTabId: id,
			})

			// Send the stream ID to the offscreen document to start recording.
			chrome.runtime.sendMessage({
				type: 'start-offscreen-recording',
				target: 'offscreen',
				data: {
					streamId,
					tabName,
					mute: message.mute,
					trim: message.trim
				}
			});
		break

		case "stop-recording":
			chrome.runtime.sendMessage({
				type: 'stop-offscreen-recording',
				target: 'offscreen'
			});

			chrome.action.setBadgeText({ text: '' })

			  // Unmute the tab after stopping the recording
			  const { id: currentTabId } = await getCurrentTab(); // Ensure to get the current tab ID again if needed
			  await chrome.tabs.update(currentTabId, { muted: false });
			  break;
		case "save-recording":
			const timestamp = Date.now()	
			try {
				await chrome.storage.local.set({
					// "new_recording": message.data
					"new_recording": {
						recording: message.data.recording,
						tabName: message.data.tabName, // Save the tab name along with the recording
					}
				})

				// const result = await chrome.storage.local.get(["recording_" + timestamp])

				await chrome.offscreen.closeDocument()
				
				chrome.runtime.sendMessage({
					type: "recording-saved",
					// data: { id: timestamp },
				})
			} catch(error) {
				console.log(error);
			}
		break
		case "manage-subscription":
			extpay.openPaymentPage()
		break
		case "fetch-user":
			const user = await extpay.getUser()

			chrome.runtime.sendMessage({
				type: "set-user-data",
				data: user,
			})
		default: break
	}
})

const getCurrentTab = async () => {
    let queryOptions = { 
		active: true, 
		// lastFocusedWindow: true
	 };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  }

// TODO 
// Open with keyboard shortcut
// chrome.commands.onCommand.addListener(function(command) {
// 	if( command.name == "showcontentdialog") {
// 		chrome.tabs.executeScript({ file: "main.js" })
// 	}
// })








