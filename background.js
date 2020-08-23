// Copyright 2019, 2020 Johannes Marbach
//
// This file is part of AliExpress Invoice Generator, hereafter referred
// to as the program.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

(() => {
  browser.runtime.onInstalled.addListener(onExtensionUpdated)
  browser.pageAction.onClicked.addListener(onPageActionClicked)
  browser.runtime.onConnect.addListener(onConnect)

  function onExtensionUpdated(info) {
    if (info.temporary) {
      return
    }
    switch (info.reason) {
      case 'install':
        {
          const url = browser.runtime.getURL("views/onboard.html")
          browser.tabs.create({ url })
        }
      case 'update':
        {
          const url = browser.runtime.getURL("views/upboard.html")
          browser.tabs.create({ url })
        }
        break
    }
  }

  function onPageActionClicked(tab) {
    let port = browser.tabs.connect(tab.id)
    port.postMessage()
  }

  function onConnect(port) {
    port.onMessage.addListener((message) => {
      port.disconnect()
      switch (message.action) {
        case 'open-settings':
          browser.runtime.openOptionsPage()
        case 'store-pdf':
          storePdf(message.chunks, message.date, message.number)
      }
    })
  }

  function storePdf(chunks, date, number) {
    let arrayChunks = chunks
    // Chrome converts [Uint8Array] to a JSON object during messaging, convert it back here
    if (chunks.length > 0 && chunks[0].constructor === Object && chunks[0].data !== undefined) {
      arrayChunks = chunks.map(chunk => new Uint8Array(chunk.data))
    }
    browser.downloads.download({
      url: URL.createObjectURL(new Blob(arrayChunks, {type: 'application/pdf'})),
      filename: `invoice-${getFilenameComponent(date)}-${getFilenameComponent(number)}.pdf`,
      saveAs: true
    })
  }

  function getFilenameComponent(string) {
    return string.replace(/^\s+|\s+$/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9_-]/gi, '')
  }
})()
