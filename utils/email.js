const nodemailer = require('nodemailer');
//const htmlToText = require('html-to-text');
//TODO: sredi ovaj gore modul
module.exports = class Email {
  constructor(user, url, text) {
    this.to = user.email;
    this.firstName = user.firstName;
    this.url = url;
    this.from = `OneBuck Store <${process.env.EMAIL_FROM}>`;
    this.text = text;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      /*return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        },
        tls: {
          // do not fail on invalid certs
          rejectUnauthorized: false
        }
      });*/
      return nodemailer.createTransport({
        host: "mail.privateemail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.PRIVATEEMAIL_USER,
          pass: process.env.PRIVATEEMAIL_PASS
        },
        tls: {
          // do not fail on invalid certs
          rejectUnauthorized: false
        }
      });
    }
    //jos ne radim sa sendgrid

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    // FIXME: odraditi templejte i sve ovo ali u ejsu?

    let html = '';
    
    if(template === 'passwordReset'){
      html = `
    <p>You have requested password reset on onebuck.store</p>
    <p>Please follow next link and enter new password</p>
    <p>Hope to see you soon, best regards!</p>
    <a href="${this.url}">click here</a>
    `;
    }

    if(template === 'welcome'){
      html = `
    <p>Hello ${this.firstName}</p>
    <p>'Welcome to the OneBuck.store Family!'</p>
    <p>We hope You can find a product just for you in our store, and we wish You a pleasant experience with our service.<p> 
    <p>Best regards!</p>
    <p>OneBuck.store team</p>
    `;
    }

    //test test test
    if(template === 'contact'){
      html = `
    <p>Hello mr. Petrovic</p>
    <p>'Someoune contacted you from OneBuck.store website!'</p>
    <p>Sender email: ${this.firstName}</p>
    <p>Here you can see the message:<p>
    <p>
      ${this.text}
    </p>
    <p>Best regards!</p>
    <p>OneBuck.store team</p>
    `;
    }
    
    /*const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });*/

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html //FIXME: treba da ima i tekst, verovatno isti kao html, zato i ovo dole
      // text: htmlToText.fromString(html)
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the OneBuck.store Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }

  //da probamo da posaljemo sebi mejl iz ove klase, znaci preko kontekt forme na sajktu
  async contactMe() {
    await this.send('contact', 'contact msg from OneBuck.store');
  }
};
