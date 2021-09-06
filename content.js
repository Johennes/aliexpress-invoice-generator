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

(function() {
  const messageContainerId = '_aig-message-container'

  addButtons()
  addMessageContainer()

  // Explicit call to browser.pageAction.show needed in Chrome. Trigger it from
  // here to avoid requesting the tabs permission.
  showPageAction()

  browser.runtime.onConnect.addListener(onConnect)

  // Misc

  function addButtons() {
    const lastButtonSelector = '.order-operate button:last-of-type'
    const settingsButtonId = '_aig-settings-button'
    const printButtonId = '_aig-print-button'

    if (document.querySelector(`#${printButtonId}`) || !document.querySelector(lastButtonSelector)) {
      setTimeout(() => {
        addButtons()
      }, 100)
      return
    }

    let lastButton = document.querySelector(lastButtonSelector)

    let settingsButton = lastButton.cloneNode(true)
    settingsButton.setAttribute('id', settingsButtonId)
    settingsButton.innerHTML = 'Add-On Settings'
    settingsButton.addEventListener('click', openSettings)
    settingsButton.style.background = 'none'
    settingsButton.style.color = '#e62e04'
    settingsButton.style.borderColor = '#e62e04'
    lastButton.insertAdjacentElement('afterend', settingsButton)

    let printButton = lastButton.cloneNode(true)
    printButton.setAttribute('id', printButtonId)
    printButton.innerHTML = 'PDF Invoice'
    printButton.addEventListener('click', storePdf)
    printButton.style.background = '#e62e04'
    printButton.style.color = '#ffffff'
    printButton.style.borderColor = '#e62e04'
    lastButton.insertAdjacentElement('afterend', printButton)
  }

  function showPageAction() {
    let port = browser.runtime.connect()
    port.postMessage({ action: 'show-page-action' })
  }

  function openSettings() {
    let port = browser.runtime.connect()
    port.postMessage({ action: 'open-settings' })
  }

  async function storePdf() {
    clearMessages()
    let settings = await loadSettings()
    let context = getContext(settings)
    let chunks = await createPdf(settings, context)
    let port = browser.runtime.connect()
    port.postMessage({ action: 'store-pdf', chunks: chunks, date: context.order.date, number: context.order.number })
  }

  async function loadSettings() {
    let result = await browser.storage.sync.get(['pageSize', 'font', 'buyerFromOrder', 'buyerExtraInfo'])
    return {
      pageSize: result.hasOwnProperty('pageSize') ? result.pageSize : 'A4',
      font: result.hasOwnProperty('font') ? result.font : 'droid-sans',
      buyerFromOrder: result.hasOwnProperty('buyerFromOrder') ? result.buyerFromOrder : true,
      buyerExtraInfo: result.hasOwnProperty('buyerExtraInfo') ? result.buyerExtraInfo : ''
    }
  }
  
  function onConnect(port) {
    port.onMessage.addListener((message) => {
      port.disconnect()
      storePdf()
    })
  }

  // Log messages

  const SEVERITY_NONE = 0;
  const SEVERITY_WARNING = 1;
  const SEVERITY_ERROR = 2;

  function addMessageContainer() {
    let parent = document.querySelector('.order-operate');
    if (!parent) {
      console.error('Could not find parent for message container');
      return;
    }

    let container = document.createElement('div');
    container.setAttribute('id', messageContainerId);
    container.style.border = '1px solid #e62e04'
    container.style.padding = '1ex'
    container.style.marginTop = '1ex'
    container.style.display = 'none'
    parent.appendChild(container);
  }

  function clearMessages() {
    let container = document.querySelector(`#${messageContainerId}`)
    if (container) {
      container.innerHTML = '<b>Invoice generation log</b>'
      container.style.display = 'none'
    }
  }

  function recordMessage(message, severity) {
    if (severity === SEVERITY_ERROR) {
      console.error(message);
    } else if (severity === SEVERITY_WARNING) {
      console.warn(message);
    } else if (severity === SEVERITY_NONE) {
      console.log(message);
      return
    }

    let container = document.querySelector(`#${messageContainerId}`)
    if (container) {
      container.innerHTML += `<br/>${message}`
      container.style.display = 'block'
    }
  }

  // Invoice Data Extraction

  function getContext(settings) {
    const hasTax = getHasTax();
    const hasTotalTaxOnly = getHasTotalTaxOnly(hasTax);
    const total = getTotal(hasTax);
    const tax = getTax(total, hasTax, hasTotalTaxOnly);
    return {
      order: {
        number: getOrderNumber(),
        date: getOrderDate()
      },
      store: {
        name: getStoreName(),
        url: getStoreUrl()
      },
      buyer: {
        name: settings.buyerFromOrder ? getBuyerName() : null,
        street1: settings.buyerFromOrder ? getBuyerStreet1() : null,
        street2: settings.buyerFromOrder ? getBuyerStreet2() : null,
        zip: settings.buyerFromOrder ? getBuyerZip() : null,
        city: settings.buyerFromOrder ? getBuyerCity() : null,
        region: settings.buyerFromOrder ? getBuyerRegion() : null
      },
      logistics: {
        shippingCompany: getShippingCompany(),
        trackingNumber: getTrackingNumber()
      },
      items: getItems(hasTax),
      productTotal: getProductTotal(),
      shipping: getShippingTotal(),
      discount: getDiscount(),
      tax: tax,
      total: total,
      payment: getPayment(),
      refundedItems: getRefundedItems(),
      hasTotalTaxOnly: hasTotalTaxOnly
    };
  }

  function getOrderNumber() {
    return getText(document, '.order-no', 'order number', SEVERITY_ERROR);
  }

  function getOrderDate() {
    let date = getOrderDateFromOperatePanel();
    if (!date) {
      date = getOrderDateFromPayment();
    }
    if (!date) {
      recordMessage('Could not scrape order date', SEVERITY_ERROR);
      return null;
    }
    return date;
  }

  function getOrderDateFromOperatePanel() {
    let lis = document.querySelectorAll('#operate-pnl li');
    if (!lis || lis.length === 0) {
      return null;
    }
    let span = lis[lis.length - 1].querySelector('span');
    if (!span) {
      return lis[lis.length - 1].textContent.trim();
    }
    return span.textContent.trim();
  }

  function getOrderDateFromPayment() {
    return getText(document, 'td.pay-c4', 'payment date', SEVERITY_ERROR);
  }

  function getStoreName() {
    return getText(document, '.user-name-text a', 'store name', SEVERITY_ERROR);
  }

  function getStoreUrl() {
    let href = getAttribute(document, '.user-name-text a', 'href', 'store URL', SEVERITY_WARNING);
    return href ? href.replace(/^\/*/, '').replace(/\?.*/, '') : null;
  }

  function getBuyerName() {
    return getText(document, '.user-shipping span[i18entitle="Contact Name"]', 'buyer name', SEVERITY_ERROR);
  }

  function getBuyerStreet1() {
    let lines = document.querySelectorAll('ul#user-shipping-list li.long');
    if (!lines || lines.length === 0) {
      recordMessage('Could not scrape buyer street line 1', SEVERITY_ERROR);
      return null;
    }
    return getText(lines[0], 'span', 'buyer street line 1', SEVERITY_ERROR);
  }

  function getBuyerStreet2() {
    let lines = document.querySelectorAll('ul#user-shipping-list li.long');
    if (!lines || lines.length <= 2) {
      return null;
    }
    return getText(lines[1], 'span', 'buyer street line 2', SEVERITY_NONE);
  }

  function getBuyerCityRegion() {
    let lines = document.querySelectorAll('ul#user-shipping-list li.long');
    if (!lines || lines.length <= 1) {
      return null;
    }
    return getText(lines[lines.length - 1], 'span', 'buyer city/region', SEVERITY_NONE);
  }

  function getBuyerCity() {
    let cityRegion = getBuyerCityRegion();
    if (!cityRegion) {
      recordMessage('Could not scrape buyer city', SEVERITY_ERROR);
      return null;
    }
    let elements = cityRegion.split(',').map(function(element) { return element.trim() });
    let cityElements = elements.slice(0, Math.max(1, elements.length - 2))
    return cityElements.join(', ')
  }

  function getBuyerRegion() {
    let cityRegion = getBuyerCityRegion();
    if (!cityRegion) {
      recordMessage('Could not scrape buyer region', SEVERITY_ERROR);
      return null;
    }
    let elements = cityRegion.split(',').map(function(element) { return element.trim() });
    let regionElements = elements.slice(Math.max(1, elements.length - 2))
    return regionElements.join(', ')
  }

  function getBuyerZip() {
    return getText(document, '.user-shipping span[i18entitle="Zip Code"]', 'buyer zip', SEVERITY_ERROR);
  }

  function getShippingCompany() {
    return getText(document, '.logistics-name', 'shipping company', SEVERITY_WARNING)
  }

  function getTrackingNumber() {
    let text = getText(document, '.logistics-num', 'tracking number', SEVERITY_WARNING)
    return text ? text.replace('\n', ', ') : null
  }

  function getItems(hasTax) {
    return forAllElements(document, 'table#TP_ProductTable tr.order-bd', 'items', SEVERITY_ERROR, (row, index) => {
      const total = getItemTotal(row);
      const tax = getItemTax(row, total, hasTax);
      return {
        title: getItemTitle(row),
        specs: getItemSpecs(row),
        image: getItemImage(row),
        amount: getItemAmount(row),
        price: getItemPrice(row),
        total: total,
        tax: tax
      }
    })
  }

  function getItemTitle(row) {
    return getText(row, 'td.baobei a.baobei-name', 'item title', SEVERITY_ERROR)
  }

  function getItemSpecs(row) {
    return forAllElements(row, 'td.baobei div.spec', 'item specifications', SEVERITY_NONE, (element, index) => {
      let text = element.textContent.trim()
      return text ? text.replace(/\s\s+/g, ' ') : null
    })
  }

  function getItemImage(row) {
    return getAttribute(row, 'td.baobei a.pic img', 'src', 'item image', SEVERITY_NONE)
  }

  function getItemAmount(row) {
    return getText(row, 'td.quantity', 'item amount', SEVERITY_ERROR)
  }

  function getItemPrice(row) {
    return getText(row, 'td.price', 'item price', SEVERITY_ERROR)
  }

  function getItemTotal(row) {
    return getText(row, 'td.amount:not(.tax)', 'item total', SEVERITY_ERROR);
  }

  function getItemTax(row, price, hasTax) {
    return hasTax ? getText(row, 'td.tax', 'item tax', SEVERITY_ERROR) : getZeroTax(price);
  }

  function getProductTotal() {
    let element = getNthElement(document, 'div.final-price', 0, 'product total', SEVERITY_ERROR);
    return element ? normalizePrice(element.textContent) : null;
  }

  function getShippingTotal() {
    let element = getNthElement(document, 'div.final-price', 1, 'shipping total', SEVERITY_ERROR);
    return element ? normalizePrice(element.textContent) : null
  }

  function getTotal(hasTax) {
    // Invoices for orders after 2021-07-01 have an extra tax column
    let element = getNthElement(document, 'div.final-price', hasTax ? 3 : 2, 'total', SEVERITY_ERROR);
    return element ? normalizePrice(element.textContent) : null
  }

  function getHasTax() {
    return getElementCount(document, '.tax') > 0 || getElementCount(document, 'div.final-price') > 3;
  }

  function getHasTotalTaxOnly(hasTax) {
    // Some invoice layouts only have the total tax in a tooltip
    return !hasTax && getElementCount(document, '.s-tax__tool') > 0;
  }

  function getDiscount() {
    let element = document.querySelector('td.discount-price');
    if (!element) {
      return null;
    }
    let discount = [];
    const lines = element.innerHTML.trim().split('<br');
    for (let line of lines) {
      if (line.match(/\d+[,.]\d+/)) {
        discount.push(line.replace(/^[\/>\s]+/g, '').substring(4).trim());
      }
    }
    return discount;
  }

  function getPayment() {
    return forAllElements(document, 'table#tp-buyer-order-table tbody tr', 'payment', SEVERITY_WARNING, (row, index) => {
      return {
        amount: getPaymentAmount(row),
        title: getPaymentTitle(row)
      }
    })
  }

  function getPaymentAmount(row) {
    let text = getText(row, 'td.pay-c1', 'payment amount', SEVERITY_ERROR)
    return text ? normalizePrice(text) : null
  }

  function getPaymentTitle(row) {
    return getText(row, 'td.pay-c3', 'payment title', SEVERITY_ERROR)
  }

  function normalizePrice(price) {
    return price.replace(/^[a-zA-Z]*/, '').trim()
  }

  function getRefundedItems() {
    return forAllElements(document, 'table#tp-refund-amount-table tbody tr.order-bd', 'refunded items', SEVERITY_NONE, (row, index) => {
      return {
        title: getRefundedItemTitle(row),
        image: getRefundedItemImage(row),
        total: getRefundedItemTotal(row)
      };
    });
  }

  function getRefundedItemTitle(row) {
    return getText(row, 'td.baobei div.desc', 'refunded item title', SEVERITY_ERROR);
  }

  function getRefundedItemImage(row) {
    return getAttribute(row, 'td.baobei a.pic img', 'src', 'refunded item image', SEVERITY_NONE);
  }

  function getRefundedItemTotal(row) {
    let text = getText(row, 'td.refund-cash', 'refunded item total', SEVERITY_ERROR)
    return text ? text.substring(4) : null;
  }

  function getTax(price, hasTax, hasTotalTaxOnly) {
    if (hasTax) {
      let element = getNthElement(document, 'div.final-price', 2, 'tax', SEVERITY_ERROR);
      return element ? normalizePrice(element.textContent) : null
    } else if (hasTotalTaxOnly) {
      const element = getElement(document, '.s-tax__tool', 'tax', SEVERITY_ERROR);
      const displayTax = element.getAttribute('data-amountstr');
      return displayTax;
    } else {
      // Invoices for orders before 2021-07-01 don't include any taxes
      return getZeroTax(price);
    }
  }

  function getZeroTax(price) {
    if (price.match(/\d+,\d+$/)) {
      return price.replace(/\d+,\d+$/, "0,00");
    }
    if (price.match(/\d+\.\d+$/)) {
      return price.replace(/\d+\.\d+$/, "0.00");
    }
    return '--';
  }

  function forAllElements(parent, selector, description, severity, map) {
    let elements = parent.querySelectorAll(selector);
    if (!elements) {
      recordMessage(`Could not scrape ${description}`, severity);
      return null;
    }
    let result = [];
    for (let i = 0; i < elements.length; ++i) {
      result.push(map(elements[i], i));
    }
    return result;
  }

  function getElementCount(parent, selector) {
    let elements = parent.querySelectorAll(selector);
    return !elements ? 0 : elements.length;
  }

  function getNthElement(parent, selector, n, description, severity) {
    let elements = parent.querySelectorAll(selector);
    if (!elements || elements.length < n + 1) {
      recordMessage(`Could not scrape ${description}`, severity);
      return null;
    }
    return elements[n];
  }

  function getElement(parent, selector, description, severity) {
    let element = parent.querySelector(selector);
    if (!element) {
      recordMessage(`Could not scrape ${description}`, severity);
      return null;
    }
    return element;
  }

  function getText(parent, selector, description, severity) {
    let element = getElement(parent, selector, description, severity);
    return element ? element.textContent.trim() : null;
  }

  function getAttribute(parent, selector, attribute, description, severity) {
    let element = getElement(parent, selector, description, severity);
    return element ? element.getAttribute(attribute) : null;
  }

  // Generalized PDF Builder

  class PdfBuilder {
    constructor(pageSize, margin) {
      this.doc = new PDFDocument({ size: pageSize })
      this.margin = margin
      this.yOffsets = [margin]
      this.yMax = 0
    }

    registerFont(name, buffer) {
      this.doc.registerFont(name, buffer)
    }

    setFont(font) {
      this.doc.font(font)
    }

    setFontSize(fontSize) {
      this.doc.fontSize(fontSize)
    }

    get yOffset() {
      return this.yOffsets[this.yOffsets.length - 1]
    }

    set yOffset(value) {
      this.yOffsets[this.yOffsets.length - 1] = value
    }

    pushYOffset(yMax) {
      if (yMax) {
        this.yMax = Math.max(this.yMax, yMax - this.yOffset)
      }
      this.yOffsets.push(this.yOffset + this.yMax)
      this.yMax = 0
    }

    popYOffset() {
      let yOffset = this.yOffsets.pop()
      let yMax = this.yMax
      this.yMax = 0
      return yOffset + yMax
    }

    addPage() {
      this.doc.addPage()
      this.yOffsets = [this.margin]
      this.yMax = 0
    }

    exceedsPage(y) {
      return this.yOffset + y > this.doc.page.height - this.margin
    }

    addImage(image, x, y, options) {
      this.doc.image(image, x + this.margin, y + this.margin, options)
      this.yMax = Math.max(this.yMax, y + this.getImageHeight(image, options))
    }

    getImageHeight(image, options) {
      let pdfImage = this.doc.openImage(image)
      if (options.hasOwnProperty('height')) {
        return options.height
      }
      if (options.hasOwnProperty('width')) {
        return pdfImage.height * options.width / pdfImage.width
      }
      return pdfImage.height
    }

    addText(text, x, y, options, color) {
      // Appears to be needed occasionally to get the height computation right
      if (!options.hasOwnProperty('width')) {
        options.width = this.doc.page.width - 2 * this.margin
      }

      let yOffset = y
      let height = this.doc.heightOfString(text, options)

      if (this.exceedsPage(y + height)) {
        this.addPage()
        yOffset = 0
      }

      this.doc.fillColor(color ? color : '#000').text(this.sanitize(text), x + this.margin, yOffset + this.yOffset, options)
      this.yMax = Math.max(this.yMax, yOffset + height)
    }

    sanitize(text) {
      return text
        .replace('\uFFE1', '\u00A3') // Use regular instead of full-width Pound sign, the latter may not be contained in all fonts
    }

    addTable(rows, y, rowSpacing, columnSpacing, columnToExpand, getHLine, getFont, getFontSize, getOptions, getColor) {
      let lineObjects = this.createLineObjects(rows, getFont, getFontSize, getOptions, getColor)
      let columnWidths = this.computeColumnWidths(lineObjects, columnSpacing, columnToExpand)

      let yOffset = y
      for (let i = 0; i < lineObjects.length; ++i) {
        let maxHeight = 0
        for (let j = 0; j < lineObjects[i].length; ++j) {
          // Apply column width to all line options
          for (let k = 0; k < lineObjects[i][j].length; ++k) {
            lineObjects[i][j][k].options.width = columnWidths[j]
          }

          // Compute row height
          let cellHeight = 0
          for (let k = 0; k < lineObjects[i][j].length; ++k) {
            let line = lineObjects[i][j][k]
            this.doc.font(line.font)
            this.doc.fontSize(line.fontSize)
            cellHeight += this.doc.heightOfString(line.text, line.options)
          }
          maxHeight = Math.max(maxHeight, cellHeight)
        }

        // Check if page break is needed, otherwise ad h-line if needed
        if (this.exceedsPage(yOffset + maxHeight)) {
          this.addPage()
          yOffset = 0
        } else if (getHLine(i)) {
          this.doc
            .moveTo(this.margin, this.yOffset + yOffset - rowSpacing)
            .lineTo(this.doc.page.width - this.margin, this.yOffset + yOffset - rowSpacing)
            .stroke()
        }

        // Add cell contents
        let xOffset = 0
        for (let j = 0; j < lineObjects[i].length; ++j) {
          let cellOffset = yOffset
          for (let k = 0; k < lineObjects[i][j].length; ++k) {
            let line = lineObjects[i][j][k]
            this.doc.font(line.font)
            this.doc.fontSize(line.fontSize)
            this.addText(line.text, xOffset, cellOffset, line.options, line.color)
            cellOffset += this.doc.heightOfString(line.text, line.options)
          }
          xOffset += columnWidths[j] + columnSpacing
        }

        yOffset += maxHeight + rowSpacing
      }

      // Add final h-line if needed
      if (getHLine(rows.length)) {
        this.doc
          .moveTo(this.margin, this.yOffset + yOffset - rowSpacing)
          .lineTo(this.doc.page.width - this.margin, this.yOffset + yOffset - rowSpacing)
          .stroke()
      }
    }

    createLineObjects(rows, getFont, getFontSize, getOptions, getColor) {
      return rows.map((row, i) => {
        return row.map((cell, j) => {
          let lines = Array.isArray(cell) ? cell : [cell]
          return lines.map((line, k) => {
            return {
              text: line,
              font: getFont(i, j, k),
              fontSize: getFontSize(i, j, k),
              options: getOptions(i, j, k),
              color: getColor ? getColor(i, j, k) : null
            }
          })
        })
      })
    }

    computeColumnWidths(lineObjects, spacing, columnToExpand) {
      // Compute maximum width per column
      let maxWidths = null
      for (let i = 0; i < lineObjects.length; ++i) {
        let rowWidths = []
        for (let j = 0; j < lineObjects[i].length; ++j) {
          let cellWidth = 0
          for (let k = 0; k < lineObjects[i][j].length; ++k) {
            let line = lineObjects[i][j][k]
            this.doc.font(line.font)
            this.doc.fontSize(line.fontSize)
            cellWidth = Math.max(cellWidth, this.doc.widthOfString(line.text, line.options))
          }
          rowWidths.push(cellWidth)
        }

        if (!maxWidths) {
          maxWidths = rowWidths
        } else {
          maxWidths = maxWidths.map((width, index) => Math.max(width, rowWidths[index]))
        }
      }
      // Expand and shrink column until table fits page width
      let columnWidths = maxWidths
      columnWidths[columnToExpand] = this.doc.page.width - 2 * this.margin
      for (let i = 0; i < columnWidths.length; ++i) {
        if (i !== columnToExpand) {
          columnWidths[columnToExpand] -= columnWidths[i] + spacing
        }
      }

      return columnWidths
    }

    build() {
      return new Promise((resolve, reject) => {
        let chunks = []
        this.doc.on('data', chunks.push.bind(chunks));
        this.doc.on('end', () => { resolve(chunks) })
        this.doc.end()
      })
    }
  }

  // Invoice PDF Creation

  async function createPdf(settings, context) {
    const builder = new PdfBuilder(settings.pageSize, 72)
    const fonts = await loadAndRegisterFonts(builder, settings)
    const baseFontSize = 10

    builder.addImage(await getFile("aliexpress.png"), 0, 0, {
      width: 100
    })

    builder.pushYOffset()

    builder.setFont(fonts.bold)
    builder.setFontSize(baseFontSize * 1.5)
    builder.addText(browser.i18n.getMessage("invoice"), 0, 3, {
      align: 'left'
    })

    let yMax = builder.popYOffset()

    builder.setFont(fonts.regular)
    builder.setFontSize(baseFontSize)
    const invoiceNo = browser.i18n.getMessage("invoiceNo", context.order.number)
    builder.addText(`${invoiceNo}\n${context.order.date}`, 0, 0, {
      align: 'right'
    })

    builder.pushYOffset(yMax)

    let buyerLines = [
      context.buyer.name,
      context.buyer.street1,
      context.buyer.street2,
      [context.buyer.zip, context.buyer.city].filter(element => element).join(' '),
      context.buyer.region].filter(element => element).join('\n')

    if (settings.buyerExtraInfo) {
      if (buyerLines) {
        buyerLines += '\n'
      }
      buyerLines += settings.buyerExtraInfo
    }

    if (buyerLines) {
      builder.setFont(fonts.bold)
      builder.setFontSize(baseFontSize * 1.15)
      builder.addText(browser.i18n.getMessage("buyer"), 0, 18, {
        align: 'right'
      })

      builder.pushYOffset()

      builder.setFont(fonts.regular)
      builder.setFontSize(baseFontSize)
      builder.addText(buyerLines, 0, 3, {
        align: 'right'
      })

      yMax = builder.popYOffset()
    }

    builder.setFont(fonts.bold)
    builder.setFontSize(baseFontSize * 1.15)
    builder.addText(browser.i18n.getMessage("store"), 0, 18, {
      align: 'left'
    })

    builder.pushYOffset()

    builder.setFont(fonts.regular)
    builder.setFontSize(baseFontSize)
    builder.addText(context.store.name, 0, 3, {
      align: 'left'
    })

    builder.pushYOffset()

    builder.setFontSize(baseFontSize * 0.8)
    builder.addText(context.store.url, 0, 0, {
      align: 'left',
      link: context.store.url
    })

    builder.pushYOffset(yMax)

    builder.setFont(fonts.bold)
    builder.setFontSize(baseFontSize * 1.15)
    builder.addText(browser.i18n.getMessage("orderDetails"), 0, 18, {
      align: 'left'
    })

    builder.pushYOffset()

    let itemHeader = [
      browser.i18n.getMessage("itemName"),
      browser.i18n.getMessage("itemAmount"),
      browser.i18n.getMessage("itemPrice")
    ];
    if (!context.hasTotalTaxOnly) {
      itemHeader.push(browser.i18n.getMessage("itemTax"))
    }
    itemHeader.push(browser.i18n.getMessage("itemTotal"))

    let itemRows = [itemHeader].concat(
      context.items.map(item => {
        let titles = [item.title]
        if (item.specs) {
          titles.push(item.specs.filter(element => element).join(' | '))
        }
        let row = [titles, item.amount, item.price];
        if (!context.hasTotalTaxOnly) {
          row.push(item.tax);
        }
        row.push(item.total);
        return row;
      }));

    builder.addTable(itemRows, 9, 6, 6, 0,
      (i) => {
        return i === 1 || i === itemRows.length
      },
      (i, j, k) => {
        return i === 0 ? fonts.bold : j === 0 && k > 0 ? fonts.light : fonts.regular
      },
      (i, j, k) => {
        return j === 0 && k > 0 ? baseFontSize * 0.8 : baseFontSize
      },
      (i, j, k) => {
        let options = {}
        if (j === 0) {
          options.align = 'left'
        } else {
          options.align = 'right'
        }
        return options
      },
      (i, j, k) => {
        if (i !== 0 && j === 0 && k > 0) {
          return '#444'
        }
        return null
      })

    builder.pushYOffset()

    let totalRows = [
      [browser.i18n.getMessage("productTotal"), context.productTotal],
      [browser.i18n.getMessage("shipping"), context.shipping],
      [browser.i18n.getMessage("total"), context.total]
    ]
    if (context.tax) {
      totalRows.splice(2, 0, [browser.i18n.getMessage("tax"), context.tax]);
    }
    if (context.discount) {
      for (let i = context.discount.length - 1; i >= 0; --i) {
        totalRows.splice(1, 0, [browser.i18n.getMessage("discount"), `- ${context.discount[i]}`]);
      }
    }

    builder.addTable(totalRows, 9, 6, 6, 0,
      (i) => {
        return false
      },
      (i, j, k) => {
        return i === totalRows.length - 1 ? fonts.bold : fonts.regular
      },
      (i, j, k) => {
        return baseFontSize
      },
      (i, j, k) => {
        let options = {}
        options.align = 'right'
        return options
      })

    builder.pushYOffset()

    if (context.payment && context.payment.length) {
      builder.setFont(fonts.bold)
      builder.setFontSize(baseFontSize * 1.15)
      builder.addText(browser.i18n.getMessage("payment"), 0, 18, {
        align: 'left'
      })

      builder.pushYOffset()

      let paymentRows = context.payment.map(item => { return [item.amount, item.title] })

      builder.addTable(paymentRows, 3, 6, 6, 1,
        (i) => {
          return false
        },
        (i, j, k) => {
          return fonts.regular
        },
        (i, j, k) => {
          return baseFontSize
        },
        (i, j, k) => {
          let options = {}
          options.align = 'left'
          return options
        })

      builder.pushYOffset()
    }

    if (context.logistics.shippingCompany || context.logistics.trackingNumber) {
      builder.setFont(fonts.bold)
      builder.setFontSize(baseFontSize * 1.15)
      builder.addText(browser.i18n.getMessage("logistics"), 0, 18, {
        align: 'left'
      })

      builder.pushYOffset()

      if (context.logistics.shippingCompany) {
        builder.setFont(fonts.regular)
        builder.setFontSize(baseFontSize)
        builder.addText(browser.i18n.getMessage("shippingCompany", context.logistics.shippingCompany), 0, 3, {
          align: 'left'
        })

        builder.pushYOffset()
      }

      if (context.logistics.trackingNumber) {
        builder.setFont(fonts.regular)
        builder.setFontSize(baseFontSize)
        builder.addText(browser.i18n.getMessage("trackingNumber", context.logistics.trackingNumber), 0, 3, {
          align: 'left'
        })

        builder.pushYOffset()
      }
    }

    if (context.refundedItems && context.refundedItems.length) {
      builder.setFont(fonts.bold)
      builder.setFontSize(baseFontSize * 1.15)
      builder.addText(browser.i18n.getMessage("refundInformation"), 0, 18, {
        align: 'left'
      })

      builder.pushYOffset()

      let refundedItemRows = [[
        browser.i18n.getMessage("itemName"),
        browser.i18n.getMessage("itemRefund")
      ]].concat(context.refundedItems.map(item => [item.title, item.total]))

      builder.addTable(refundedItemRows, 9, 6, 6, 0,
        (i) => {
          return i === 1
        },
        (i, j, k) => {
          return i === 0 ? fonts.bold : fonts.regular
        },
        (i, j, k) => {
          return baseFontSize
        },
        (i, j, k) => {
          let options = {}
          if (j === 0) {
            options.align = 'left'
          } else {
            options.align = 'right'
          }
          return options
        })

      builder.pushYOffset()
    }

    builder.setFont(fonts.regular)
    builder.setFontSize(baseFontSize)
    builder.addText(browser.i18n.getMessage("disclaimer"), 0, 18, {
      align: 'left',
      oblique: true
    })

    return await builder.build()
  }

  async function loadAndRegisterFonts(builder, settings) {
    let light, regular, bold;
    if (settings.font === 'droid-sans') {
      light = 'DroidSansFallback'
      regular = 'DroidSansFallback'
      bold = 'DroidSans-Bold'
      builder.registerFont(light, await getFile(`fonts/${light}.ttf`))
      builder.registerFont(regular, await getFile(`fonts/${regular}.ttf`))
      builder.registerFont(bold, await getFile(`fonts/${bold}.ttf`))
    } else if (settings.font === 'helvetica') {
      light = 'Helvetica'
      regular = 'Helvetica'
      bold = 'Helvetica-Bold'
    } else if (settings.font === 'times') {
      light = 'Times-Roman'
      regular = 'Times-Roman'
      bold = 'Times-Bold'
    }
    return {light, regular, bold}
  }

  async function getFile(path) {
    let response = await fetch(new Request(browser.extension.getURL(path)))
    let buffer = await response.arrayBuffer()
    return buffer
  }
})();
