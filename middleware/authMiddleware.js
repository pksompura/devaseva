import jwt from 'jsonwebtoken';

// Middleware to authenticate user via JWT
export const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Assuming the token is sent in the 'Authorization' header in the format 'Bearer <token>'
  console.log(token)
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token using the same secret used during generation
    const decoded = jwt.verify(token, "praveen1");
    console.log(decoded) // Ensure the secret matches the one used in token generation
    req.user = decoded; // Attach decoded token (user info) to request object
    next(); // Continue to the next middleware or route handler
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};
