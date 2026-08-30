
const transporter = require("../config/nodemailer");

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"HOME STORE" <${process.env.EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email Sent");
    console.log(info);

  } catch (err) {
    console.log("❌ Email Error");
    console.log(err);
  }
};

module.exports = sendEmail;