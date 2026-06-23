import { Client, Account, Databases, Query, ID } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1")
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "");

export const account = new Account(client);
export const databases = new Databases(client);
export { Query, ID };

export const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DB_ID ?? "memoriq";
export const PROFILES_COL = "profiles";
export const ATTEMPTS_COL = "attempts";
