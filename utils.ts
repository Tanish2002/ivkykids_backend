import jwt from "jsonwebtoken";

export function getUserFromAuthorizationHeader(authHeader: string | undefined) {
  if (!authHeader) {
    return;
  }
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return;
  }
  let user = undefined;
  try {
    user = jwt.verify(token, "TOKEN");
  } catch (err) {
    console.log(`Error while verifying jwt, err: ${err}`);
  }
  return user;
}
