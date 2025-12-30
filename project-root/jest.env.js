import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

console.log("Sanity check MONGO_URI:", process.env.MONGO_URI);
console.log("Loaded MONGO_URI:", process.env.MONGO_URI);