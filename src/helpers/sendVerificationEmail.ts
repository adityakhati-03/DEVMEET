import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
  email: string,
  username: string,
  code: string,
  purpose: 'verify' | 'reset' = 'verify'
): Promise<{ success: boolean; message: string }> {
  const isReset = purpose === 'reset';

  const subject = isReset
    ? 'DevMeet | Reset Your Password'
    : 'DevMeet | Verify your Email Address';

  const heading = isReset
    ? `Password Reset Request`
    : `Welcome to DevMeet, ${username}`;

  const bodyText = isReset
    ? `Use the code below to reset your DevMeet password. This code expires in 1 hour. If you did not request this, you can safely ignore this email.`
    : `Please use the verification code below to activate your account. This code is securely generated and will expire in exactly 1 hour.`;

  try {
    await resend.emails.send({
      from: 'DevMeet <onboarding@resend.dev>',
      to: email,
      subject,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #080a0f; color: #ffffff; border-radius: 16px; text-align: center;">
          <h2 style="color: #34d399; font-size: 28px; font-weight: 800; margin-bottom: 24px; letter-spacing: -0.02em;">${heading}</h2>
          <p style="font-size: 16px; color: #e2e8f0; line-height: 1.6; margin-bottom: 32px;">
            ${bodyText}
          </p>
          <div style="background-color: #12141a; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
            <span style="font-size: 42px; font-weight: 800; letter-spacing: 0.25em; color: #34d399; display: block;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #94a3b8; margin-bottom: 0;">
            If you did not request this email, please ignore it or contact support immediately.
            <br/><br/>
            &copy; ${new Date().getFullYear()} DevMeet. All Rights Reserved.
          </p>
        </div>
      `,
    });

    return { success: true, message: 'Email sent successfully' };
  } catch (emailError) {
    console.error('Error sending email:', emailError);
    return { success: false, message: 'Failed to send email' };
  }
}
