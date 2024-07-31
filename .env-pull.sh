#!/bin/bash

create_env () {
    gh variable list | grep FIGMA | tr ';' '\n' | sed -e "s/FIGMA	//; s/[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}T[0-9]\{2\}:[0-9]\{2\}:[0-9]\{2\}Z//g" | grep "\S" > .env
    echo "$(tput setaf 2)ENV file was created!$(tput sgr0)"
}

if [ "$CI" == "true" ];
then
    create_env
else
    if command -v gh &>/dev/null;
    then
        create_env
    else
        echo "$(tput setaf 1)Github Cli could not be found$(tput sgr0)"
        echo "Please install: https://cli.github.com/"
    fi
fi