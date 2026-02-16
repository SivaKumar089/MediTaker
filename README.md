# 🏥 MediTaker

**MediTaker** is a modern healthcare management platform designed to bridge the gap between patients and caretakers. It facilitates seamless medication tracking, daily health check-ins, and real-time communication to ensure better healthcare outcomes.

---

## 🚀 Features

### 👤 For Patients
- **Medication Management**: Track daily medications, dosages, and schedules.
- **Daily Check-ins**: Submit check-ins with photo proof of medication intake.
- **Caretaker Connection**: Connect with trusted caretakers for remote monitoring.
- **Health Dashboard**: Visualize health trends and medication adherence.

### 👩‍⚕️ For Caretakers
- **Patient Monitoring**: View real-time updates on patient adherence and health status.
- **Appointment Scheduling**: Integrated calendar for managing patient visits.
- **Analytics**: Comprehensive charts showing patient progress over time.
- **Patient Discovery**: Search and connect with patients needing care.

### 💬 Common Features
- **Real-time Messaging**: Instant communication between patients and caretakers.
- **Notifications**: Instant alerts for medication times and message updates.
- **Responsive Design**: Fully optimized for Desktop, Tablet, and Mobile.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend & Database**: [Supabase](https://supabase.com/) (Auth, PostgreSQL, Realtime, Storage)
- **Charts**: [Recharts](https://recharts.org/)
- **Calendar**: [FullCalendar](https://fullcalendar.io/)
- **Animations**: [AOS (Animate On Scroll)](https://michalsnik.github.io/aos/)
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/)

---

## 📋 Step-by-Step Setup Guide

Follow these steps to get the project running locally:

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (Version 18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### 2. Clone the Repository
```bash
git clone https://github.com/Sivakumar089/Meditaker.git
cd Meditaker/MediTaker
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Environment Configuration
Create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Running Locally
Start the development server:
```bash
npm run dev
```
The app should now be running at `http://localhost:5173`.

### 6. Building for Production
To create an optimized production build:
```bash
npm run build
```

---

## 📜 Project Rules & Guidelines (REUI)

To maintain code quality and consistency, please follow these "rules":

1. **Strict Typing**: Always use TypeScript types/interfaces. Avoid using `any`.
2. **Component Structure**: Keep components small and reusable. Place them in `src/components`.
3. **Service Layer**: All database interactions must go through the service files in `src/services`.
4. **State Management**: Use React Hooks and Context API for global state.
5. **Styling**: Use Tailwind CSS classes. Avoid inline styles unless necessary for dynamic values.
6. **PR Protocol**: 
    - Ensure the code passes `npm run lint`.
    - Provide a clear description of changes in pull requests.
    - Test mobile responsiveness before submitting.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

*Made with ❤️ for better healthcare.*
