# Media Muse

This is a Next.js application built with Firebase Studio that uses generative AI to create captions and suggest music for your images.

## Getting Started

To run this project locally, follow these steps:

### 1. Clone the Repository

First, clone this repository to your local machine.

### 2. Install Dependencies

Navigate to the project directory and install the necessary dependencies using npm:

```bash
cd <your-project-directory>
npm install
```

### 3. Set Up Environment Variables

The application requires a Gemini API key to use the generative AI features.

1.  Create a new file named `.env.local` in the root of your project directory.
2.  Add your Gemini API key to this file:

    ```
    GEMINI_API_KEY="YOUR_API_KEY_HERE"
    ```

    You can get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

### 4. Run the Development Server

Once the dependencies are installed and the environment variable is set, you can start the development server:

```bash
npm run dev
```

This will start two services:
- The Next.js application, typically on [http://localhost:9002](http://localhost:9002).
- The Genkit AI development server.

Open your browser and navigate to the Next.js application URL to see the app in action. Any changes you make to the code will automatically reload the application.
