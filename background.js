import ExtPay from "./ExtPay.js";

const extpay = ExtPay('samplewizard')
extpay.startBackground(); // this line is required to use ExtPay in the rest of your extension

extpay.getUser().then(user => {
	console.log(user)
})

const getCurrentTab = async () => {
    let queryOptions = { 
		active: true, 
		// lastFocusedWindow: true
	 };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
	console.log(tab)
    return tab;
  }

// Open with keyboard shortcut
chrome.commands.onCommand.addListener(function(command) {
	if( command.name == "showcontentdialog") {
		chrome.tabs.executeScript({ file: "main.js" })
	}
})

chrome.runtime.onMessage.addListener(async(message) => {
	switch (message.type) {
		case "start-recording":
			chrome.action.setBadgeBackgroundColor({ color: 'red' })
			chrome.action.setBadgeText({ text: ' ' })

			let recording = false;
			const { id } = await getCurrentTab()
			const existingContexts = await chrome.runtime.getContexts({});
			const offscreenDocument = existingContexts.find(
				(c) => c.contextType === 'OFFSCREEN_DOCUMENT'
			);


			// If an offscreen document is not already open, create one.
			if (!offscreenDocument) {
				// Create an offscreen document.
				await chrome.offscreen.createDocument({
				url: 'offscreen.html',
				reasons: ['USER_MEDIA'],
				justification: 'Recording from chrome.tabCapture API'
				});
			} else {
				recording = offscreenDocument.documentUrl.endsWith('#recording')
			}

			// Get a MediaStream for the active tab.
			const streamId = await chrome.tabCapture.getMediaStreamId({
				targetTabId: id
			});

			// Send the stream ID to the offscreen document to start recording.
			chrome.runtime.sendMessage({
				type: 'start-recording',
				target: 'offscreen',
				data: streamId
			});
		break

		case "stop-recording":
			chrome.runtime.sendMessage({
				type: 'stop-recording',
				target: 'offscreen'
			});

			chrome.action.setBadgeText({ text: '' })
		break

		case "save-recording":
			const timestamp = Date.now()

			try {
				await chrome.storage.local.set({
					["recording_" + timestamp]: message.data
				})

				const result = await chrome.storage.local.get(["recording_" + timestamp])

				chrome.runtime.sendMessage({
					type: "recording-saved",
					data: { id: timestamp },
				})

				chrome.offscreen.closeDocument()
			} catch(error) {
				console.log(error);
			}
		break
		default: break
	}
})







