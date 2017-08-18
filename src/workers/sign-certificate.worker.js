import StorageService from "src/services/storage";
import CertificateService from "src/services/certificate.service";

module.exports = ({storage, storageOptions, rootCertificate, certificateId}, done) => {
  const storageService = storage || StorageService(storageOptions);
  const certificateService = new CertificateService({
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
