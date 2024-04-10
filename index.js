const functions = require("@google-cloud/functions-framework");
const mysql = require("mysql");
const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData);

const mg = mailgun.client({
  username: process.env.MAILGUN_USERNAME,
  key: process.env.MAILGUN_API_KEY,
});

const pool = mysql.createPool({
  host: process.env.SQL_HOSTNAME,
  user: process.env.SQL_USERNAME,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DATABASENAME,
});

functions.cloudEvent(process.env.PUBSUB_TOPIC_NAME, async (cloudEvent) => {
  const userDetails = JSON.parse(
    Buffer.from(cloudEvent.data.message.data, "base64").toString()
  );
  const email = userDetails["username"];
  const firstName = userDetails["first_name"];
  const id = userDetails["id"];

  const updatedMetadata = {
    id: userDetails["id"],
    timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
  };

  try {
    const queryPromise = new Promise((reslove, reject) => {
      pool.query(
        `INSERT INTO ${process.env.METADATA_TABLE_NAME} SET ?`,
        updatedMetadata,
        (error, results, fields) => {
          if (error) {
            console.error(error);
            reject(error);
          }
          console.log("Inserted " + results.affectedRows + " row(s).");
          reslove();
        }
      );
    });
    await queryPromise;

    const message = await mg.messages.create(process.env.WEBAPP_DOMAIN_NAME, {
      from: process.env.MESSAGE_FROM,
      to: [email],
      subject: "Welcome to our website! Please confirm your email",
      text: `Hello ${firstName},

      Welcome to our website! We're excited to have you here.

      Thank you for registering at our website. Please click on the following link to verify your email address: ${process.env.WEBAPP_URL}?id=${id}
      
      If you did not request this, please ignore this email.
      
      Best Regards,
      Karan Thakkar`,
      html: `<p>Hello ${firstName},</p>

      <p>Welcome to our website! We're excited to have you here.</p>

      <p>Thank you for registering at our website. Please click on the following link to verify your email address: <a href="${process.env.WEBAPP_URL}?id=${id}">${process.env.WEBAPP_URL}?id=${id}</a></p>
      
      <p>If you did not request this, please ignore this email.</p>
      
      <p>Best Regards,<br>Karan Thakkar</p>`,
    });
    console.log(message);
  } catch (error) {
    console.error(error);
  }
});
