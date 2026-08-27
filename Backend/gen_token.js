const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env' });

// Replace with an actual Client ID from the DB dump (e.g., Ali Raza)
const clientId = '695eadcf841a3393aa1c653b';

const token = jwt.sign({ id: clientId }, process.env.JWT_SECRET, { expiresIn: '7d' });
console.log('CLIENT_TOKEN=' + token);
process.exit();
