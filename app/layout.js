import "./globals.css";
import Navbar from "@/components/Navbar";
import SessionProvider from "./SessionProvider";
import { AppProvider } from "@/context/AppContext";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Script from "next/script"; // Pour charger Kakapay correctement


export const metadata = {
    title: "PlawimAdd - E-commerce",
    description: "Un site e-commerce construit avec Next.js",
};

export default function RootLayout({ children }) {
    return (
        <html lang="fr">
            <body>
                <SessionProvider>
                    <AppProvider>
                        <Navbar />
                        {children}
                        <ToastContainer
                            position="bottom-right"
                            autoClose={3000}
                            hideProgressBar={false}
                            newestOnTop={false}
                            closeOnClick
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                            toastClassName="relative flex p-1 min-h-10 rounded-md justify-between overflow-hidden cursor-pointer bg-zinc-50/100 shadow-lg"
                            bodyClassName="text-sm font-white flex p-3"
                        />
                    </AppProvider>
                </SessionProvider>

                {/* Script Kakapay chargé proprement */}
                <Script
                    src="https://cdn.kkiapay.me/k.js"
                    strategy="afterInteractive"
                />
            </body>
        </html>
    );
}
