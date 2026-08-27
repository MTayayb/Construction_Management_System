const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function fixRoles() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = mongoose.model('User', new mongoose.Schema({ role: String }));
        const users = await User.find();

        console.log('--- FIXING ROLES ---');
        for (let user of users) {
            if (user.role) {
                const newRole = user.role.trim().toLowerCase();
                if (user.role !== newRole) {
                    console.log(`Updating user ${user._id}: "${user.role}" -> "${newRole}"`);
                    user.role = newRole;
                    await user.save();
                }
            }
        }
        console.log('--- DONE ---');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixRoles();
