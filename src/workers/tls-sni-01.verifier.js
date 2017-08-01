import tls from "tls";
import crypto from "crypto";

// Note: It appears that neither Boulder nor Traefik support the "iterations" attribute, `n` as
//       described under section 7.3 of https://tools.ietf.org/html/draft-ietf-acme-acme-01.
//       That's why I'm also not going to implement that here.

export const verify = ({
  // identifierType,
  identifierValue,
  challengeKeyAuthorization
}) => {
  // TODO: Validate identifierType === "dns"

  const digest = crypto.createHash("sha256").update(challengeKeyAuthorization).digest("hex");
  const firstHalf = digest.slice(0, 32);
  const secondHalf = digest.slice(32);
  const zName = `${firstHalf}.${secondHalf}.acme.invalid`;

  const connection = tls.connect({
    host: identifierValue,
    port: 443,
    servername: zName,
    rejectUnauthorized: false
  }, () => {
    const {subjectaltname: peerSAN} = connection.getPeerCertificate();
    const expectedSAN = `DNS:${zName}`;

    if (peerSAN === expectedSAN) {
      console.log("MATCH!!!");
      // TODO: Update challenge; generate certificate; etc.
    }
  });
};
