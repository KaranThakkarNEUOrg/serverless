const functions = require("@google-cloud/functions-framework");
const mysql = require("mysql");
const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData);

const mg = mailgun.client({
  username: process.env.mailgun_username,
  key: process.env.MAILGUN_API_KEY,
});

const pool = mysql.createPool({
  host: process.env.sql_hostname,
  user: process.env.sql_username,
  password: process.env.sql_password,
  database: process.env.sql_databasename,
});

functions.cloudEvent(process.env.pubsub_topic_name, async (cloudEvent) => {
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
        `INSERT INTO ${process.env.metadata_table_name} SET ?`,
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

    const message = await mg.messages.create(process.env.webapp_domain_name, {
      from: process.env.message_from,
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
