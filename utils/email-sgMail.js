const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
//ES6
/*sgMail
  .send(msg)
  .then(() => {}, error => {
    console.error(error);

    if (error.response) {
      console.error(error.response.body)
    }
  });*/

const sendPasswordReset = (email, url) => {
  return sgMail.send({
      to: email,
      from: 'support@onebuck.store',
      subject: 'Your password reset token (valid for only 10 minutes)',
      text: `You have requested password reset on onebuck.store;
      Please follow the next link and enter a new password.
      Hope to see you soon, best regards!
      click here`,
      html: `
      <p>You have requested password reset on onebuck.store</p>
      <p>Please follow the next link and enter a new password</p>
      <p>Hope to see you soon, best regards!</p>
      <a href="${url}">click here</a>
      `
  })
}

const sendContactMessageEmail = (message, senderEmail) => {
  return sgMail.send({
      to: 'support@onebuck.store',
      from: 'support@onebuck.store',
      subject: 'Somebody Contacted You on OneBuck.store!',
      text: ` Hello mr. Petrovic.
      Someone contacted you from OneBuck.store website! sender email: ${senderEmail}
      Here you can see the message:
        ${message}
      Best regards!
      OneBuck.store team`,
      html:`
      <p>Hello mr. Petrovic</p>
      <p>'Someone contacted you from OneBuck.store website!' sender email: ${senderEmail}</p>
      <p>Here you can see the message:<p>
      <p>
      ${message}
      </p>
      <p>Best regards!</p>
      <p>OneBuck.store team</p>
      `
  })
}

module.exports = {
  sendPasswordReset,
  sendContactMessageEmail
}