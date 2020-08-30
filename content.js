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
  addButtons()

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
    let settings = await loadSettings()
    let context = getContext()
    let chunks = await createPdf(settings, context)
    let port = browser.runtime.connect()
    port.postMessage({ action: 'store-pdf', chunks: chunks, date: context.order.date, number: context.order.number })
  }

  async function loadSettings() {
    let result = await browser.storage.sync.get(['pageSize', 'buyerExtraInfo'])
    return {
      pageSize: result.hasOwnProperty('pageSize') ? result.pageSize : 'A4',
      buyerExtraInfo: result.hasOwnProperty('buyerExtraInfo') ? result.buyerExtraInfo : ''
    }
  }
  
  function onConnect(port) {
    port.onMessage.addListener((message) => {
      port.disconnect()
      storePdf()
    })
  }

  // Invoice Data Extraction

  function getContext() {
		let total = getTotal()
		let tax = getTax(total)
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
				name: getBuyerName(),
				street1: getBuyerStreet1(),
				street2: getBuyerStreet2(),
				zip: getBuyerZip(),
				city: getBuyerCity(),
				region: getBuyerRegion()
			},
			items: getItems(),
			shipping: getShippingTotal(),
			discount: getDiscount(),
			tax: tax,
			total: total,
			refundedItems: getRefundedItems()
		};
	}

	function getOrderNumber() {
    let element = document.querySelector('.order-no')
    if (!element) {
      console.error('Could not scrape order number');
      return null;
    }
		return element.textContent.trim();
	}

	function getOrderDate() {
    let date = getOrderDateFromOperatePanel();
    if (!date) {
      date = getOrderDateFromPayment();
    }
    if (!date) {
      console.error('Could not scrape order date');
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
    let element = document.querySelector('td.pay-c4');
    if (!element) {
      return null;
    }
    return element.textContent.trim();
  }

	function getStoreName() {
    let element = document.querySelector('.user-name-text a')
    if (!element) {
      console.error('Could not scrape store name');
      return null;
    }
    return element.textContent.trim();
	}

	function getStoreUrl() {
    let element = document.querySelector('.user-name-text a')
    if (!element) {
      console.error('Could not scrape store URL');
      return null;
    }
    return element.getAttribute('href').replace(/^\/*/, '').replace(/\?.*/, '');
	}

	function getBuyerName() {
    let element = document.querySelector('.user-shipping span[i18entitle="Contact Name"]')
    if (!element) {
      console.error('Could not scrape buyer name');
      return null;
    }
    return element.textContent.trim();
	}

	function getBuyerStreet1() {
		let lines = document.querySelectorAll('ul#user-shipping-list li.long')
		if (!lines || lines.length === 0) {
      console.error('Could not scrape buyer street line 1');
      return null;
    }
    let span = lines[0].querySelector('span')
    if (!span) {
      return lines[0].textContent.trim()
    }
    return span.textContent.trim()
	}

	function getBuyerStreet2() {
    let lines = document.querySelectorAll('ul#user-shipping-list li.long')
		if (!lines || lines.length <= 2) {
      console.warn('Could not scrape buyer street line 2');
      return null;
    }
    let span = lines[1].querySelector('span')
    if (!span) {
      return lines[1].textContent.trim()
    }
		return span.textContent.trim()
	}

	function getBuyerCityRegion() {
		let lines = document.querySelectorAll('ul#user-shipping-list li.long')
    if (!lines || lines.length <= 1) {
      return null;
    }
    let span = lines[lines.length - 1].querySelector('span')
    if (!span) {
      return lines[lines.length - 1].textContent.trim()
    }
    return span.textContent.trim()
	}

	function getBuyerCity() {
    let cityRegion = getBuyerCityRegion();
    if (!cityRegion) {
      console.error('Could not scrape buyer city');
      return null;
    }
		let elements = cityRegion.split(',').map(function(element) { return element.trim() });
		let cityElements = elements.slice(0, Math.max(1, elements.length - 2))
		return cityElements.join(', ')
	}

	function getBuyerRegion() {
    let cityRegion = getBuyerCityRegion();
    if (!cityRegion) {
      console.error('Could not scrape buyer region');
      return null;
    }
		let elements = cityRegion.split(',').map(function(element) { return element.trim() });
		let regionElements = elements.slice(Math.max(1, elements.length - 2))
		return regionElements.join(', ')
	}

	function getBuyerZip() {
    let element = document.querySelector('.user-shipping span[i18entitle="Zip Code"]')
    if (!element) {
      console.error('Could not scrape buyer zip');
      return null;
    }
    return element.textContent.trim();
	}

	function getItems() {
    let rows = document.querySelectorAll('table#TP_ProductTable tr.order-bd')
    if (!rows) {
      console.error('Could not scrape items');
      return null;
    }
    let result = [];
    for (let i = 0; i < rows.length; ++i) {
      result.push({
				title: getItemTitle(rows[i]),
				subtitle: getItemSubtitle(rows[i]),
				image: getItemImage(rows[i]),
				amount: getItemAmount(rows[i]),
				price: getItemPrice(rows[i]),
				total: getItemTotal(rows[i])
			});
    }
    return result;
  }

  function getItemTitle(row) {
    let element = row.querySelector('td.baobei a.baobei-name');
    if (!element) {
      console.error('Could not scrape item title');
      return null;
    }
    return element.textContent.trim();
  }

  function getItemSubtitle(row) {
    let element = row.querySelector('td.baobei div.spec');
    if (!element) {
      console.error('Could not scrape item subtitle');
      return null;
    }
    return element.textContent.trim().replace(/\s\s+/g, ' ');
  }

  function getItemImage(row) {
    let element = row.querySelector('td.baobei a.pic img');
    if (!element) {
      console.error('Could not scrape item image');
      return null;
    }
    return element.getAttribute('src');
  }

  function getItemAmount(row) {
    let element = row.querySelector('td.quantity');
    if (!element) {
      console.error('Could not scrape item amount');
      return null;
    }
    return element.textContent.trim();
  }

  function getItemPrice(row) {
    let element = row.querySelector('td.price');
    if (!element) {
      console.error('Could not scrape item price');
      return null;
    }
    return element.textContent.trim();
  }

  function getItemTotal(row) {
    let element = row.querySelector('td.amount');
    if (!element) {
      console.error('Could not scrape item total');
      return null;
    }
    return element.textContent.trim();
  }

	function getShippingTotal() {
    let elements = document.querySelectorAll('div.final-price');
    if (!elements || elements.length < 2) {
      console.error('Could not scrape shipping total');
      return null;
    }
    return elements[1].textContent.substring(4).trim();
	}

	function getTotal() {
    let elements = document.querySelectorAll('div.final-price');
    if (!elements || elements.length < 3) {
      console.error('Could not scrape total');
      return null;
    }
    return elements[2].textContent.substring(4).trim();
	}

	function getDiscount() {
    let element = document.querySelector('td.discount-price');
    if (!element) {
      return null;
    }
    let lines = element.innerHTML.trim().split('<br');
		if (lines.length < 2) {
			return null;
		}
		return lines[1].replace(/^[\/>\s]+/g, '').substring(4).trim();
	}

	function getRefundedItems() {
    let rows = document.querySelectorAll('table#tp-refund-amount-table tbody tr.order-bd');
    if (!rows) {
      return null
    }
    let result = [];
    for (let i = 0; i < rows.length; ++i) {
      result.push({
				title: getRefundedItemTitle(rows[i]),
				image: getRefundedItemImage(rows[i]),
				total: getRefundedItemTotal(rows[i])
			});
    }
    return result;
  }

  function getRefundedItemTitle(row) {
    let element = row.querySelector('td.baobei div.desc');
    if (!element) {
      console.error('Could not scrape refunded item title');
      return null;
    }
    return element.textContent.trim();
  }

  function getRefundedItemImage(row) {
    let element = row.querySelector('td.baobei a.pic img');
    if (!element) {
      console.error('Could not scrape refunded item image');
      return null;
    }
    return element.getAttribute('src');
  }

  function getRefundedItemTotal(row) {
    let element = row.querySelector('td.refund-cash');
    if (!element) {
      console.error('Could not scrape refunded item total');
      return null;
    }
    return element.textContent.trim().substring(4);
  }

	function getTax(price) {
		if (price.match(/\d+,\d+$/)) {
			return price.replace(/\d+,\d+$/, "0,00");
		}
		if (price.match(/\d+\.\d+$/)) {
			return price.replace(/\d+\.\d+$/, "0.00");
		}
		return null;
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

    addText(text, x, y, options) {
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

      this.doc.text(this.sanitize(text), x + this.margin, yOffset + this.yOffset, options)
      this.yMax = Math.max(this.yMax, yOffset + height)
    }

    sanitize(text) {
      return text
        .replace('\uFFE1', '\u00A3') // Use regular instead of full-width Pound sign, the latter may not be contained in all fonts
    }

    addTable(rows, y, rowSpacing, columnSpacing, getHLine, getFont, getFontSize, getOptions) {
      let lineObjects = this.createLineObjects(rows, getFont, getFontSize, getOptions)
      let columnWidths = this.computeColumnWidths(lineObjects, columnSpacing)

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
            this.addText(line.text, xOffset, cellOffset, line.options)
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

    createLineObjects(rows, getFont, getFontSize, getOptions) {
      return rows.map((row, i) => {
        return row.map((cell, j) => {
          let lines = Array.isArray(cell) ? cell : [cell]
          return lines.map((line, k) => {
            return {
              text: line,
              font: getFont(i, j, k),
              fontSize: getFontSize(i, j, k),
              options: getOptions(i, j, k)
            }
          })
        })
      })
    }

    computeColumnWidths(lineObjects, spacing) {
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
      // Shrink first column until table fits page width
      let columnWidths = maxWidths
      columnWidths[0] = this.doc.page.width - 2 * this.margin
      for (let i = 0; i < columnWidths.length; ++i) {
        if (i != 0) {
          columnWidths[0] -= columnWidths[i] + spacing
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
    let font = 'OpenSans'
    let lightFont = `${font}-Light`
    let regularFont = `${font}-Regular`
    let boldFont = `${font}-Bold`
    let baseFontSize = 10

    let builder = new PdfBuilder(settings.pageSize, 72)

    builder.registerFont(lightFont, await getFile(`fonts/${lightFont}.ttf`))
    builder.registerFont(regularFont, await getFile(`fonts/${regularFont}.ttf`))
    builder.registerFont(boldFont, await getFile(`fonts/${boldFont}.ttf`))

    builder.addImage(await getFile("aliexpress.png"), 0, 0, {
      width: 100
    })

    builder.pushYOffset()

    builder.setFont(boldFont)
    builder.setFontSize(baseFontSize * 1.5)
    builder.addText('Invoice', 0, 3, {
      align: 'left'
    })

    let yMax = builder.popYOffset()

    builder.setFont(regularFont)
    builder.setFontSize(baseFontSize)
    builder.addText(`Invoice No. ${context.order.number}\n${context.order.date}`, 0, 0, {
      align: 'right'
    })

    builder.pushYOffset(yMax)

    builder.setFont(boldFont)
    builder.setFontSize(baseFontSize * 1.15)
    builder.addText('Buyer', 0, 18, {
      align: 'right'
    })

    builder.pushYOffset()

    let buyerLines = [
      context.buyer.name,
      context.buyer.street1,
      context.buyer.street2,
      `${context.buyer.zip} ${context.buyer.city}`,
      context.buyer.region].filter(element => element).join('\n')

    if (settings.buyerExtraInfo) {
      buyerLines += `\n${settings.buyerExtraInfo}`
    }

    builder.setFont(regularFont)
    builder.setFontSize(baseFontSize)
    builder.addText(buyerLines, 0, 3, {
      align: 'right'
    })

    yMax = builder.popYOffset()

    builder.setFont(boldFont)
    builder.setFontSize(baseFontSize * 1.15)
    builder.addText('Store', 0, 18, {
      align: 'left'
    })

    builder.pushYOffset()

    builder.setFont(regularFont)
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

    builder.setFont(boldFont)
    builder.setFontSize(baseFontSize * 1.15)
    builder.addText('Order Details', 0, 18, {
      align: 'left'
    })

    builder.pushYOffset()

    let itemRows = [["Article", "Amount", "Price", "Total"]].concat(
      context.items.map(item => [[item.title, item.subtitle], item.amount, item.price, item.total]))

    builder.addTable(itemRows, 9, 6, 6,
      (i) => {
        return i === 1 || i === itemRows.length
      },
      (i, j, k) => {
        return i === 0 ? boldFont : j === 0 && k > 0 ? lightFont : regularFont
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
      })

    builder.pushYOffset()

    let totalRows = [["Shipping", context.shipping], ["Total", context.total]]
    if (context.tax) {
      totalRows.splice(1, 0, ["Tax / VAT", context.tax])
    }
    if (context.discount) {
      totalRows.splice(1, 0, ["Discount", `- ${context.discount}`])
    }

    builder.addTable(totalRows, 9, 6, 6,
      (i) => {
        return false
      },
      (i, j, k) => {
        return i === totalRows.length - 1 ? boldFont : regularFont
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

    if (context.refundedItems.length) {
      builder.setFont(boldFont)
      builder.setFontSize(baseFontSize * 1.15)
      builder.addText('Refund Information', 0, 18, {
        align: 'left'
      })

      builder.pushYOffset()

      let refundedItemRows = [["Article", "Refund"]].concat(
        context.refundedItems.map(item => [item.title, item.total]))

      builder.addTable(refundedItemRows, 9, 6, 6,
        (i) => {
          return i === 1
        },
        (i, j, k) => {
          return i === 0 ? boldFont : regularFont
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

    builder.setFont(regularFont)
    builder.setFontSize(baseFontSize)
    builder.addText("Due to currency conversions the addition of all line items might be different from the listed total price.", 0, 18, {
      align: 'left',
      oblique: true
    })

    return await builder.build()
  }

  async function getFile(path) {
    let response = await fetch(new Request(browser.extension.getURL(path)))
    let buffer = await response.arrayBuffer()
    return buffer
  }
})();
