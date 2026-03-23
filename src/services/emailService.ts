import emailjs from "@emailjs/browser";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_38rmdbg";
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_0r2x32j";
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "yKmn1KLmcgB0PesMd";

// Initialize EmailJS with the public key — REQUIRED before any send() call
emailjs.init(PUBLIC_KEY);
console.log("✅ EmailJS initialized with public key:", PUBLIC_KEY);

/**
 * Sends a branded Aether welcome email to new users.
 * Fire-and-forget: errors are logged but never block the login flow.
 */
export async function sendWelcomeEmail(
  userName: string,
  userEmail: string
): Promise<void> {
  console.log("📧 sendWelcomeEmail called for:", userName, userEmail);

  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn(
      "⚠️ EmailJS not configured — skipping welcome email.",
      { SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY: PUBLIC_KEY ? "SET" : "MISSING" }
    );
    return;
  }

  const templateParams = {
    to_name: userName || "Explorer",
    to_email: userEmail,
    logo_url:
      "https://img.icons8.com/fluency/96/lightning-bolt.png", // fallback icon
    // The HTML body is defined in the EmailJS template (see below).
    // We pass dynamic variables here for the template to interpolate.
    message: getWelcomeMessage(userName || "Explorer"),
  };

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log("✅ Welcome email sent to", userEmail);
  } catch (err) {
    console.error("❌ Failed to send welcome email:", err);
    // Intentionally swallowed — email failure must never block auth
  }
}

function getWelcomeMessage(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#050508;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#050508;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background-color:#0a0a14;border:1px solid #1a1a2e;border-radius:24px;overflow:hidden;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding:40px 40px 20px;text-align:center;">
              <div style="display:inline-block;background:linear-gradient(135deg,#c8a44e,#e8c86e);width:64px;height:64px;border-radius:16px;line-height:64px;text-align:center;margin-bottom:16px;">
                <span style="font-size:32px;">⚡</span>
              </div>
              <h1 style="margin:12px 0 0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                AETHER
              </h1>
              <p style="margin:4px 0 0;font-size:12px;letter-spacing:3px;color:#c8a44e;text-transform:uppercase;">
                Intelligence Network
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,#1a1a2e,#c8a44e33,#1a1a2e,transparent);"></div>
            </td>
          </tr>

          <!-- Welcome Message -->
          <tr>
            <td style="padding:32px 40px;">
              <h2 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#ffffff;">
                Welcome to the Community, ${name}! 🎉
              </h2>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#a0a0b8;">
                Your neural link has been established. You're now part of the Aether intelligence network — a community of forward-thinking explorers pushing the boundaries of AI.
              </p>

              <!-- Feature Cards -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:16px;background-color:#0f0f1c;border:1px solid #1a1a2e;border-radius:16px;margin-bottom:12px;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align:top;padding-right:14px;">
                          <span style="font-size:24px;">🤖</span>
                        </td>
                        <td>
                          <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#ffffff;">Premium AI Assistant</p>
                          <p style="margin:0;font-size:13px;color:#a0a0b8;line-height:1.5;">Access Aether's advanced AI for research, coding, writing, and creative tasks.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height:12px;"></td></tr>
                <tr>
                  <td style="padding:16px;background-color:#0f0f1c;border:1px solid #1a1a2e;border-radius:16px;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align:top;padding-right:14px;">
                          <span style="font-size:24px;">🌐</span>
                        </td>
                        <td>
                          <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#ffffff;">Community Access</p>
                          <p style="margin:0;font-size:13px;color:#a0a0b8;line-height:1.5;">Join a network of innovators exploring the future of artificial intelligence together.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height:12px;"></td></tr>
                <tr>
                  <td style="padding:16px;background-color:#0f0f1c;border:1px solid #1a1a2e;border-radius:16px;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align:top;padding-right:14px;">
                          <span style="font-size:24px;">🔒</span>
                        </td>
                        <td>
                          <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#ffffff;">Secure & Private</p>
                          <p style="margin:0;font-size:13px;color:#a0a0b8;line-height:1.5;">Your conversations are encrypted and private. Your data stays yours.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <a href="https://aether-ai-frontend-proj.vercel.app/chat" 
                 style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#c8a44e,#e8c86e);color:#050508;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.5px;">
                LAUNCH AETHER →
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,#1a1a2e,#c8a44e33,#1a1a2e,transparent);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;color:#c8a44e;text-transform:uppercase;font-weight:600;">
                ⚡ AETHER AI
              </p>
              <p style="margin:0;font-size:12px;color:#555570;line-height:1.6;">
                The future of intelligence, delivered.<br/>
                © ${new Date().getFullYear()} Aether. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
