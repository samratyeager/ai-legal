import './globals.css'
import AuthWrapper from './AuthWrapper'

export const metadata = {
  title: 'AI Legal Assistant',
  description: 'AI Legal Assistant & Case Management Platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  )
}
