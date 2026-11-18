import { RoleEnumType } from "../../database/schemas.js";

export interface User {
 _id: string;
 username: string;
 roles: RoleEnumType[];
};