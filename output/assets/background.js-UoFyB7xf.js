"use strict";const c=require("./Extpay.js-J2Sy7LH6.js"),n=c("samplewizard");n.startBackground();n.getUser().then(e=>{console.log(e)});const i=async()=>{let e={active:!0},[t]=await chrome.tabs.query(e);return console.log(t),t};chrome.commands.onCommand.addListener(function(e){e.name=="showcontentdialog"&&chrome.tabs.executeScript({file:"main.js"})});chrome.runtime.onMessage.addListener(async e=>{switch(e.type){case"start-recording":const{id:t}=await i(),a=(await chrome.runtime.getContexts({})).find(r=>r.contextType==="OFFSCREEN_DOCUMENT");a?a.documentUrl.endsWith("#recording"):await chrome.offscreen.createDocument({url:"offscreen.html",reasons:["USER_MEDIA"],justification:"Recording from chrome.tabCapture API"});const s=await chrome.tabCapture.getMediaStreamId({targetTabId:t});chrome.runtime.sendMessage({type:"start-recording",target:"offscreen",data:s});break;case"stop-recording":chrome.runtime.sendMessage({type:"stop-recording",target:"offscreen"});break;case"save-recording":const o=Date.now();try{await chrome.storage.local.set({["recording_"+o]:e.data});const r=await chrome.storage.local.get(["recording_"+o]);chrome.runtime.sendMessage({type:"recording-saved",data:{id:o}}),chrome.offscreen.closeDocument()}catch(r){console.log(r)}break}});
