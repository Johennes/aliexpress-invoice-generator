# AliExpress Invoice Generator

This is a Browser extension for generating PDF invoices from AliExpress order detail
websites. At the time of writing this, AliExpress didn't offer any downloadable
invoice format. For tax reasons, I needed to be able to share the invoices in printed
form and so I ended up creating this extension.

The PDF generation is based on [PDFKit].

![](screenshots/onboarding-1.png "Two ways to create the invoice")

![](screenshots/onboarding-2.png "Generated PDF")

![](screenshots/onboarding-3.png "Extension settings")

## Installing

You can install the extension directly from the official [addons.mozilla.org] website
or from the [Chrome Web Store].

## Running (from Code)

For development and testing you can run the extension from code in an isolated browser
instance through `./web-ext run`.

## License

AliExpress Invoice Generator is licensed under the GNU General Public License as published
by the Free Software Foundation, either version 3 of the License, or (at your option) any
later version.

[PDFKit] is distributed under the MIT license.

The Droid Sans fonts are distributed under the Apache license.

[addons.mozilla.org]: https://addons.mozilla.org/firefox/addon/aliexpress-invoice-generator/
[Chrome Web Store]: https://chrome.google.com/webstore/detail/haebneihcbnfnhbdpokdbkekepnoiadn
[PDFKit]: https://github.com/foliojs/pdfkit
