import nodemailer from 'nodemailer'
import { ENV } from './env.js';

//create a transporter object using the SMTP settings
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: ENV.SMPT_USER,
    pass: ENV.SMPT_PASS,
  },
});

const sendEmail = async ({to, subject, body})=>{
    const response = await transporter.sendMail({
        from: ENV.SENDER_EMAIL,
        to,
        subject,
        html: body,
    })
    return response
}

export default sendEmail
