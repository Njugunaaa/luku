type TransactionalEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type TransactionalEmailResult = {
  mode: "email" | "console";
};

function getResendApiKey() {
  return process.env.RESEND_API_KEY?.trim() ?? "";
}

function getEmailFrom() {
  return (
    process.env.EMAIL_FROM?.trim() ??
    process.env.RESEND_FROM?.trim() ??
    "Alivella Boutique <onboarding@resend.dev>"
  );
}

export function isEmailDeliveryConfigured() {
  return Boolean(getResendApiKey());
}

export async function sendTransactionalEmail(
  input: TransactionalEmailInput,
): Promise<TransactionalEmailResult> {
  const apiKey = getResendApiKey();

  if (!apiKey) {
    console.info("[email] Delivery skipped because RESEND_API_KEY is not configured.", {
      to: input.to,
      subject: input.subject,
    });
    return { mode: "console" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || "Failed to send email.");
  }

  return { mode: "email" };
}
