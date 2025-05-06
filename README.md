# Local JSON Blog Server

This project is a Express-based blog site with **file-based JSON storage**. It supports three user roles:

* **Viewer**: Can view posts and comments, and add comments.
* **Blogger**: Can view and comment on any posts, plus create, edit, and delete their own posts.
* **Admin**: Can view and comment on any posts, plus delete any user’s posts and comments.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Running the Server](#running-the-server)
3. [User Roles & Usage](#user-roles--usage)

   * [Registering and Logging In](#registering-and-logging-in)
   * [Viewer](#viewer)
   * [Blogger](#blogger)
   * [Admin](#admin)
4. [Endpoints Overview](#endpoints-overview)
5. [Data Files](#data-files)
6. [Security Notes](#security-notes)
7. [HTTP Status Codes](#http-status-codes)
8. [References](#references)

---

## Project Structure

```text
blog-server/
├── data/
│   ├── users.json           # User accounts: { username, salt, hash, role }
│   ├── posts.json           # Blog posts: { id, title, content, author }
│   └── comments.json        # Comments: { id, postId, content, author }
├── public/                  # Front-end assets
│   ├── index.html           # Home page
│   ├── index_style.css      # Styles for index page
│   ├── register.html        # User registration (viewer or blogger only)
│   ├── login.html           # User login form
│   ├── dashboard.html       # Main dashboard after login
│   ├── dashboard_style.css  # Styles for dashboard
│   ├── user.html            # View a specific user's blog posts
│   ├── post.html            # View a single post and its comments
│   ├── post_styles.css      # Styles for post view page
│   ├── newpost.html         # Blogger-only: create new post
│   ├── editpost.html        # Blogger-only: edit a post
│   ├── edit_style.css       # Styles for edit page
│   ├── styles.css           # Shared site-wide styles
│   └── cat1.png             # Unique cat photo for background image
├── utils/
│   ├── db.js                # Read/write JSON files
│   └── crypto.js            # Password hashing & verification
└── server.js                # Express server setup & routes

```

---

## Running the Server

From the project root (`blog-server/`), run:

```bash
node server.js
```

The server will start on **port 3000**. Open your browser to:

```
http://localhost:3000
```

You will see the **Home** page with links to **Register** and **Login**.

---

## User Roles & Usage

### Registering and Logging In

1. **Register**:

   * On the **Register** page, new users may choose **viewer** or **blogger**.
   * **Admin** accounts are created manually and cannot be registered via this form.

     * Pre-made admin accounts:

       * Username: `admin1`, Password: `admin123`
       * Username: `admin2`, Password: `admin123`

2. **Login**:

   * On the **Login** page, enter **Username** and **Password**.
   * Successful login redirects to **Dashboard**.

---

### Viewer

After logging in as a **viewer**:

* **Dashboard**: Lists all posts with clickable titles. Click title to view full post.
* **View Post**: See post content plus comments below.
* **Add Comment**: Submit text in the comment form to post a new comment.
* **Logout**: Click **Logout** to return to **Home**.

---

### Blogger

After logging in as a **blogger**:

* **Dashboard**: Same as viewer, plus:

  * **My Blog** link to view your own posts.
  * **New Post** link to create a new post.
* **My Blog**: List your posts with **Edit** and **Delete** buttons.

  * **Edit** opens a form, sends a **PUT** request to update the post.
  * **Delete** sends a **DELETE** request to remove your post.
* **New Post**: Fill title and content to create a post.
* **Add Comment**: Same as viewer on any post page.
* **Logout**: Clears session and returns to **Home**.

---

### Admin

After logging in as an **admin** (`admin1` or `admin2`):

* **Dashboard**: Lists all posts. Each post has a **Delete** button.

  * **Delete** sends a **DELETE** request to `/posts/:id` for any post.
* **View Post**: On a post’s page, each comment has a **Delete** button.

  * **Delete** sends a **DELETE** request to `/comments/:commentId`.
* **Comment**: Admins can also add comments like viewers.
* **No New Post/Edit**: Admins cannot create or edit posts.

---

## Endpoints Overview

| Route                  | Method | Auth Required | Roles Allowed       | Description                                                        |
| ---------------------- | ------ | ------------- | ------------------- | ------------------------------------------------------------------ |
| `/register`            | POST   | No            | viewer, blogger     | Create viewer/blogger account                                      |
| `/login`               | POST   | No            | All users           | Authenticate user                                                  |
| `/posts`               | GET    | No            | All                 | List all posts                                                     |
| `/posts`               | POST   | Yes           | blogger             | Create post                                                        |
| `/posts/:id`           | PUT    | Yes           | blogger             | **PUT** updates a post’s title and content by ID (only own posts)  |
| `/posts/:id`           | DELETE | Yes           | blogger, admin      | **DELETE** removes a post by ID (blogger’s own or any for admin)   |
| `/comments/:postId`    | GET    | No            | All                 | List comments for a specific post                                  |
| `/comments/:postId`    | POST   | Yes           | All logged-in users | Add a comment to a specific post                                   |
| `/comments/:commentId` | DELETE | Yes           | commenter, admin    | **DELETE** removes a comment by ID (author’s own or any for admin) |

---

## Data Files

* \`\`: Stores `{ username, salt, hash, role }`.
* \`\`: Stores `{ id, title, content, author }`.
* \`\`: Stores `{ id, postId, content, author }`.

Files are auto-created as empty arrays (`[]`) on first run.

---

## Security Notes

* **Password Hashing & Salting**: Passwords are hashed using PBKDF2 (`crypto.pbkdf2Sync`) with a random salt.

  * A **salt** is a random string added to each password before hashing, ensuring that identical passwords produce unique hashes and protecting against rainbow-table attacks.
* User authentication requires sending `username` and `password` (JSON POST body) over localhost only.


### HTTP Status Codes

The following codes are returned by the server to indicate the outcome of each request:

| Status Code | When It’s Used                                                                                      | Meaning                                                      |
|-------------|-----------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| **200 OK**  | All successful operations (register, login, fetching, creating, updating or deleting resources).    | The request succeeded and the response contains the result. |
| **400 Bad Request** | • `POST /register` with an invalid role<br>• `POST /register` when the username already exists | The client provided malformed or invalid data.               |
| **401 Unauthorized** | • Failed login (`/login`) due to incorrect credentials<br>• Any protected route when auth fails | Authentication is required or has failed (bad credentials).  |
| **403 Forbidden**    | • `POST /posts` by non-bloggers<br>• Editing/deleting another user’s post (non-admin)<br>• Deleting another user’s comment (non-admin) | The user is authenticated but does not have permission.     |
| **404 Not Found**    | • `PUT` or `DELETE /posts/:id` when no post with that ID exists<br>• `DELETE /comments/:commentId` when no comment with that ID exists | The requested resource could not be found.                   |

## References

- **HTTP Response status codes**. MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status  
- **REST API CRUD Operations Using ExpressJS**. GeeksforGeeks. https://www.geeksforgeeks.org/rest-api-using-the-express-to-perform-crud-create-read-update-delete/

---
