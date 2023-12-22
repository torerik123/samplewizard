const getCurrentTab = async () => {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  }

chrome.runtime.onMessage.addListener(async(data, tabId) => { 
	switch (data.event) {
		case "start-recording": 
			let recording = false;
			const { id, url } = await getCurrentTab()
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
				recording = offscreenDocument.documentUrl.endsWith('#recording');
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
		break
		default: break
	}
})







