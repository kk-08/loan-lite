#!/bin/bash
check_node() {
    if node -v >> /dev/null; then
        echo "Node found"
        node -v
    else
        echo "Node missing"
        exit 1;
    fi
}

check_npm() {
    if npm -v >> /dev/null; then
        echo "NPM found"
        npm -v
    else
        echo "NPM missing"
        exit 1;
    fi
}

check_config() {
    EXAMPLE_FILE=./src/configs/config.example.json
    FILE=./src/configs/config.json
    if [ -f "$FILE" ]; then
        echo "Config exists, using the same"
    else
        echo "Copying config sample"
        cp "$EXAMPLE_FILE" "$FILE"
    fi
}

check_node
check_npm
check_config
npm i
npm start