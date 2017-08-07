import Promise from "bluebird";
import get from "lodash/fp/get";
import {
  pki as PKI,
  asn1 as ASN1,
  util as ForgeUtil
} from "node-forge";

import {
  RuntimeError,
  TYPE_NOT_FOUND
} from "src/helpers/error.helper";

const caCertPem = `-----BEGIN CERTIFICATE-----\nMIIDyDCCAzGgAwIBAgIJAJd2YhQfGUB+MA0GCSqGSIb3DQEBCwUAMIGfMQswCQYD\nVQQGEwJDQTEZMBcGA1UECBMQQnJpdGlzaCBDb2x1bWJpYTERMA8GA1UEBxMIVmlj\ndG9yaWExFTATBgNVBAoTDExFIFNlcnZvIENvLjEWMBQGA1UECxMNTEUgU2Vydm8g\nRHB0LjERMA8GA1UEAxMIRHVtbXkgQ0ExIDAeBgkqhkiG9w0BCQEWEWR1bW15LWNh\nQHRlc3QuY29tMB4XDTE3MDgwNzA3MDIwNFoXDTIwMDUyNzA3MDIwNFowgZ8xCzAJ\nBgNVBAYTAkNBMRkwFwYDVQQIExBCcml0aXNoIENvbHVtYmlhMREwDwYDVQQHEwhW\naWN0b3JpYTEVMBMGA1UEChMMTEUgU2Vydm8gQ28uMRYwFAYDVQQLEw1MRSBTZXJ2\nbyBEcHQuMREwDwYDVQQDEwhEdW1teSBDQTEgMB4GCSqGSIb3DQEJARYRZHVtbXkt\nY2FAdGVzdC5jb20wgZ8wDQYJKoZIhvcNAQEBBQADgY0AMIGJAoGBANMT4Ebmi8f/\n3XRy6AIMnjhsNfkvrqPL766mScJ4rRXPFDHGt2vbFrUyKHHzCIfH4Ov1Pa/FzOX4\nRv9c+HasLhnX4okB87hKBOnPB595QHKMnYumcAPTWiEWq+gaYJDezzlXuSH/GLs3\nIoCxcZgLl4+52dXGbkZ0+xnmONoQl3bPAgMBAAGjggEIMIIBBDAdBgNVHQ4EFgQU\nO28HHLNHpOMWlJ8hWSSANCubp+4wgdQGA1UdIwSBzDCByYAUO28HHLNHpOMWlJ8h\nWSSANCubp+6hgaWkgaIwgZ8xCzAJBgNVBAYTAkNBMRkwFwYDVQQIExBCcml0aXNo\nIENvbHVtYmlhMREwDwYDVQQHEwhWaWN0b3JpYTEVMBMGA1UEChMMTEUgU2Vydm8g\nQ28uMRYwFAYDVQQLEw1MRSBTZXJ2byBEcHQuMREwDwYDVQQDEwhEdW1teSBDQTEg\nMB4GCSqGSIb3DQEJARYRZHVtbXktY2FAdGVzdC5jb22CCQCXdmIUHxlAfjAMBgNV\nHRMEBTADAQH/MA0GCSqGSIb3DQEBCwUAA4GBAIBRuEu/Fohz1BPcE2h+S4XiFHFN\nCGA+qWKo3A2GALHu8LyPzZ++mLqShFr87THnVgnmdFn45D2HlqVqCkI/MMk94DTl\nvE+aDWTkC93TwwHtcXHx8Hk5Pv0gT37tusDmchUJntQvbu5SWgIq1NNIyUT9DY8X\nQa+dMBD1fXnxn2bG\n-----END CERTIFICATE-----\n`;

const getCertificateHandler = ({
  certificateService,
  directoryService,
  params: {
    certificate_id
  }
}) => {
  return Promise.resolve().then(() => {
    if (certificate_id === "ca") {
      return {pem: caCertPem, ca: true};
    } else {
      return certificateService.get(certificate_id).catch(() => {
        throw new RuntimeError({
          message: "Certificate not found",
          type: TYPE_NOT_FOUND
        });
      }).then((certificate) => {
        return {certificate, pem: certificate.pem};
      });
    }
  }).then(({certificate, pem, ca}) => {
    return {
      certificate,
      der: ASN1.toDer(PKI.certificateToAsn1(PKI.certificateFromPem(pem))),
      ca
    };
  }).then(({certificate, der, ca}) => {
    if (ca) {
      return {
        contentType: "application/pkix-cert",
        location: directoryService.getFullUrl(`/cert/ca`),
        body: new Buffer(ForgeUtil.bytesToHex(der), "hex")
      };
    } else {
      return {
        contentType: "application/pkix-cert",
        location: directoryService.getFullUrl(`/cert/${certificate.id}`),
        links: [
          `${directoryService.getFullUrl("/cert/ca")};rel="up"`,
          `${directoryService.getFullUrl(`/accounts/TODO-fetch-account`)};rel="author"`,
        ],
        body: new Buffer(ForgeUtil.bytesToHex(der), "hex")
      };
    }
  });
};

getCertificateHandler.requestParams = {
  certificate_id: get("params.certificate_id")
};

export default getCertificateHandler;
