import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "Task Manager",
            link: "https://taskmanagerlink.com",
        }
    });
    const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
    const emailHTML = mailGenerator.generate(options.mailgenContent);

    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS
        }
    });

    const mail = {
        from: "mail.taskmanager@example.com",
        to: options.email,
        subject: options.subject,
        text: emailTextual,
        html: emailHTML
    }

    try{
        await transporter.sendMail(mail)
    } catch(error){
        console.error("Emial service failed silently");
        console.error("Error: ", error);
    }

};



const emailVerificationMailgenContent = (username, 
verificationUrl) => {
    return {
      body: {
        name: username,
        intro: "Welcome to our App! We're excited to have you on board.",
        action: {
          intructions:
            "To verify your email please click on the following button.",
          button: {
            color: "#7C3AED",
            text: "Verify Your Email",
            link: verificationUrl
          },
        },
        outro: "Need help or have questions? Just reply to this email."
      },
    };
}

const forgotPasswordMailgenContent = (username,
PasswordresetUrl) => {
    return {
        body: {
            name: username,
            intro: "You have requested to reset your password.",
            action: {
                intructions:
                    "To reset your password please click on the following button.",
                button: {
                    color: "#7C3AED",
                    text: "Reset Password",
                    link: PasswordresetUrl
                },
            },
            outro: "If you didn't request this, please ignore this email."
        },
    };
}

export { emailVerificationMailgenContent, forgotPasswordMailgenContent, sendEmail };