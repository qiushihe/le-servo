import fetch from "node-fetch";

import StorageService from "src/services/storage";
import ChallengeService from "src/services/challenge.service";
import AuthorizationService from "src/services/authorization.service";

module.exports = ({storage, storageOptions, challengeId}, done) => {
  const storageService = storage || StorageService(storageOptions);

  storageService.connect().then(() => {
    const challengeService = new ChallengeService({storage: storageService});
    const authorizationService = new AuthorizationService({
      storage: storageService, challengeService
    });

    return challengeService.get(challengeId).then(({authorizationId, keyAuthorization, token}) => {
      return authorizationService.get(authorizationId).then(({identifierType, identifierValue}) => {
        return {identifierType, identifierValue, keyAuthorization, token};
      });
    }).then(({/*identifierType, */identifierValue, keyAuthorization, token}) => {
      // TODO: Validate identifierType === "dns"
      const peerUrl = `http://${identifierValue}/.well-known/acme-challenge/${token}`;

      return fetch(peerUrl)
        .then((res) => res.text())
        .then((peerKeyAuthorization) => {
          const updatePayload = peerKeyAuthorization === keyAuthorization
            ? {processing: false, status: "valid", validated: new Date()}
            : {processing: false, status: "invalid"};

          return challengeService.update(challengeId, updatePayload);
        });
    }).then((updatedChallenge) => {
      // TODO: Technically we should only mark authorization as valid if the
      //       combination requirement is satisfied.
      if (updatedChallenge.status === "valid") {
        return authorizationService.update(updatedChallenge.authorizationId, {
          status: "valid"
        });
      } else {
        throw new Error(`[Worker: http-01] Invalid challenge ${challengeId}`);
      }
    });
  }).then(() => {
    done(undefined, `[Worker: http-01] Completed for challenge ${challengeId}`);
  }).catch((err) => {
    done(err, undefined)
  });
};
