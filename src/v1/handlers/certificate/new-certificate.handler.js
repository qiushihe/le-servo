import get from "lodash/fp/get";
import isEmpty from "lodash/fp/isEmpty";
import size from "lodash/fp/size";
import {
  pki as PKI,
  asn1 as ASN1,
  util as ForgeUtil,
  random as ForgeRandom
} from "node-forge";

import {getJoseVerifiedKey} from "src/helpers/request.helper";
import {parseCsr} from "src/helpers/csr.helper";

import {
  RuntimeError,
  TYPE_NOT_FOUND,
  TYPE_FORBIDDEN,
  TYPE_UNPROCESSABLE_ENTITY
} from "src/helpers/error.helper";

const caCertPem = `-----BEGIN CERTIFICATE-----\nMIIDyDCCAzGgAwIBAgIJAJd2YhQfGUB+MA0GCSqGSIb3DQEBCwUAMIGfMQswCQYD\nVQQGEwJDQTEZMBcGA1UECBMQQnJpdGlzaCBDb2x1bWJpYTERMA8GA1UEBxMIVmlj\ndG9yaWExFTATBgNVBAoTDExFIFNlcnZvIENvLjEWMBQGA1UECxMNTEUgU2Vydm8g\nRHB0LjERMA8GA1UEAxMIRHVtbXkgQ0ExIDAeBgkqhkiG9w0BCQEWEWR1bW15LWNh\nQHRlc3QuY29tMB4XDTE3MDgwNzA3MDIwNFoXDTIwMDUyNzA3MDIwNFowgZ8xCzAJ\nBgNVBAYTAkNBMRkwFwYDVQQIExBCcml0aXNoIENvbHVtYmlhMREwDwYDVQQHEwhW\naWN0b3JpYTEVMBMGA1UEChMMTEUgU2Vydm8gQ28uMRYwFAYDVQQLEw1MRSBTZXJ2\nbyBEcHQuMREwDwYDVQQDEwhEdW1teSBDQTEgMB4GCSqGSIb3DQEJARYRZHVtbXkt\nY2FAdGVzdC5jb20wgZ8wDQYJKoZIhvcNAQEBBQADgY0AMIGJAoGBANMT4Ebmi8f/\n3XRy6AIMnjhsNfkvrqPL766mScJ4rRXPFDHGt2vbFrUyKHHzCIfH4Ov1Pa/FzOX4\nRv9c+HasLhnX4okB87hKBOnPB595QHKMnYumcAPTWiEWq+gaYJDezzlXuSH/GLs3\nIoCxcZgLl4+52dXGbkZ0+xnmONoQl3bPAgMBAAGjggEIMIIBBDAdBgNVHQ4EFgQU\nO28HHLNHpOMWlJ8hWSSANCubp+4wgdQGA1UdIwSBzDCByYAUO28HHLNHpOMWlJ8h\nWSSANCubp+6hgaWkgaIwgZ8xCzAJBgNVBAYTAkNBMRkwFwYDVQQIExBCcml0aXNo\nIENvbHVtYmlhMREwDwYDVQQHEwhWaWN0b3JpYTEVMBMGA1UEChMMTEUgU2Vydm8g\nQ28uMRYwFAYDVQQLEw1MRSBTZXJ2byBEcHQuMREwDwYDVQQDEwhEdW1teSBDQTEg\nMB4GCSqGSIb3DQEJARYRZHVtbXktY2FAdGVzdC5jb22CCQCXdmIUHxlAfjAMBgNV\nHRMEBTADAQH/MA0GCSqGSIb3DQEBCwUAA4GBAIBRuEu/Fohz1BPcE2h+S4XiFHFN\nCGA+qWKo3A2GALHu8LyPzZ++mLqShFr87THnVgnmdFn45D2HlqVqCkI/MMk94DTl\nvE+aDWTkC93TwwHtcXHx8Hk5Pv0gT37tusDmchUJntQvbu5SWgIq1NNIyUT9DY8X\nQa+dMBD1fXnxn2bG\n-----END CERTIFICATE-----\n`;

