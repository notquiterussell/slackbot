.PHONY: help test train

EXECUTABLES = node npm
K := $(foreach exec,$(EXECUTABLES), $(if $(shell which $(exec)),some string,$(error "No $(exec) in PATH. Please install.")))

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

setup: ## Set up the environment
	npm install;

train: ## Train the bot
	npm run qna; \
	npm run smalltalk; \
	npm run train;

slack: ## Run the bot in Slack
	npm run slack;

ms: ## Run the bot in Microsoft
	npm run microsoft;
