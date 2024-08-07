#!/bin/bash

current_state="$1"
current_description="$2"

current_commit=$(git log -1 | sed -n "s/^commit //p")

# https://docs.github.com/en/rest/commits/statuses?apiVersion=2022-11-28#create-a-commit-status

gh api --method POST "/repos/GuarantySupportInc/uds-splitter/statuses/${current_commit}" \
                           -H "Accept: application/vnd.github+json" \
                           -f "state=${current_state}" \
                           -f "description=${current_description}" \
                           -f "context=continuous-integration/jenkins"