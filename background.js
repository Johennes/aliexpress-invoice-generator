// Copyright 2019 Johannes Marbach
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
  browser.pageAction.onClicked.addListener(onPageActionClicked)
  browser.runtime.onConnect.addListener(onConnect)

  function onPageActionClicked(tab) {
    let port = browser.tabs.connect(tab.id)
    port.postMessage()
  }

  function onConnect(port) {
    port.onMessage.addListener((message) => {
      port.disconnect()
      savePdf(message.buffers, message.date, message.number)
    })
  }

  function savePdf(buffers, date, number) {
    browser.downloads.download({
      url: URL.createObjectURL(new Blob(buffers, {type: 'application/pdf'})),
      filename: `invoice-${getFilenameComponent(date)}-${getFilenameComponent(number)}.pdf`,
      saveAs: true
    })
  }

  function getFilenameComponent(string) {
    return string.replace(/^\s+|\s+$/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9_-]/gi, '')
  }
})()
