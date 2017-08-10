# Simple Let's Encrypt Server

This is a simple Let's Encrypt Server.

### Specification

Mostly based on https://tools.ietf.org/html/draft-ietf-acme-acme-02

However tls-sni-02 challenge type is not supported, and instead tls-sni-01 from the previous
version of the spec (https://tools.ietf.org/html/draft-ietf-acme-acme-01#section-7.3) is supported
instead.

### Dependencies

* NodeJS
* MongoDB

### Building and running the server

To start the server without persistent storage and with `http://localhost:3000` as origin:

```
$ npm install
$ npm run build
$ npm run v1-server
```

To start the server with MongoDB storage and with a different origin:

```
$ LE_SERVO_HOST_NAME="my-acme-server.com" \
  LE_SERVO_PORT="80" \
  LE_SERVO_DB_ENGINE="mongodb" \
  LE_SERVO_DB_CONNECTION_URL="mongodb://some-mongodb.server:27017/le-servo-db" \
  npm run v1-server
```

To start an local instance of MongoDB:

```
$ LE_SERVO_HOST_NAME="my-acme-server.com" \
  LE_SERVO_PORT="80" \
  LE_SERVO_DB_ENGINE="mongodb" \
  LE_SERVO_DB_CONNECTION_URL="mongodb://localhost:27017/le-servo-dev" \
  ./run-with-db.sh v1-server
```

By default the server will generate dummy root certificate and key to sign requested certificates.
To provide a different set of root certificate/key:

```
$ LE_SERVO_HOST_NAME="my-acme-server.com" \
  LE_SERVO_PORT="80" \
  LE_SERVO_DB_ENGINE="mongodb" \
  LE_SERVO_DB_CONNECTION_URL="mongodb://localhost:27017/le-servo-dev" \
  LE_SERVO_ROOT_CERT_PEM="-----BEGIN CERTIFICATE-----\n..." \
  LE_SERVO_ROOT_CERT_KEY="-----BEGIN RSA PRIVATE KEY-----\n..." \
  ./run-with-db.sh v1-server
```

### TODO

* ACME v2 URL header check filter
* ACME v2 order/certificate processor
* ACEM v2 Pre-Authorization
* ACME v1 payload resource check filter
* More tests

### Things not (probably going to be) implemented:

* Changes of Terms of Service
* External Account Binding
* Account Key Roll-over
