import { FaUserNurse, FaUserInjured } from "react-icons/fa";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50 relative overflow-hidden">

      {/* Background Glow */}
      <div className="absolute w-[600px] h-[600px] bg-blue-300/30 rounded-full blur-3xl -top-40 -left-40"></div>
      <div className="absolute w-[600px] h-[600px] bg-emerald-300/30 rounded-full blur-3xl bottom-[-200px] right-[-150px]"></div>

      <div className="relative z-10 text-center px-6">

        {/* Title */}
        <h1 className="text-6xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
          MediCare Tracker
        </h1>

        <p className="text-gray-600 text-lg max-w-xl mx-auto mb-14">
          Smart healthcare management for caretakers and patients — simple, fast, and secure.
        </p>

        {/* Horizontal Cards */}
        <div className="flex gap-12 justify-center items-stretch flex-nowrap overflow-x-auto pb-6">

          {/* Caretaker Card */}
          <div className="group min-w-[320px] bg-white/60 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/40 hover:-translate-y-3 hover:shadow-blue-200/50 transition duration-500">

            <FaUserNurse className="text-blue-600 text-7xl mx-auto mb-6 group-hover:scale-110 transition" />

            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              For Caretakers
            </h2>

            <p className="text-gray-600 mb-8 text-sm leading-relaxed">
              Monitor patients, manage medicines, and track inventory easily.
            </p>

            <div className="flex flex-col gap-4">
              <a href="/caretaker/login" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-md">
                Login
              </a>

              <a href="/caretaker/signup" className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition">
                Sign Up
              </a>
            </div>
          </div>

          {/* Patient Card */}
          <div className="group min-w-[320px] bg-white/60 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/40 hover:-translate-y-3 hover:shadow-emerald-200/50 transition duration-500">

            <FaUserInjured className="text-emerald-500 text-7xl mx-auto mb-6 group-hover:scale-110 transition" />

            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              For Patients
            </h2>

            <p className="text-gray-600 mb-8 text-sm leading-relaxed">
              Track medications, reminders, and stay healthy every day.
            </p>

            <div className="flex flex-col gap-4">
              <a href="/patient/login" className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition shadow-md">
                Login
              </a>

              <a href="/patient/signup" className="px-6 py-3 border-2 border-emerald-500 text-emerald-500 rounded-xl font-semibold hover:bg-emerald-50 transition">
                Sign Up
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
