# Distributed set and loadtest on top of Cloudflare Durable Objects

This repository contains an extremely simple implementation of a map on top of Durable Objects.
To improve throughput, keys are sharded across durable objects by prefix. The length of this prefix is configurable.
The implementation just uses the set to check whether any values being passed into the set have previously been seen, but this concept can easily be adapted to support more complex uses of such a set, or be extended to provide map-like functionality.

The repository also includes a locust based loadtest. Poetry is used for package management, but only locust is needed, so this is very much optional.

## Repository structure

- replay-do contains the worker + durable object implementation of the hashSet
- replay-loadtest contains the locust loadtest

## Running the loadtest

The loadtest can be started with `locust --processes 20`, and configuring the loadtest parameters, and domain under which the worker is deployed in the web interface.
