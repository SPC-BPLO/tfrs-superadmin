import nodemailer from "nodemailer";

type ApprovalEmail = {
  email: string;
  fullName: string;
  office: "CTMO" | "FINANCE" | "BOTH";
  role: string;
};

const officeName = (office: ApprovalEmail["office"]) => office === "CTMO"
  ? "CTMO Traffic Records"
  : office === "FINANCE"
    ? "CTMO Finance"
    : "CTMO Traffic Records and CTMO Finance";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
})[character] || character);

export async function sendAccountApprovedEmail({ email, fullName, office, role }: ApprovalEmail) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;
  if (!host || !user || !password || !from) throw new Error("SMTP approval-email delivery is not configured.");

  const system = officeName(office);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass: password },
  });
  const safeName = escapeHtml(fullName);
  const safeSystem = escapeHtml(system);
  const safeRole = escapeHtml(role);

  await transporter.sendMail({
    from: { name: process.env.SMTP_FROM_NAME || "TFRS Super Admin", address: from },
    to: email,
    subject: `Your ${system} account has been approved`,
    text: `Hello ${fullName},\n\nYour account has been approved by the Super Admin.\n\nAccess: ${system}\nRole: ${role}\n\nYou may now sign in using your verified username or email address and password.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033"><h2>Account approved</h2><p>Hello ${safeName},</p><p>Your account has been approved by the Super Admin. You may now sign in using your verified username or email address and password.</p><div style="background:#eef3fb;padding:18px;border-radius:10px"><p style="margin:0 0 8px"><strong>Access:</strong> ${safeSystem}</p><p style="margin:0"><strong>Role:</strong> ${safeRole}</p></div><p style="color:#667085;font-size:13px;margin-top:20px">If you did not request this account, contact the system administrator.</p></div>`,
  });
}
