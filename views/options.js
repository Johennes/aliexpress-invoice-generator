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
  document.addEventListener('DOMContentLoaded', () => {
    restorePageSize()
    restoreBuyerFromOrder()
    restoreBuyerExtraInfo()
  })

  const pageSizeSelector = 'select[name=page-size]'
  document.querySelector(pageSizeSelector).addEventListener('change', storePageSize)

  function storePageSize() {
    browser.storage.sync.set({
      pageSize: document.querySelector(pageSizeSelector).value
    })
  }

  function restorePageSize() {
    browser.storage.sync.get('pageSize').then((result) => {
      let pageSize = result.hasOwnProperty('pageSize') ? result.pageSize : 'A4'
      document.querySelector(pageSizeSelector).value = pageSize
    })
  }

  const buyerFromOrderSelector = 'input[name=buyer-from-order]'
  document.querySelector(buyerFromOrderSelector).addEventListener('change', storeBuyerFromOrder)

  function storeBuyerFromOrder() {
    browser.storage.sync.set({
      buyerFromOrder: document.querySelector(buyerFromOrderSelector).checked
    })
  }

  function restoreBuyerFromOrder() {
    browser.storage.sync.get('buyerFromOrder').then((result) => {
      let buyerFromOrder = result.hasOwnProperty('buyerFromOrder') ? result.buyerFromOrder : true
      document.querySelector(buyerFromOrderSelector).checked = buyerFromOrder
    })
  }

  const buyerExtraInfoSelector = 'textarea[name=buyer-extra-info]'
  document.querySelector(buyerExtraInfoSelector).addEventListener('change', storeBuyerExtraInfo)

  function storeBuyerExtraInfo() {
    browser.storage.sync.set({
      buyerExtraInfo: document.querySelector(buyerExtraInfoSelector).value
    })
  }

  function restoreBuyerExtraInfo() {
    browser.storage.sync.get('buyerExtraInfo').then((result) => {
      let buyerExtraInfo = result.hasOwnProperty('buyerExtraInfo') ? result.buyerExtraInfo : ''
      document.querySelector(buyerExtraInfoSelector).value = buyerExtraInfo
    })
  }
})()