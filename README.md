

DOCUMENTATION LINK : 
https://documenter.getpostman.com/view/44305072/2sB2qi8ddN






+## About The Project
+
+`BETWISE_SPORT_BETTING_APP` is a backend application for a sports betting platform, built with Node.js and Express. It handles user authentication, bet management, and interactions with sports data.
+
+
+## Features 
+
+*   User registration and login (using `bcrypt` for password hashing, `jsonwebtoken` for sessions)
+*   API endpoint protection
+*   Database interaction with MongoDB (using `mongoose`)
+*   Email functionalities (using `nodemailer`, for verification, password resets)
+*   External API interactions (using `axios`)
+*   Cookie-based session management (using `cookie-parser`)
+
+
+## Built With (the following major frameworks, libraries, and tools):
+
+*   Node.js - JavaScript runtime environment
+*   Express.js - Web application framework for Node.js
+*   MongoDB - NoSQL database
+*   Mongoose - MongoDB object modeling for Node.js
+*   JSON Web Tokens (JWT) - For secure authentication
+*   Bcrypt.js - For password hashing
+*   Nodemailer - For sending emails
+*   Axios - Promise-based HTTP client
+*   Dotenv - For managing environment variables
+*   Cookie-parser - Middleware for parsing cookies
+*   Nodemon - Utility for auto-restarting the server during development
+
+## Prerequisites
+
+*   **Node.js:** 
+*   **npm:** (Usually comes with Node.js)
+*   **MongoDB:** A running instance of MongoDB (local or cloud-based like MongoDB Atlas).
+
+## Getting Started
+
+To get a local copy up and running, follow these simple steps.
+
+### Installation
+
+1.  **Clone the repository: git clone https://github.com/Olanrewaju-Y/BETWISE_SPORT_BETTING_APP.git
+    ```
+2.  **Navigate to the project directory:   cd BETWISE_SPORT_BETTING_APP
+    ```
+3.  **Install NPM packages:  npm install
+    ```
+
+### Environment Variables 
+
+```env
+PORT=3000 - Example
+MONGODB_URI=mongodb://localhost:27017/betwise_db # Or your MongoDB Atlas connection string
+ACCESS_TOKEN=your_very_strong_jwt_secret 
+REFRESH_TOKEN=your_very_strong_jwt_secret
+
+# Nodemailer configuration (example for Gmail, adjust for your provider)
+EMAIL_HOST=smtp.gmail.com
+EMAIL_PORT=587 # or 465 for SSL
+EMAIL_SECURE=false # true for 465, false for other ports
+EMAIL=your_email@gmail.com
+PASSWORD=your_email_app_password
+
+# Flutterwave payment gateway
+FLW_PUBLIC_KEY = public_key_from_flutterwave
+FLW_SECRET_KEY = secret_key_from_flutterwave
+FLW_SECRET_HASH = secret_hash_key_from_flutterwave
+
+# Other variables
+CLIENT_APP_URL= http://localhost:3000 # Or actual frontend URL - example
+```
+
+*Note: Do not commit your actual `.env` file to version control. Add `.env` to your `.gitignore` file.*
+
+## Usage
+
+1.  **Start the development server (with auto-reload using Nodemon): npm run dev
+    ```
+    The server will typically start on the port defined in your `.env` file (e.g., `http://localhost:3000`).
+
+2.  **Start the production server: npm start
+    ```
+
+## API Documentation
+
+Detailed API documentation, including available endpoints, request/response formats, and authentication details, can be found on Postman:
+Documentation link : https://documenter.getpostman.com/view/44305072/2sB2qi8ddN
+
+## Running Tests
+
+
+1.  Install your chosen testing framework(s) as dev dependencies:
+    ```sh
+    npm install --save-dev jest supertest # Example with Jest and Supertest
+    ```
+2.  Update the `test` script in your `package.json`:
+    ```json
+    "scripts": {
+      "test": "jest"
+    }
+    ```
+3.  Create your test files (e.g., in a `__tests__` directory or with `.test.js` suffix).
+4.  Run tests:
+    ```sh
+    npm test
+    ```
+
+## Project Structure 
+
+```
+/
+├── config/         # Configuration files (e.g., database, passport)
+├── controllers/    # Request handlers
+├── middleware/     # Custom Express middleware
+├── models/         # Mongoose models
+├── routes/         # API route definitions
+├── services/       # Business logic, external API interactions
+├── utils/          # Utility functions
+├── .env            # Environment variables (ignored by Git)
+├── .gitignore      # Specifies intentionally untracked files that Git should ignore
+├── package.json    # Project metadata and dependencies
+├── server.js       # Main application entry point
+└── README.md       # This file
+```
+
+## Contributing
+
+Contributions are welcome! If you'd like to contribute, please follow these steps:
+
+1.  Fork the Project
+2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
+3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
+4.  Push to the Branch (`git push origin feature/AmazingFeature`)
+5.  Open a Pull Request
+
+## License
+
+See the `license` field in `package.json` for more information.
+
+## Contact
+
+Olanrewaju Y - (Your Email or Social Media Link)
+Project Link: https://github.com/Olanrewaju-Y/BETWISE_SPORT_BETTING_APP.git
+
+## Acknowledgements
+
+Special thanks to Dev: David Sampson
+
+```



