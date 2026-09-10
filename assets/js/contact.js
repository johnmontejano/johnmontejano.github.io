/* Email fallback only. Calendly uses a plain link; no embed, requests or tracking here. */
(function () {
  "use strict";

  function enhanceContact(section) {
    if (section.dataset.contactReady === "true") return;

    var email = "johnmontejano2@gmail.com";
    var subject = "Free 30-minute workflow assessment";
    var form = section.querySelector("[data-contact-form]");
    var enhancement = section.querySelector("[data-contact-enhancement]");
    var nameInput = section.querySelector("[data-contact-name]");
    var businessInput = section.querySelector("[data-contact-business]");
    var problemInput = section.querySelector("[data-contact-problem]");
    var draftPanel = section.querySelector("[data-contact-draft-panel]");
    var draftText = section.querySelector("[data-contact-draft]");
    var draftStatus = section.querySelector("[data-contact-draft-status]");
    var copyDraft = section.querySelector("[data-contact-copy-draft]");
    var copyStatus = section.querySelector("[data-contact-copy-status]");
    var copyAddress = section.querySelector("[data-contact-copy-address]");
    var addressFallback = section.querySelector("[data-contact-address-fallback]");
    var addressText = section.querySelector("[data-contact-address]");
    var addressStatus = section.querySelector("[data-contact-address-status]");

    // An incomplete integration keeps the static email route usable.
    if (![form, enhancement, nameInput, businessInput, problemInput, draftPanel,
      draftText, draftStatus, copyDraft, copyStatus, copyAddress, addressFallback,
      addressText, addressStatus].every(Boolean)) return;

    function offerManualCopy(textarea, panel, status, label) {
      panel.hidden = false;
      status.textContent = "Automatic copying wasn’t available. Select the " + label +
        " shown here and use your device’s Copy command.";
      textarea.focus();
      textarea.select();
    }

    async function copyText(textarea, panel, status, label, successMessage) {
      status.textContent = "";
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
          offerManualCopy(textarea, panel, status, label);
          return;
        }
        await navigator.clipboard.writeText(textarea.value);
        status.textContent = successMessage;
      } catch (error) {
        offerManualCopy(textarea, panel, status, label);
      }
    }

    copyAddress.addEventListener("click", function () {
      copyText(addressText, addressFallback, addressStatus, "email address",
        "Email address copied. Paste it into your email app.");
    });

    copyDraft.addEventListener("click", function () {
      copyText(draftText, draftPanel, copyStatus, "email draft",
        "Email draft copied. Paste it into an email to " + email +
        ". Nothing has been sent here. For email requests, John confirms a time by email.");
    });

    form.addEventListener("input", function (event) {
      if (event.target !== nameInput && event.target !== businessInput &&
        event.target !== problemInput) return;
      if (event.target === nameInput || event.target === businessInput) {
        event.target.setCustomValidity("");
      }
      // A changed form should never offer an old draft as its current result.
      draftPanel.hidden = true;
      draftText.value = "";
      draftStatus.textContent = "";
      copyStatus.textContent = "";
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      // Also protect integrations that omitted the snippet's non-whitespace pattern.
      nameInput.setCustomValidity(nameInput.value.trim() ? "" : "Enter your name.");
      businessInput.setCustomValidity(businessInput.value.trim() ? "" : "Enter your business name.");
      if (!form.reportValidity()) return;

      var name = nameInput.value.trim();
      var business = businessInput.value.trim();
      var problem = problemInput.value.trim();
      var body = "Hi John,\r\n\r\nI’d like to request a free 30-minute workflow assessment conversation." +
        "\r\n\r\nName: " + name + "\r\nBusiness: " + business +
        (problem ? "\r\n\r\nThe repeated task I’d like to discuss:\r\n" + problem : "") +
        "\r\n\r\nCould we agree a time by email?\r\n\r\nThanks,\r\n" + name;
      var mailto = "mailto:" + email + "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      draftText.value = "To: " + email + "\r\nSubject: " + subject + "\r\n\r\n" + body;
      draftPanel.hidden = false;
      copyStatus.textContent = "";
      // A mailto handoff cannot prove that an app opened or that email was sent.
      draftStatus.textContent = "Draft prepared. If your email app opened, review and send it there. " +
        "Nothing was sent here. For email requests, John confirms a time by email. You can also copy the draft below.";

      try {
        window.location.href = mailto;
      } catch (error) {
        draftStatus.textContent = "The email link couldn’t open. Copy the draft below into your email app. " +
          "Nothing was sent here. For email requests, John confirms a time by email.";
      }
    });

    // Bind everything before exposing controls; the mailto link is always visible.
    section.dataset.contactReady = "true";
    copyAddress.hidden = false;
    enhancement.hidden = false;
  }

  function init() {
    document.querySelectorAll("[data-workflow-contact]").forEach(enhanceContact);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}());
