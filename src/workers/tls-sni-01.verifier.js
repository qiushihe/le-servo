// TODO: Convert this to a `worker-farm` child (https://github.com/rvagg/node-worker-farm)

import tls from "tls";
import crypto from "crypto";
import Promise from "bluebird";

// Note: It appears that neither Boulder nor Traefik support the "iterations" attribute, `n` as
//       described under section 7.3 of https://tools.ietf.org/html/draft-ietf-acme-acme-01.
//       That's why I'm also not going to implement that here.

const promisedConnection = (options) => {
  return new Promise((resolve, reject) => {
    try {
      const connection = tls.connect(options, () => {
        resolve(connection);
      });
    } catch (err) {
      reject(err);
    }
  });
};

export const verify = ({
  authorizationService,
  challengeService,
  challengeId
}) => {
  challengeService.get(challengeId).then(({authorizationId, keyAuthorization}) => {
    return authorizationService.get(authorizationId).then(({identifierType, identifierValue}) => {
      return {identifierType, identifierValue, keyAuthorization};
    });
  }).then(({/*identifierType, */identifierValue, keyAuthorization}) => {
    // TODO: Validate identifierType === "dns"

    const digest = crypto.createHash("sha256").update(keyAuthorization).digest("hex");
    const firstHalf = digest.slice(0, 32);
    const secondHalf = digest.slice(32);
    const zName = `${firstHalf}.${secondHalf}.acme.invalid`;

    return promisedConnection({
      host: identifierValue,
      port: 443,
      servername: zName,
      rejectUnauthorized: false
    }).then((connection) => {
      return {connection, zName};
    });
  }).then(({connection, zName}) => {
    const {subjectaltname: peerSAN} = connection.getPeerCertificate();
    const expectedSAN = `DNS:${zName}`;

    const updatePayload = peerSAN === expectedSAN
      ? {processing: false, status: "valid"}
      : {processing: false, status: "invalid"};

    return challengeService.update(challengeId, updatePayload);
  }).then((updatedChallenge) => {
    // TODO: Technically we should only mark authorization as valid if the combination requirement
    //       is satisfied.
    if (updatedChallenge.status === "valid") {
      return authorizationService.update(updatedChallenge.authorizationId, {
        status: "valid"
      });
    } else {
      return Promise.resolve();
    }
  });
};
