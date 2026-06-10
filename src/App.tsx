import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RootLayout } from '@/components/layout/RootLayout'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { HomePage } from '@/pages/HomePage'
import { HistoryPage } from '@/pages/HistoryPage'
import { PlayersPage } from '@/pages/PlayersPage'
import { MyStatsPage } from '@/pages/MyStatsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<HomePage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="players" element={<PlayersPage />} />
            <Route path="my-stats" element={<MyStatsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
