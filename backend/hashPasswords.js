const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const users = [
  {
    name: "Admin",
    email: "admin@gmail.com",
    password: "admin123",
    role: "admin",
    register_number: null,
    department: null,
    image: null,
    year: null,
    auth_provider: "local",
  },
  {
    name: "Student1",
    email: "student1@gmail.com",
    password: "student123",
    role: "student",
    register_number: "7376242CS191",
    department: "CSE",
    image: "/images/s1.avif",
    year: 1,
    auth_provider: "local",
  },
  {
    name: "Student2",
    email: "Student2@gmail.com",
    password: "student123",
    role: "student",
    register_number: "7376242IT192",
    department: "IT",
    image: "/images/s2.jpeg",
    year: 2,
    auth_provider: "local",
  },
  {
    name: "Student3",
    email: "Student3@gmail.com",
    password: "student123",
    role: "student",
    register_number: "7376242EE193",
    department: "EEE",
    image: "/images/s3.jpeg",
    year: 3,
    auth_provider: "local",
  },
  {
    name: "Student4",
    email: "Student4@gmail.com",
    password: "student123",
    role: "student",
    register_number: "7376242ME194",
    department: "MECH",
    image: "/images/s4.jpeg",
    year: 4,
    auth_provider: "local",
  },
  {
    name: "Jones Samraj",
    email: "jonessamrajb.it24@bitsathy.ac.in",
    password: "student123",
    role: "student",
    register_number: "7376242IT191",
    department: "IT",
    image: "/images/s4.jpeg",
    year: 4,
    auth_provider: "google",
  },
];

db.connect((err) => {
  if (err) {
    console.error("DB Connection Error:", err);
  } else {
    console.log("Connected to Database...");
    hashPasswordsAndInsert();
  }
});

async function hashPasswordsAndInsert() {
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    try {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      db.query(
        `INSERT INTO authentication 
          (name, email, password, role, register_number, department, image, year, auth_provider) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
          name = VALUES(name), 
          password = VALUES(password),
          role = VALUES(role),
          register_number = VALUES(register_number),
          department = VALUES(department),
          image = VALUES(image),
          year = VALUES(year),
          auth_provider = VALUES(auth_provider)`,
        [
          user.name,
          user.email,
          hashedPassword,
          user.role,
          user.register_number,
          user.department,
          user.image,
          user.year,
          user.auth_provider,
        ],
        (err, result) => {
          if (err) console.error("Insert Error:", err);
          else console.log(`${user.name} inserted`);
          if (i === users.length - 1) {
            db.end((err) => {
              if (err) console.error("Error closing DB:", err);
              else console.log("Database connection closed successfully");
            });
          }
        }
      );
    } catch (err) {
      console.error("Hashing Error:", err);
    }
  }
}
