import { Geist, Geist_Mono } from "next/font/google";
import { games } from "@/utils/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Game hub",
  description: "Game hub",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen flex flex-col bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500`}
      >
        <header className="bg-gray-900 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <a href="/" className="hover:text-gray-300 transition-colors">
              <h1 className="text-xl font-semibold">Game hub</h1>
            </a>
            <div className="flex gap-4">
              {games.map((game) => (
                <a href={game.path} className="hover:text-gray-300 transition-colors">
                  {game.title}
                </a>
              ))}
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
