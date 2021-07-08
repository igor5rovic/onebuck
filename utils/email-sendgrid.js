const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email, 
        from: 'andrew@mead.io', //nas email....
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.
        <p>Hello ${this.firstName}</p>
        <p>'Welcome to the OneBuck.store Family!'</p>
        <p>We hope You can find a product just for you in our store, and we wish You a pleasant experience with our service.<p> 
        <p>Best regards!</p>
        <p>OneBuck.store team</p>
        `,
        html:`
        <p>Hello ${this.firstName}</p>
        <p>'Welcome to the OneBuck.store Family!'</p>
        <p>We hope You can find a product just for you in our store, and we wish You a pleasant experience with our service.<p> 
        <p>Best regards!</p>
        <p>OneBuck.store team</p>
        `
    })
}

const sendPasswordReset = (email, url) => {
    sgMail.send({
        to: email,
        from: 'andrew@mead.io', // nas email koji smo registovali za domen/vebsajt
        subject: 'Your password reset token (valid for only 10 minutes)',
        text: `You have requested password reset on onebuck.store;
        Please follow the next link and enter a new password.
        Hope to see you soon, best regards!
        <a href="${url}">click here</a>`,
        html: `
        <p>You have requested password reset on onebuck.store</p>
        <p>Please follow the next link and enter a new password</p>
        <p>Hope to see you soon, best regards!</p>
        <a href="${this.url}">click here</a>
        `
    })
}

const sendContactMessage = (name) => {
    sgMail.send({
        to: 'pera@zdera.io', //ovde mozda mozemo da upisemo nas mail na kome nam salju
        from: 'pera@zdera.io', //ovde treba veze nemam sta, da li isti
        subject: 'Somebody Contacted You on OneBuck.store!',
        text: ` Hello mr. ${name}.
        Someone contacted you from OneBuck.store website!
        Here you can see the message:
          Nekako da dodamo jos text poruke
        Best regards!
        OneBuck.store team`,
        html:`
        <p>Hello mr. ${this.firstName}</p>
        <p>'Someone contacted you from OneBuck.store website!'</p>
        <p>Here you can see the message:<p>
        <p>
          Nekako da dodamo jos text poruke
        </p>
        <p>Best regards!</p>
        <p>OneBuck.store team</p>
        `
    })
}

module.exports = {
    sendWelcomeEmail,
    sendPasswordReset,
    sendContactMessage
}