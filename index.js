const functions = require("@google-cloud/functions-framework");
const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "karan009",
  key: process.env.MAILGUN_API_KEY,
});

// Register a CloudEvent callback with the Functions Framework that will
// be executed when the Pub/Sub trigger topic receives a message.
functions.cloudEvent("verify_email", async (cloudEvent) => {
  // The Pub/Sub message is passed as the CloudEvent's data payload.
  // The Pub/Sub message is passed as the CloudEvent's data payload.
  const userDetails = Buffer.from(cloudEvent.data.message.data, "base64");

  const email = userDetails["username"];
  const verificationLink =
    userDetails["verificationLink"] ||
    "https://www.youtube.com/watch?v=O1RpPG7Kb1s&list=RDMMow77NqggH-0&index=3";
  const firstName = userDetails["first_name"];

  mg.messages
    .create("karanthakkar.me", {
      from: "noreply@karanthakkar.me",
      to: [email],
      subject: "Please verify your email address",
      text: `Dear ${firstName},

      Thank you for registering at our website. Please click on the following link to verify your email address: 
      
      If you did not request this, please ignore this email.
      
      Best Regards,
      Karan Thakkar`,
      html: `<p>Dear ${firstName},</p>

      <p>Thank you for registering at our website. Please click on the following link to verify your email address: <a href="${verificationLink}">${verificationLink}</a></p>
      
      <p>If you did not request this, please ignore this email.</p>
      
      <p>Best Regards,<br>Karan Thakkar</p>`,
    })
    .then((msg) => console.log(msg)) // logs response data
    .catch((err) => console.log(err));
});
