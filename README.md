# Project Camp Backend

A REST API for collaborative project management. Project Camp provides authentication, project and team management, tasks and subtasks, project notes, and task attachments.

## Features

- User registration, email verification, login, and password reset
- JWT authentication with access and refresh tokens
- Project and member management with role-based permissions
- Tasks with assignment, status tracking, and file attachments
- Subtasks with completion updates
- Project notes
- API health-check endpoint

## Tech stack

- Node.js 20.19+
- Express 5
- MongoDB and Mongoose
- JWT and bcrypt
- Multer for file uploads
- Nodemailer and Mailgen for email

## Getting started

### Requirements

- Node.js 20.19 or newer
- npm
- A MongoDB connection string
- SMTP credentials for verification and password-reset emails

### Install dependencies

```bash
git clone https://github.com/Mitesh-Codes/project-camp-backend.git
cd project-camp-backend
npm ci
```

### Configure environment

Create a `.env` file in the project root and set the following variables. Replace the sample values with your own. Keep `.env` private and do not commit it.

```dotenv
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/projectcamp
CORS_ORIGIN=http://localhost:5173

ACCESS_TOKEN_SECRET=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=replace-with-a-different-long-random-secret
REFRESH_TOKEN_EXPIRY=7d

MAILTRAP_SMTP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_SMTP_PORT=2525
MAILTRAP_SMTP_USER=your-smtp-username
MAILTRAP_SMTP_PASS=your-smtp-password

FORGOT_PASSWORD_REDIRECT_URL=http://localhost:5173/reset-password
SERVER_URL=http://localhost:3000
```

`CORS_ORIGIN` can contain multiple comma-separated frontend origins.

### Run the server

Start in development mode:

```bash
npm run dev
```

Start normally:

```bash
npm start
```

The server uses the port configured by `PORT`, or `3000` if it is not set.

### Check the server

```bash
curl http://localhost:3000/api/v1/healthcheck
```

## Authentication

Log in with an email address and password:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"your-password"}'
```

The response includes an access token. Send it with protected requests:

```http
Authorization: Bearer <accessToken>
```

Login also sets access and refresh token cookies. The refresh-token endpoint accepts a refresh token cookie or a `refreshToken` in the request body.

## API endpoints

All API routes are prefixed with `/api/v1`.

### Health

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/healthcheck` | Public |

### Authentication

| Method | Endpoint | Access |
| --- | --- | --- |
| `POST` | `/auth/register` | Public |
| `POST` | `/auth/login` | Public |
| `GET` | `/auth/verify-email/:verificationToken` | Public |
| `POST` | `/auth/refresh-token` | Public |
| `POST` | `/auth/forgot-password` | Public |
| `POST` | `/auth/reset-password/:resetToken` | Public |
| `POST` | `/auth/logout` | Authenticated |
| `GET` | `/auth/current-user` | Authenticated |
| `POST` | `/auth/change-password` | Authenticated |
| `POST` | `/auth/resend-email-verification` | Authenticated |

Registration accepts `username`, `email`, and `password`; `fullName` is optional. Password reset links use `FORGOT_PASSWORD_REDIRECT_URL`.

### Projects and members

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/projects` | Authenticated |
| `POST` | `/projects` | Authenticated |
| `GET` | `/projects/:projectId` | Project member |
| `PUT` | `/projects/:projectId` | Project admin |
| `DELETE` | `/projects/:projectId` | Project admin |
| `GET` | `/projects/:projectId/members` | Project member |
| `POST` | `/projects/:projectId/members` | Project admin |
| `PUT` | `/projects/:projectId/members/:userId` | Project admin |
| `DELETE` | `/projects/:projectId/members/:userId` | Project admin |

Creating a project assigns the creator the `admin` role for that project. Project creation accepts `name` and an optional `description`. Adding a member accepts `email` and `role`; changing a member’s role accepts `newRole`.

### Tasks and subtasks

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/tasks/:projectId` | Project member |
| `POST` | `/tasks/:projectId` | Project admin |
| `GET` | `/tasks/:projectId/t/:taskId` | Project member |
| `PUT` | `/tasks/:projectId/t/:taskId` | Project admin |
| `DELETE` | `/tasks/:projectId/t/:taskId` | Project admin |
| `POST` | `/tasks/:projectId/t/:taskId/subtasks` | Project admin |
| `PUT` | `/tasks/:projectId/st/:subtaskId` | Project member |
| `DELETE` | `/tasks/:projectId/st/:subtaskId` | Project admin |

Task statuses are `todo`, `in_progress`, and `done`.

Create a task with an attachment:

```bash
curl -X POST http://localhost:3000/api/v1/tasks/<projectId> \
  -H "Authorization: Bearer <accessToken>" \
  -F "title=Prepare project plan" \
  -F "description=Draft the initial plan" \
  -F "status=todo" \
  -F "attachments=@./sample.pdf"
```

To upload multiple files, add another `-F "attachments=@./another-file.pdf"` argument. Each file can be up to 2 MB. Attachments are stored in `public/images` and served publicly under `/images`; do not upload private files.

### Notes

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/notes/:projectId` | Project member |
| `POST` | `/notes/:projectId` | Project admin |
| `GET` | `/notes/:projectId/n/:noteId` | Project member |
| `PUT` | `/notes/:projectId/n/:noteId` | Project admin |
| `DELETE` | `/notes/:projectId/n/:noteId` | Project admin |

Notes use a `content` field.

## Project roles

- `admin`: Manage project details and members, notes, and tasks.
- `project_admin`: Manage tasks and subtasks.
- `member`: View project content and update subtask completion.

## Response format

Successful API responses use this structure:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Request completed successfully",
  "success": true
}
```

Errors include a message, `success: false`, and an `errors` array.

## Project structure

```text
src/
├── controllers/
├── db/
├── middlewares/
├── models/
├── routes/
├── utils/
├── validators/
├── app.js
└── index.js
```

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server with Nodemon |
| `npm start` | Start the server |# Project Camp Backend

