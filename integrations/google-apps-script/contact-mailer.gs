var CONTACT_TO_DEFAULT = "temo.design0531@gmail.com";
var SENT_KEY_PREFIX = "contact_sent:";
var SENT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Deploy this project as a Web App:
 * - Execute as: Me
 * - Who has access: Anyone
 *
 * Script Properties required:
 * - WEBHOOK_SECRET: the same 32+ character secret used by Next.js
 * - CONTACT_TO_EMAIL: optional; defaults to temo.design0531@gmail.com
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ ok: false, error: "Missing request body" });
    }

    var payload = JSON.parse(e.postData.contents);
    var properties = PropertiesService.getScriptProperties();
    var expectedSecret = properties.getProperty("WEBHOOK_SECRET") || "";

    if (!expectedSecret || !secureEquals_(payload.secret, expectedSecret)) {
      return jsonResponse_({ ok: false, error: "Unauthorized" });
    }

    var requestId = requiredString_(payload.requestId, "requestId", 100);
    var replyTo = requiredString_(payload.replyTo, "replyTo", 254);
    var subject = requiredString_(payload.subject, "subject", 250);
    var text = requiredString_(payload.text, "text", 20000);
    var html = requiredString_(payload.html, "html", 60000);

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
      throw new Error("Invalid requestId");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) {
      throw new Error("Invalid replyTo");
    }

    var recipient = properties.getProperty("CONTACT_TO_EMAIL") || CONTACT_TO_DEFAULT;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      throw new Error("Invalid CONTACT_TO_EMAIL Script Property");
    }

    var sentKey = SENT_KEY_PREFIX + requestId;
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      cleanupOldSentKeys_(properties);

      if (properties.getProperty(sentKey)) {
        return jsonResponse_({
          ok: true,
          providerId: "apps-script:" + requestId,
          deduplicated: true,
        });
      }

      if (MailApp.getRemainingDailyQuota() < 1) {
        throw new Error("Google Apps Script daily email quota exhausted");
      }

      MailApp.sendEmail({
        to: recipient,
        replyTo: replyTo,
        subject: subject,
        body: text,
        htmlBody: html,
        name: "TEMO DESIGN 官網",
      });

      properties.setProperty(sentKey, String(Date.now()));
    } finally {
      lock.releaseLock();
    }

    return jsonResponse_({
      ok: true,
      providerId: "apps-script:" + requestId,
      deduplicated: false,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse_({
      ok: false,
      error: error && error.message ? String(error.message).slice(0, 500) : "Email delivery failed",
    });
  }
}

function requiredString_(value, fieldName, maxLength) {
  if (typeof value !== "string") {
    throw new Error("Invalid " + fieldName);
  }
  var trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    throw new Error("Invalid " + fieldName);
  }
  return trimmed;
}

function secureEquals_(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  var leftDigest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, left);
  var rightDigest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, right);
  if (leftDigest.length !== rightDigest.length) return false;

  var difference = 0;
  for (var i = 0; i < leftDigest.length; i += 1) {
    difference |= leftDigest[i] ^ rightDigest[i];
  }
  return difference === 0;
}

function cleanupOldSentKeys_(properties) {
  var now = Date.now();
  var all = properties.getProperties();
  Object.keys(all).forEach(function (key) {
    if (key.indexOf(SENT_KEY_PREFIX) !== 0) return;
    var sentAt = Number(all[key]);
    if (!Number.isFinite(sentAt) || now - sentAt > SENT_RETENTION_MS) {
      properties.deleteProperty(key);
    }
  });
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
