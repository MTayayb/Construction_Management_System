const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function checkDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = mongoose.model('User', new mongoose.Schema({ name: String, email: String, role: String }));
        const users = await User.find();
        console.log('--- USERS ---');
        users.forEach(u => console.log(`ID: ${u._id}, Name: ${u.name}, Role: "${u.role}"`));

        const Project = mongoose.model('Project', new mongoose.Schema({ name: String, hiddenFromAdmin: Boolean, hiddenFromEngineer: Boolean }));
        const projects = await Project.find();
        console.log('--- PROJECTS ---');
        console.log(projects);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDB();
