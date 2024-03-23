const functions = require("@google-cloud/functions-framework");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Register a CloudEvent callback with the Functions Framework that will
// be executed when the Pub/Sub trigger topic receives a message.
functions.cloudEvent("verify_email", async (cloudEvent) => {
  // The Pub/Sub message is passed as the CloudEvent's data payload.
  const email = cloudEvent.data.message.username;

  const msg = {
    to: email,
    from: "thakkar.kara@northeastern.edu",
    subject: "Email Verification CSYE6225",
    text: "Please verify your email using the link below",
    html: "<strong>and easy to do anywhere, even with Node.js</strong>",
  };
  try {
    await sgMail.send(msg);
    console.log(`Email sent to ${name}`);
  } catch (error) {
    console.error(error);
  }
});
