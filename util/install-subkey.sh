#!/bin/bash

which subkey &> /dev/null && { echo Subkey already installed!; exit 1; }

if ! which rustup >/dev/null 2>&1; then
    curl https://sh.rustup.rs -sSf | sh -s -- -y
    source ~/.cargo/env
else
    rustup update
fi

rustup default stable
rustup update nightly
rustup target add wasm32-unknown-unknown --toolchain nightly

if cargo install --force --git https://github.com/paritytech/substrate subkey; then
    echo "Subkey installed! Check if got added to PATH."
fi
