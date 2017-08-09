import {
  pki as PKI,
  util as ForgeUtil,
  random as ForgeRandom
} from "node-forge";

export const generateDummyRootCertificateAndKey = () => {
  const attrs = [
    {valueTagClass: 19, value: 'CA', name: 'countryName', shortName: 'C'},
    {valueTagClass: 19, value: 'British Columbia', name: 'stateOrProvinceName', shortName: 'ST'},
    {valueTagClass: 19, value: 'Victoria', name: 'localityName', shortName: 'L'},
    {valueTagClass: 19, value: 'LE Servo Co.', name: 'organizationName', shortName: 'O'},
    {valueTagClass: 19, value: 'LE Servo Dpt.', name: 'organizationalUnitName', shortName: 'OU'},
    {valueTagClass: 19, value: 'LE Servo CA', name: 'commonName', shortName: 'CN'},
    {valueTagClass: 22, value: 'dummy-ca@test.com', name: 'emailAddress', shortName: 'E'}
  ];

  const keys = PKI.rsa.generateKeyPair(1024);
  const cert = PKI.createCertificate();

  cert.serialNumber = ForgeUtil.bytesToHex(ForgeRandom.getBytesSync(4));
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  cert.setSubject(attrs);
  cert.setIssuer(attrs);

  cert.setExtensions([
    {name: 'basicConstraints', cA: true}
  ]);

  cert.publicKey = keys.publicKey;
  cert.sign(keys.privateKey);

  return {
    pem: PKI.certificateToPem(cert),
    key: PKI.privateKeyToPem(keys.privateKey)
  };
};
