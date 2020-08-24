// Copyright 2020 Johannes Marbach
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
  if (chrome.app) {
    document.querySelector('#onboarding-1').setAttribute('src', '../screenshots/onboarding-1-chrome.png')
    document.querySelector('#onboarding-3').setAttribute('src', '../screenshots/onboarding-3-chrome.png')
  }
})()
