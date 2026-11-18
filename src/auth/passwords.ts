import bcrypt from "bcrypt"


export const hash_password = async (password: string) => {
  const salt = bcrypt.genSaltSync(); // default 10
  return await bcrypt.hash(password, salt);
};

export const compare_password = async (password: string, pass_hash: string) =>
  await bcrypt.compare(password, pass_hash);
