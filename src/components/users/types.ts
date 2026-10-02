export interface User {
 username: string;
 id: string;
 roles: ("Normal" | "Management" | "DBA" | "Analytics" | "Banned")[];
};