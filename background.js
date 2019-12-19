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
      showPdf(message.buffers)
    })
  }

  function showPdf(buffers) {
    browser.tabs.create({
      url: URL.createObjectURL(new Blob(buffers, {type: 'application/pdf'})),
    })
  }
})()
