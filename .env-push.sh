#!/bin/bash

update_env () {
    if [ ! -f ./.env ];
    then
         echo "$(tput setaf 1)The env file need to exists first!$(tput sgr0)"
    else
        gh variable set FIGMA --body $(grep "\S" .env | tr '\n' ';')
    fi
}

if [ "$CI" == "true" ];
then
    update_env
else
    if command -v gh &>/dev/null;
    then
        update_env
    else
        echo "$(tput setaf 1)Github Cli could not be found!$(tput sgr0)"
    fi
fi