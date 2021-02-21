.PHONY: help test train

EXECUTABLES = node npm
K := $(foreach exec,$(EXECUTABLES), $(if $(shell which $(exec)),some string,$(error "No $(exec) in PATH. Please install.")))

.clean:
	rm -rf lib;\
	mkdir lib

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

setup: ## Set up the environment
	npm ci;

train: ## Train the bot
	npm run train;

build: .clean ## Compile to JS
	npm run build;

slack: ## Run the bot in Slack
	export PORT=3000; npm run slack;

ms: ## Run the bot in Microsoft
	export PORT=3001; npm run microsoft;

test: ## Test the bot
	npm run test;
