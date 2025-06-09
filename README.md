# 🏆 BETWISE Sports Betting App

📄 **API Documentation**  
👉 [View on Postman](https://documenter.getpostman.com/view/44305072/2sB2qi8ddN)

---

## 🚀 About the Project

**BETWISE_SPORT_BETTING_APP** is a backend application for a sports betting platform, developed using **Node.js** and **Express**. It handles:

- User authentication
- Bet management
- Email notifications
- Payment gateway integration
- Interaction with sports data APIs

---

## ✨ Features

- 🔐 User registration & login (with **bcrypt** and **JWT**)
- 🛡️ Secured API endpoints
- 💾 MongoDB integration via **Mongoose**
- 📧 Email verification & password reset via **Nodemailer**
- 🌍 External API interaction using **Axios**
- 🍪 Cookie-based session management
- 💳 Payment integration with **Flutterwave**

---

## 🛠️ Built With

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [jsonwebtoken (JWT)](https://github.com/auth0/node-jsonwebtoken)
- [bcrypt.js](https://github.com/dcodeIO/bcrypt.js)
- [Nodemailer](https://nodemailer.com/about/)
- [Axios](https://axios-http.com/)
- [Dotenv](https://www.npmjs.com/package/dotenv)
- [cookie-parser](https://www.npmjs.com/package/cookie-parser)
- [Nodemon](https://www.npmjs.com/package/nodemon)

---

## ✅ Prerequisites

Make sure you have the following installed:

- Node.js (v14+ recommended)
- npm (comes with Node.js)
- MongoDB (local or Atlas)

---

## 📦 Getting Started

### 🧰 Installation

1. Clone the repo:

    ```bash
    git clone https://github.com/Olanrewaju-Y/BETWISE_SPORT_BETTING_APP.git
    cd BETWISE_SPORT_BETTING_APP
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory and configure it as below.

---

### ⚙️ Environment Variables

```env
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/betwise_db

# JWT secrets
ACCESS_TOKEN=your_access_token_secret
REFRESH_TOKEN=your_refresh_token_secret

# Nodemailer (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL=your_email@gmail.com
PASSWORD=your_email_app_password

# Flutterwave
FLW_PUBLIC_KEY=your_flutterwave_public_key
FLW_SECRET_KEY=your_flutterwave_secret_key
FLW_SECRET_HASH=your_flutterwave_hash

# Client URL
CLIENT_APP_URL=http://localhost:3000

Note: Add .env to your .gitignore to avoid leaking credentials.

```


### ▶️ Usage

1. Start the development server (with auto-reload using Nodemon):

```bash
npm run dev
```
Server runs on http://localhost:3000 (or port defined in .env).

2. Start the production server:

```bash
npm start

```


### API Documentation
Detailed API documentation, including available endpoints, request/response formats, and authentication details, can be found on Postman:
Postman API Documentation


### Running Tests
1. Install testing frameworks as dev dependencies (example using Jest and Supertest):
```bash
npm install --save-dev jest supertest
```
    
2. Update the test script in your package.json to: 
```bash
"scripts": {
  "test": "jest"
}
```
3. Create your test files (e.g., in a __tests__ directory or with .test.js suffix).

4. Run tests:
```bash
npm test
```

### Project Structure
```bash
/
├── config/         # Configuration files (e.g., database, passport)
├── controllers/    # Request handlers
├── middleware/     # Custom Express middleware
├── models/         # Mongoose models
├── routes/         # API route definitions
├── services/       # Business logic, external API interactions
├── utils/          # Utility functions
├── .env            # Environment variables (ignored by Git)
├── .gitignore      # Specifies intentionally untracked files that Git should ignore
├── package.json    # Project metadata and dependencies
├── server.js       # Main application entry point
└── README.md       # This file

```

### Contributing
Contributions are welcome! Please follow these steps:

1. Fork the Project
2. Create your Feature Branch (git checkout -b feature/AmazingFeature)
3. Commit your Changes (git commit -m 'Add some AmazingFeature')
4. Push to the Branch (git push origin feature/AmazingFeature)
5. Open a Pull Request


### License
See the license field in package.json for more information.


### Contact
Olanrewaju Y - (Your Email or Social Media Link)
Project Link: https://github.com/Olanrewaju-Y/BETWISE_SPORT_BETTING_APP.git


### Acknowledgements
Special thanks to Dev: David Sampson







