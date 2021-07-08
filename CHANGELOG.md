# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog] and this project adheres to [Semantic Versioning].

## [Unreleased]

Nothing at the moment

## [3.1.0] - 2021-07-08

### Added

- Add Spanish translations (thanks @Ronny)

### Fixed

- Correctly scrape taxes and total price on orders after 2021-07-01 (thanks @roadhousepc)

## [3.0.0] - 2021-04-27

### Changed

- Pick invoice language based on browser locale, currently supported languages: English, German, Italian (thanks @dentex)

## [2.10.0] - 2021-04-02

### Added

- Add option to select font (Droid Sans, Helvetica or Times)

## [2.9.0] - 2020-12-03

### Added

- Add option to exclude buyer info from order details

## [2.8.0] - 2020-10-01

### Added

- Add all item specs (e.g. color, ships from, ...) instead of just the first one

## [2.7.0] - 2020-09-13

### Added

- Add payment breakdown (including coupons)

### Fixed

- Correctly parse US$ total / shipping

## [2.6.1] - 2020-09-10

### Changed

- Exclude messages about missing optional data from the generation log

### Fixed

- Invoice generation fails on some orders when items are missing a subtitle
- Multiple tracking numbers wrap on several lines

## [2.6.0] - 2020-09-02

### Added

- Display warning and error details in generation log on page
- Include shipping company and tracking number on invoice (if available)

### Changed

- Eliminate dependency on jQuery
- Switch to Droid Sans Fallback to support Asian characters

### Fixed

- Don't display upboarding page after installing, only after updating

## [2.5.1] - 2020-08-27

### Fixed

- Fix rendering of full-width Pound signs

## [2.5.0] - 2020-08-27

### Added

- Support for Google Chrome

## [2.4.0] - 2020-08-06

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
[Unreleased]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/3.1.0...master
[3.1.0]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/3.0.0...3.1.0
[3.0.0]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/2.10.0...3.0.0
[2.10.0]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/2.9.0...2.10.0
[2.9.0]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/2.8.0...2.9.0
[2.8.0]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/2.7.0...2.8.0
[2.7.0]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/2.6.1...2.7.0
[2.6.1]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/2.6.0...2.6.1
[2.6.0]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/2.5.1...2.6.0
[2.5.1]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/2.5.0...2.5.1
[2.5.0]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/2.4.0...2.5.0
[2.4.0]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/2.3.0...2.4.0
[2.3.0]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/2.2.0...2.3.0
[2.2.0]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/2.1.0...2.2.0
[2.1.0]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/2.0.0...2.1.0
[2.0.0]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/1.0.0...2.0.0
[1.0.0]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/0.1.0...1.0.0
[0.1.0]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/compare/0.0.1...0.1.0
[0.0.1]: https://nosuchdomain.mooo.com/git/doc/aliexpress-invoice-generator/src/tag/0.0.1
