// Access token Refresh token

/**
 * Generate Token
 *
 * In terminal Token generate command on Node Mode
 * require('crypto').randomBytes(64).toString('hex')
 */

/*
const verifyFireBaseToken = async (req, res, next) => {
  // console.log("Token Verify", req.headers.authorization);

  if (!req.headers.authorization) {
    //do not allow to go
    return res.status(401).send({ message: "unauthorised access" });
  }

  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    //do not allow to go
    return res.status(401).send({ message: "unauthorised access" });
  }

  // verify Token here
  try {
    const userInfo = await admin.auth().verifyIdToken(token);
    // email set for data validation
    req.token_email = userInfo.email;
    console.log("userInfo", userInfo);
    next();
  } catch {
    return res.status(401).send({ message: "unauthorised access" });
  }
};
*/
