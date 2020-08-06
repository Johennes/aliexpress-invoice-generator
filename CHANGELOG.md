# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog] and this project adheres to [Semantic Versioning].

## [Unreleased]

### Added

- Inline settings button on order details page
- Feedback paragraph in preferences
- New onboarding page to explain usage
- Onboarding page and changelog linked from preferences

### Changed

- New logo
- Colorize inline buttons to set them apart from normal page content

### Fixed

- Use embedded font (OpenSans) to avoid missing glyphs (e.g. £) on some operating systems
- Make inline print button placement more robust (sometimes did not show)

## [2.3.0] - 2020-08-02

### Added

- Allow specification of additional lines for buyer section in preferences (#3)
- Display changelog on add-on update

## [2.2.0] - 2020-06-18

### Changed

- Download PDF instead of opening it in new tab

## [2.1.0] - 2020-02-15

### Added

- Insert always-zero tax line item in total breakdown

### Changed

- Replace "Order 123..." with "Invoice 123..."

## [2.0.0] - 2019-12-12

### Added

- Page action as a secondary way to create the PDF

### Changed

- Generate PDFs directly inside the extension without relying on the print interface

### Removed

- Article icon in line item

## [1.0.0] - 2019-09-24

### Changed

- Prevent page margin hacks and let the user configure the margin via print preview (#1)

### Fixed

- Add support for buyer addresses with 2 lines (#2)
- Only show discount when available

## [0.1.0] - 2019-08-31

### Added

- Support for order discounts
- Disclaimer about inaccuracies due to currency conversions

### Fixed

- Use payment date as a fallback for the order date if the latter isn't available

## [0.0.1] - 2019-08-16

Initial release

[Keep a Changelog]: https://keepachangelog.com/en/1.0.0/
[Semantic Versioning]: https://semver.org/spec/v2.0.0.html
[Unreleased]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/2.3.0...master
[2.3.0]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/2.2.0...2.3.0
[2.2.0]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/2.1.0...2.2.0
[2.1.0]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/2.0.0...2.1.0
[2.0.0]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/1.0.0...2.0.0
[1.0.0]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/0.1.0...1.0.0
[0.1.0]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/0.0.1...0.1.0
[0.0.1]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/src/tag/0.0.1
