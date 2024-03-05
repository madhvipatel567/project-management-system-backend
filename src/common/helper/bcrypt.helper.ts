import * as bcrypt from 'bcrypt';

export function encodePassword(password: string) {
  const SALT = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, SALT);
}

export function comparePassword(password: string, hashPassword: string) {
  return bcrypt.compareSync(password, hashPassword);
}
