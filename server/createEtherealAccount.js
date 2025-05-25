const nodemailer = require('nodemailer');

nodemailer.createTestAccount((err, account) => {
    if (err) {
        console.error('Error creating test account:', err);
        return;
    }

    console.log('Test Account created successfully:');
    console.log('Username:', account.user);
    console.log('Password:', account.pass);
});
