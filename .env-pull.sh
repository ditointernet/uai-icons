#!/bin/bash

create_env () {
    local token=""
    if [ -f ./.env ];
    then
        token="$(sed -n 's/^TOKEN=//p' .env)"
    fi

    local file
    file="$(gh variable get FIGMA_FILE)" || {
        echo "$(tput setaf 1)Could not read FIGMA_FILE. Run 'gh auth login' first.$(tput sgr0)"
        exit 1
    }

    printf 'TOKEN=%s\nFILE=%s\n' "$token" "$file" > .env
    echo "$(tput setaf 2)ENV file was created!$(tput sgr0)"

    if [ -z "$token" ];
    then
        echo "$(tput setaf 3)TOKEN is empty. Create your own Figma token:$(tput sgr0)"
        echo "  Figma → Settings → Security → Personal access tokens"
        echo "  Scope: only File content (read-only), everything else No access"
        echo "Then paste it in .env: TOKEN=figd_..."
    fi
}

if command -v gh &>/dev/null;
then
    create_env
else
    echo "$(tput setaf 1)Github Cli could not be found$(tput sgr0)"
    echo "Please install: https://cli.github.com/"
fi
