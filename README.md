# AI-Powered To-Do List PWA

A minimal, fast, and mobile-friendly **Progressive Web App** for managing tasks.  
Designed for real-world use with **AI-assisted task parsing** and **Firestore-powered real-time sync**.

## Features

- **AI-Assisted Task Creation**  
  Add tasks in natural language — the app uses AI to automatically extract:
  - Task title  
  - Participants  
  - Due dates (in ISO 8601)  

- **Real-Time Updates**  
  All tasks are stored in **Firebase Firestore**, so changes sync instantly across devices.

- **Progressive Web App (PWA)**  
  - Installable on iOS, Android, and desktop.
  - Works offline after the first load.

- **Task Management**  
  - **Mark tasks as completed** *(currently deletes them, but planned upgrade to status tracking)*  
  - **Delete tasks** outright if no longer relevant.

- **Simple, Clean UI**  
  Built with **React**, **Tailwind CSS with shadcn**, and **Firebase Hosting**.

## Tech Stack

| Technology   | Purpose                            |
|-------------|------------------------------------|
| React       | Frontend UI                        |
| TailwindCSS | Styling                            |
| Firebase    | Auth, Firestore, Hosting           |
| Groq API    | Natural language task parsing      |
| Vite        | Build tool for fast development    |

## Installation

1. **Clone the repository**
   git clone https://github.com/AliShakhzodov/AI-To-Do-List-App.git
   cd ai-todo-pwa
Install dependencies

npm install
Configure Firebase

Create a Firebase project

Set up Firestore and Hosting

Add your config to firebase.js

Set up Groq API Key

Create a .env file in the project root:

VITE_GROQ_API_KEY=your_api_key_here

Run the app

npm run dev

Usage
Type natural language tasks like:

"Meeting with John and Sarah on Tuesday at 3 PM"
The app will parse it into:

{
  "title": "Meeting",
  "participants": ["John", "Sarah"],
  "due_date_iso": "2025-08-21T15:00:00Z"
}
Mark tasks as completed or delete them entirely.

Syncs instantly across all logged-in devices.

Roadmap
 Mark tasks as completed instead of deleting them

 Filter tasks by participant, due date, or completion status

 Notifications for upcoming deadlines

 Shared task lists for families or teams