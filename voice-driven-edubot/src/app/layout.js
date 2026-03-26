import '../styles/globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        {children}
      </body>
    </html>
  )
}
