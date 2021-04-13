const mailjet = require ('node-mailjet')
    .connect(process.env.MJ_APIKEY_PUBLIC, process.env.MJ_APIKEY_PRIVATE)
/*const request = mailjet
    .post("send", {'version': 'v3.1'})
    .request({
        "Messages":[{
            "From": {
                "Email": "pilot@mailjet.com",
                "Name": "Mailjet Pilot"
            },
            "To": [{
                "Email": "passenger1@mailjet.com",
                "Name": "passenger 1"
            }],
            "Subject": "Your email flight plan!",
            "TextPart": "Dear passenger 1, welcome to Mailjet! May the delivery force be with you!",
            "HTMLPart": "<h3>Dear passenger 1, welcome to <a href=\"https://www.mailjet.com/\">Mailjet</a>!</h3><br />May the delivery force be with you!"
        }]
    })
request
    .then((result) => {
        console.log(result.body)
    })
    .catch((err) => {
        console.log(err.statusCode)
    })*/

    const sendPasswordReset = (email, url) => {
    const request = mailjet
    .post("send", {'version': 'v3.1'})
    .request({
        "Messages":[{
            "From": {
                "Email": "support@onebuck.store"
            },
            "To": [{
                "Email": email
            }],
            "Subject": "Your password reset token (valid for only 10 minutes)",
            "TextPart": `You have requested password reset on onebuck.store;
            Please follow next link and enter new password.
            Hope to see you soon, best regards!
            click here`,
            "HTMLPart": `
            <p>You have requested password reset on onebuck.store</p>
            <p>Please follow next link and enter new password</p>
            <p>Hope to see you soon, best regards!</p>
            <a href="${url}">click here</a>
            `
        }]
    })
    return request
    }

    const sendContactMessageEmail = (message, senderEmail) => {
      const request = mailjet
      .post("send", {'version': 'v3.1'})
      .request({
        "Messages":[{
            "From": {
                "Email": "support@onebuck.store"
            },
            "To": [{
                "Email": "support@onebuck.store"
            }],
            "Subject": "Somebody Contacted You on OneBuck.store!",
            "TextPart": ` Hello mr. Petrovic.
            Someoune contacted you from OneBuck.store website! sender email: ${senderEmail}
            Here you can see the message:
              ${message}
            Best regards!
            OneBuck.store team`,
            "HTMLPart": `
            <p>Hello mr. Petrovic</p>
            <p>'Someoune contacted you from OneBuck.store website!' sender email: ${senderEmail}</p>
            <p>Here you can see the message:<p>
            <p>
            ${message}
            </p>
            <p>Best regards!</p>
            <p>OneBuck.store team</p>
            `
        }]
    })
    return request
    }

    module.exports = {
      sendPasswordReset,
      sendContactMessageEmail
    }