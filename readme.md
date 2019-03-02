# Thelas

Remote state as code. Heavily inspired by [Terraform](https://www.terraform.io/). Name comes from [Drarayne Thelas](https://en.uesp.net/wiki/Morrowind:Drarayne_Thelas) because I think she's funny.

```npm install -g thelas```

## Rationale

At [Dakimakuri](https://dakimakuri.com) we have a lot of near-identical Shopify products that must be created and updated in bulk. Historically this was a manual (and error-prone) process. Mass-updates required writing new scripts for each occasion, which is also error-prone. It worked, but is hardly ideal.

I was inspired to approach this problem similar to how [Terraform](https://www.terraform.io/) manages remote state in cloud providers. It is able to detect differences, display them, prompt for approval, and then make the changes. This is a safe, versatile, and very pedantic way to manage state.

## Project Status

Works for the most part. Shopify products and images can be created and updated using this tool. DShipChina products can be created and then referenced within the Shopify product. Multiple Shopify accounts can be manipulated at once. We have successfully audited our entire catalogue of products, minus the accessories, using this tool. It meets the goals it was originally set out to accomplish.

Some work needs to be done to make the code more stable and useable, such as tests, documentation, and more plugins.

## Todo

* ~~Create, destroy, update, and synchronize with remote state.~~
* ~~Manage Shopify products.~~
* ~~Manage Shopify product images.~~
* ~~Implement plugins, similar to Terraform's plugin system.~~
* ~~Implement provider configuration (no longer hardcode Shopify api keys).~~
* Create a nice CLI tool and binary.
* Write tests!
* Add some kind of backwards compatibility when resources change.
