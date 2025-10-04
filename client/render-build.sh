#!/bin/bash

# Install all dependencies including devDependencies
npm install

# Run the build with CI=false to ignore warnings
CI=false npm run build
