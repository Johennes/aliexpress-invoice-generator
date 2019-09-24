browser.runtime.onConnect.addListener(onConnect);

function onConnect(port) {
    port.onMessage.addListener(function() {
        browser.tabs.printPreview();
        port.disconnect();
    });
}