const caKeyPem = `-----BEGIN RSA PRIVATE KEY-----\nMIICXQIBAAKBgQDTE+BG5ovH/910cugCDJ44bDX5L66jy++upknCeK0VzxQxxrdr\n2xa1Mihx8wiHx+Dr9T2vxczl+Eb/XPh2rC4Z1+KJAfO4SgTpzwefeUByjJ2LpnAD\n01ohFqvoGmCQ3s85V7kh/xi7NyKAsXGYC5ePudnVxm5GdPsZ5jjaEJd2zwIDAQAB\nAoGBALo9QlksmE8KWnqh3EXankwIZoMMaFoL2dpOzKvzUDz67sWQoUxgDiQoMnmA\nR5mOac2oIBqUO1r5+qLchDopZ645YDuS256WLRlCAD/OrKGrxwt7crWpOEs9Plwc\nNy0xfvTk4tUxJP2Pn7+1C7y676+tLquYcMiL9cufvq09wHcRAkEA76DyaJTgTrYW\nPWXdoyHGwlYDZYQCiMJyDlAG6pVSqebOuT1/eMCglcFEWORyGDGhOW1rtJekLhYi\njwZbGFDkZwJBAOF/k9TsdRkFGWOXeCWV0UOg/rVtCvA+ULJQiAIPZ/FgHbYYGnKS\nWnVVLdtT0nKCOQ0QTdQRslJyn6HGlG5GGVkCQQCEz5xq8FCd73fGEcZUmuzRWuDJ\nC/BnofWbDym2LIrDVgQvUPFsmL6oIZTi+8JsvF0SOh4e2okJbgU7ZhdpE7RzAkBx\nT85VXEyrOei8Jsz09gel2CylthmdB3M9Z0Iw5tTwcb/8VLhVgj16YEcew0woxk8s\nxViWjB3zWC3m+QZ1MzxhAkBwYZG3MJr7KP2o4tHeeCvMETLjDNWUerx67MIIeKY5\nYDc1zPax41rmwLdMFbAplYjNHwTxEIrefEN1kROHOygE\n-----END RSA PRIVATE KEY-----\n`;

const newCertificateHandler = ({
  accountService,
  authorizationService,
  certificateService,
  directoryService,
  params: {
    key,
    csr
  }
}) => {
  return accountService.find({kid: key.kid}).then((account) => {
    if (!account) {
      throw new RuntimeError({message: "Account not found", type: TYPE_NOT_FOUND});
    }

    if (account && account.status === "deactivated") {
      throw new RuntimeError({message: "Account deactivated", type: TYPE_FORBIDDEN});
    }

    return account;
  }).then((account) => {
    return parseCsr(csr).then(({csr: parsedCsr, domains = []}) => {
      if (isEmpty(domains) || size(domains) > 1) {
        throw new RuntimeError({
          message: "CSR must contain exactly 1 domain",
          type: TYPE_UNPROCESSABLE_ENTITY
        });
      } else {
        return {account, domain: domains[0], parsedCsr};
      }
    });
  }).then(({account, domain, parsedCsr}) => {
    return authorizationService.find({
      accountId: account.id,
      status: "valid",
      identifierType: "dns",
      identifierValue: domain
    }).then((authorization) => {
      return {account, domain, parsedCsr, authorization};
    });
  }).then(({account, domain, parsedCsr, authorization}) => {
    // TODO: Implement the 202 scenario described under Section 7 of the spec so we can generate
    //       the certificate in a worker in stead of in the main thread.

    const caCert = PKI.certificateFromPem(caCertPem);
    const caKey = PKI.privateKeyFromPem(caKeyPem);

    const cert = PKI.createCertificate();
    cert.serialNumber = ForgeUtil.bytesToHex(ForgeRandom.getBytesSync(4));
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
    cert.setSubject([{ name: "commonName", value: domain }]);
    cert.setIssuer(caCert.subject.attributes);
    cert.setExtensions([
      {name: "basicConstraints", cA: false},
      {name: "keyUsage", digitalSignature: true, keyEncipherment: true},
      {name: "extKeyUsage", serverAuth: true},
      {name: "subjectAltName", altNames: [{ type: 2, value: domain }]}
    ]);
    cert.publicKey = parsedCsr.publicKey;
    cert.sign(caKey);

    return certificateService.create({
      status: "valid",
      authorizationId: authorization.id,
      pem: PKI.certificateToPem(cert),
      csr
    }).then((certificate) => {
      return {
        account,
        domain,
        authorization,
        certificate,
        // der: ASN1.toDer(PKI.certificateToAsn1(cert))
        der: ASN1.toDer(PKI.certificateToAsn1(PKI.certificateFromPem(certificate.pem)))
      };
    });
  }).then(({account, certificate, der}) => {
    // TODO: Return Content-Location as stable URL for this specific instance of the certificate.
    // TODO: Return Location as renewal URL for certificates under this authorization.
    return {
      contentType: "application/pkix-cert",
      location: directoryService.getFullUrl(`/cert/${certificate.id}`),
      links: [
        `${directoryService.getFullUrl("/cert/ca")};rel="up"`,
        `${directoryService.getFullUrl(`/accounts/${account.id}`)};rel="author"`,
      ],
      status: 201,
      body: new Buffer(ForgeUtil.bytesToHex(der), "hex")
    };
  });
};

newCertificateHandler.requestParams = {
  csr: get("body.csr"),
  key: getJoseVerifiedKey
};

export default newCertificateHandler;
