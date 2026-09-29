/**
 * Google AdSense Privacy & Messaging (Google CMP) Integration Utility
 *
 * Follows the official Google AdSense Privacy & Messaging specification:
 * - Uses Google-certified CMP for European regulations (EEA, UK, Switzerland)
 * - Complies with IAB TCF v2.2 consent signaling
 * - Provides consent revocation/options via `googlefc.callbackQueue`
 */

/**
 * Triggers Google's official Privacy & Messaging consent revocation message.
 * Pushes to `window.googlefc.callbackQueue` in accordance with Google's CMP documentation.
 * Allows visitors in the EEA, UK, and Switzerland to change or revoke advertising consent at any time.
 */
export const openGoogleConsentSettings = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  // Pre-initialize googlefc namespace if not already present
  window.googlefc = window.googlefc || {};
  window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];

  if (typeof window.googlefc.showRevocationMessage === 'function') {
    try {
      window.googlefc.callbackQueue.push(window.googlefc.showRevocationMessage);
      return true;
    } catch (err) {
      console.warn('[Google CMP] Error pushing revocation message to callbackQueue:', err);
      return false;
    }
  }

  // If the library is still initializing, push a deferred invocation into the queue
  try {
    window.googlefc.callbackQueue.push(() => {
      if (typeof window.googlefc?.showRevocationMessage === 'function') {
        window.googlefc.showRevocationMessage();
      } else {
        console.info(
          '[Google CMP] Consent revocation message is presented to users in the EEA, UK, or Switzerland once European regulations messages are published in Google AdSense Privacy & messaging.'
        );
      }
    });
    return true;
  } catch (err) {
    console.warn('[Google CMP] Failed to queue consent settings request:', err);
    return false;
  }
};

/**
 * Checks whether Google's Funding Choices / Privacy & Messaging object is active on window.
 */
export const isGoogleCmpActive = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window.googlefc && typeof window.googlefc === 'object');
};
