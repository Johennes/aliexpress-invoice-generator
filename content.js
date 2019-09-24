(function() {
	if (window.hasRun) {
		return;
	}
	window.hasRun = true;

	$(document).ready(function() {
		injectPrintElementsAndLayout();
		addPrintButton();
	});

	function injectPrintElementsAndLayout() {
		$('#_aig-template').remove();
		$('#_aig-container').remove();

		$.get(browser.runtime.getURL('template.html'), function(template) {
			$('body').prepend(template);

			var source = document.getElementById('_aig-template').innerHTML;
			var template = Handlebars.compile(source);
			var context = getContext();
			var html = template(context);

			document.getElementById('_aig-container').innerHTML = html;

			// Adjust static template image URLs to load from extension directory
			$('#_aig-container img.local').each(function() {
				$(this).attr('src', browser.extension.getURL($(this).attr('src')));
			});
		});
	}

	function getContext() {
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
			total: getTotal(),
			refundedItems: getRefundedItems()
		};
	}

	function getOrderNumber() {
		return $('.order-no').text();
	}

	function getOrderDate() {
		var result = $('#operate-pnl li:last span').text().trim();
		if (!result) {
			result = $('td.pay-c4').text().trim();
		}
		return result;
	}

	function getStoreName() {
		return $('.user-name-text a').eq(0).text();
	}

	function getStoreUrl() {
		return $('.user-name-text a').attr('href').replace(/^\/*/, '').replace(/\?.*/, '');
	}

	function getBuyerName() {
		return $('.user-shipping span[i18entitle="Contact Name"]').text();
	}

	function getBuyerStreet1() {
		let lines = document.querySelectorAll('ul#user-shipping-list li.long')
		if (lines.length > 0) {
			return lines[0].querySelector('span').textContent.trim()
		}
	}

	function getBuyerStreet2() {
		let lines = document.querySelectorAll('ul#user-shipping-list li.long')
		if (lines.length > 2) {
			return lines[1].querySelector('span').textContent.trim()
		}
	}

	function getBuyerCityRegion() {
		let lines = document.querySelectorAll('ul#user-shipping-list li.long')
		if (lines.length > 1) {
			return lines[lines.length - 1].querySelector('span').textContent.trim()
		}
	}

	function getBuyerCity() {
		var cityRegion = getBuyerCityRegion();
		var elements = cityRegion.split(',').map(function(element) { return element.trim() });
		var cityElements = elements.slice(0, Math.max(1, elements.length - 2))
		return cityElements.join(', ')
	}

	function getBuyerRegion() {
		var cityRegion = getBuyerCityRegion();
		var elements = cityRegion.split(',').map(function(element) { return element.trim() });
		var regionElements = elements.slice(Math.max(1, elements.length - 2))
		return regionElements.join(', ')
	}

	function getBuyerZip() {
		return $('.user-shipping span[i18entitle="Zip Code"]').text();
	}

	function getItems() {
		return $('table#TP_ProductTable tr.order-bd').map(function() {
			return {
				title: $(this).find('td.baobei a.baobei-name').text().trim(),
				subtitle: $(this).find('td.baobei div.spec').text().trim().replace(/\s\s+/g, ' '),
				image: $(this).find('td.baobei a.pic img').attr('src'),
				amount: $(this).find('td.quantity').text().trim(),
				price: $(this).find('td.price').text().trim(),
				total: $(this).find('td.amount').text().trim()
			};
		}).toArray();
	}

	function getShippingTotal() {
		return $('div.final-price').eq(1).text().substring(4);
	}

	function getTotal() {
		return $('div.final-price').eq(2).text().substring(4);
	}

	function getDiscount() {
		var lines = $('td.discount-price').html().trim().split('<br');
		if (lines.length < 2) {
			return null;
		}
		return lines[1].replace(/^[\/>\s]+/g, '').substring(4);
	}

	function getRefundedItems() {
		return $('table#tp-refund-amount-table tbody tr.order-bd').map(function() {
			return {
				title: $(this).find('td.baobei div.desc').text().trim(),
				image: $(this).find('td.baobei a.pic img').attr('src'),
				total: $(this).find('td.refund-cash').text().trim().substring(4)
			};
		}).toArray();
	}

	function addPrintButton() {
		$('#_aig-print-button').remove();
		var button = $('.order-operate button').eq(0).clone();
		button.html('Print');
		button.attr('id', '_aig-print-button');
		button.click(function() {
			let port = browser.runtime.connect();
			port.postMessage();
		});
		$('.order-operate').append(button);
	}
})();
