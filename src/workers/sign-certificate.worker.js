import StorageService from "src/services/storage";
import ChallengeService from "src/services/challenge.service";
import AuthorizationService from "src/services/authorization.service";
import CertificateService from "src/services/certificate.service";

module.exports = ({storage, storageOptions, rootCertificate, certificateId}, done) => {
  const storageService = storage || StorageService(storageOptions);

  const challengeService = new ChallengeService({
    storage: storageService
  });

  const authorizationService = new AuthorizationService({
    challengeService,
    storage: storageService
  });

  const certificateService = new CertificateService({
    authorizationService,
    storage: storageService,
    rootCertPem: rootCertificate.pem,
    rootCertKey: rootCertificate.key
  });

  storageService.connect().then(() => {
    return certificateService.sign(certificateId);
  }).then(() => {
    done(undefined, `[Worker: Sign Certificate] Certificate signed ${certificateId}`);
  }).catch((err) => {
    done(err, undefined)
  });
};
