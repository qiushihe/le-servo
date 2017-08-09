# Simple Let's Encrypt Server

This is a simple Let's Encrypt Server.

### Specification

Mostly based on https://tools.ietf.org/html/draft-ietf-acme-acme-02

However tls-sni-02 challenge type is not supported, and instead tls-sni-01 from the previous
version of the spec (https://tools.ietf.org/html/draft-ietf-acme-acme-01#section-7.3) is supported
instead.

### MongoDB

https://docs.mongodb.com/v3.0/tutorial/install-mongodb-on-os-x

### Misc. Notes

https://ietf-wg-acme.github.io/acme

Things not (going to be) implemented:

* 7.3.4. Changes of Terms of Service
* 7.3.5. External Account Binding
* 7.3.6. Account Key Roll-over
* 7.4.1. Pre-Authorization

TODO:

* URL header check filter
* Certificate service
* Download certificate handler
* Download certificate route

* URL header check filter test
* Orders list handler test
* Get authorization handler test
* Get challenge handler test
* Respond to challenge handler test
* Get order handler test
* New order handler test
* Certificate service test
* Download certificate handler test
