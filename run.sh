#!/bin/bash

if [[ ! -f pdfkit.standalone.js ]]; then
    wget https://github.com/foliojs/pdfkit/releases/download/v0.10.0/pdfkit.standalone.js
fi

npm i
node_modules/web-ext/bin/web-ext run --verbose
